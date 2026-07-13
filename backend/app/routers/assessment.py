from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from typing import List

from app.database import get_db, get_mongo_db
from app import models, schemas
from app.auth import get_current_user
from app.scoring_engine import (
    calculate_skin_health_score,
    calculate_s_cond,
    calculate_l_habits,
    calculate_s_sleep,
    calculate_h_hydro,
    calculate_r_consist
)

router = APIRouter(prefix="/api/v1/assessment", tags=["Skin Assessment"])


def identify_skin_concerns(concerns_list: List[schemas.ConcernSeverityIn]):
    """
    Scans the user's self-reported issues and sorts/flags them by severity.
    High: weight 3
    Medium: weight 2
    Low: weight 1
    Active flare-up adds a massive weight boost (+10) to make it the top priority.
    """
    def get_priority(c: schemas.ConcernSeverityIn):
        sev = c.severity.lower()
        weight = 1
        if sev == "high":
            weight = 3
        elif sev == "medium":
            weight = 2
            
        if c.is_active_flareup:
            weight += 10
        return weight

    sorted_concerns = sorted(concerns_list, key=get_priority, reverse=True)
    return sorted_concerns


def generate_default_routine(user_id: str, skin_type: str, primary_concern: str, is_sensitive: bool, db: Session):
    """
    Helper function to generate and seed a routine inside the assessment flow.
    """
    templates = {
        "oily": {
            "AM": ["Cleansing", "Treatment", "Sun Protection"],
            "PM": ["Cleansing", "Treatment", "Night Care"],
            "Weekly": ["Exfoliation"]
        },
        "sensitive": {
            "AM": ["Cleansing", "Moisturizing", "Sun Protection"],
            "PM": ["Cleansing", "Moisturizing"],
            "Weekly": ["Gentle Mask"]
        },
        "dry": {
            "AM": ["Cleansing", "Moisturizing", "Sun Protection"],
            "PM": ["Cleansing", "Treatment", "Moisturizing"],
            "Weekly": ["Hydrating Mask"]
        },
        "combination": {
            "AM": ["Cleansing", "Treatment", "Sun Protection"],
            "PM": ["Cleansing", "Moisturizing", "Night Care"],
            "Weekly": ["Exfoliation"]
        },
        "normal": {
            "AM": ["Cleansing", "Moisturizing", "Sun Protection"],
            "PM": ["Cleansing", "Moisturizing"],
            "Weekly": ["Gentle Exfoliation"]
        }
    }
    
    skin_type_val = skin_type.lower()
    if skin_type_val not in templates:
        skin_type_val = "normal"
        
    template = templates[skin_type_val]
    
    am_steps = list(template["AM"])
    pm_steps = list(template["PM"])
    weekly_steps = list(template["Weekly"])
    
    # Safety Check: If skin is sensitive (either type or flagged), intercept and swap harsh steps
    if skin_type_val == "sensitive" or is_sensitive:
        for idx, step in enumerate(am_steps):
            if step in ["Treatment", "Exfoliation"]:
                am_steps[idx] = "Moisturizing"
        for idx, step in enumerate(pm_steps):
            if step in ["Treatment", "Exfoliation"]:
                pm_steps[idx] = "Moisturizing"
        for idx, step in enumerate(weekly_steps):
            if step in ["Exfoliation", "Gentle Exfoliation"]:
                weekly_steps[idx] = "Gentle Mask"
                
    # Deactivate existing skincare routines
    db.query(models.SkincareRoutine).filter(
        models.SkincareRoutine.user_id == user_id
    ).update({models.SkincareRoutine.is_active: False})
    
    # Save the new routine
    steps = []
    for i, cat in enumerate(am_steps, 1):
        step = models.SkincareRoutine(
            user_id=user_id, time_of_day="AM", step_number=i, step_category=cat, is_active=True
        )
        db.add(step)
        steps.append(step)
        
    for i, cat in enumerate(pm_steps, 1):
        step = models.SkincareRoutine(
            user_id=user_id, time_of_day="PM", step_number=i, step_category=cat, is_active=True
        )
        db.add(step)
        steps.append(step)
        
    for i, cat in enumerate(weekly_steps, 1):
        step = models.SkincareRoutine(
            user_id=user_id, time_of_day="Weekly", step_number=i, step_category=cat, is_active=True
        )
        db.add(step)
        steps.append(step)
        
    db.commit()
    return steps


@router.post("/evaluate", status_code=status.HTTP_200_OK)
def evaluate_assessment(
    payload: schemas.AssessmentEvaluateIn,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Update SkinProfile in PostgreSQL
    profile = db.query(models.SkinProfile).filter(models.SkinProfile.user_id == current_user.id).first()
    
    concern_names = [c.concern for c in payload.concerns]
    concerns_str = ",".join(concern_names)
    
    if not profile:
        profile = models.SkinProfile(
            user_id=current_user.id,
            age=None,
            gender=None,
            skin_type=payload.skin_type,
            skin_concerns=concerns_str,
            allergies=payload.allergies,
            skin_sensitivities=payload.skin_sensitivities
        )
        db.add(profile)
    else:
        profile.skin_type = payload.skin_type
        profile.skin_concerns = concerns_str
        profile.allergies = payload.allergies
        profile.skin_sensitivities = payload.skin_sensitivities
    
    # 2. Update LifestyleEntry in PostgreSQL
    lifestyle_entry = db.query(models.LifestyleEntry).filter(
        models.LifestyleEntry.user_id == current_user.id,
        models.LifestyleEntry.entry_date == date.today()
    ).first()
    
    if not lifestyle_entry:
        lifestyle_entry = models.LifestyleEntry(
            user_id=current_user.id,
            entry_date=date.today(),
            sleep_hours=payload.sleep_hours,
            water_intake_liters=payload.water_intake_liters,
            environmental_exposure=payload.environmental_exposure,
            stress_level=payload.stress_level
        )
        db.add(lifestyle_entry)
    else:
        lifestyle_entry.sleep_hours = payload.sleep_hours
        lifestyle_entry.water_intake_liters = payload.water_intake_liters
        lifestyle_entry.environmental_exposure = payload.environmental_exposure
        lifestyle_entry.stress_level = payload.stress_level
        
    db.commit()
    db.refresh(profile)
    
    # 3. Identify and Prioritize Concerns
    prioritized = identify_skin_concerns(payload.concerns)
    primary_concern = prioritized[0].concern if prioritized else None
    
    # 4. Calculate Scores
    s_cond = calculate_s_cond([c.model_dump() for c in payload.concerns])
    l_habits = calculate_l_habits(payload.environmental_exposure)
    s_sleep = calculate_s_sleep(payload.sleep_hours)
    h_hydro = calculate_h_hydro(payload.water_intake_liters)
    
    # Calculate Consistency score (R_consist)
    # Check MongoDB logs for the last 7 days
    mongo = get_mongo_db()
    seven_days_ago = date.today() - timedelta(days=7)
    mongo_logs = list(mongo.routine_logs.find({
        "user_id": current_user.id,
        "log_date": {
            "$gte": seven_days_ago.isoformat(),
            "$lte": date.today().isoformat()
        }
    }))
    
    # Count expected weekly steps
    active_steps = db.query(models.SkincareRoutine).filter(
        models.SkincareRoutine.user_id == current_user.id,
        models.SkincareRoutine.is_active == True
    ).all()
    
    num_am = len([s for s in active_steps if s.time_of_day == "AM"])
    num_pm = len([s for s in active_steps if s.time_of_day == "PM"])
    num_weekly = len([s for s in active_steps if s.time_of_day == "Weekly"])
    
    expected_steps = (num_am * 7) + (num_pm * 7) + (num_weekly * 1)
    r_consist = calculate_r_consist(mongo_logs, expected_steps)
    
    overall_score = calculate_skin_health_score(s_cond, l_habits, s_sleep, r_consist, h_hydro)
    
    # 5. Save the score record in skin_assessments table
    assessment = models.SkinAssessment(
        user_id=current_user.id,
        overall_score=overall_score,
        skin_condition_score=s_cond,
        lifestyle_score=l_habits,
        sleep_score=s_sleep,
        consistency_score=r_consist,
        hydration_score=h_hydro,
        detected_concerns=concern_names
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    # 6. Seed/Generate Routine for the user based on primary concern and skin type
    is_sensitive = False
    if payload.skin_sensitivities and "high" in payload.skin_sensitivities.lower():
        is_sensitive = True
    
    generate_default_routine(
        user_id=current_user.id,
        skin_type=payload.skin_type.value,
        primary_concern=primary_concern,
        is_sensitive=is_sensitive,
        db=db
    )
    
    return {
        "status": "success",
        "assessment_id": assessment.id,
        "overall_score": overall_score,
        "primary_concern": primary_concern
    }


@router.get("/score", response_model=schemas.ScoreBreakdownOut)
def get_latest_score_breakdown(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch SkinProfile & LifestyleEntry (today's)
    profile = db.query(models.SkinProfile).filter(models.SkinProfile.user_id == current_user.id).first()
    lifestyle_entry = db.query(models.LifestyleEntry).filter(
        models.LifestyleEntry.user_id == current_user.id,
        models.LifestyleEntry.entry_date == date.today()
    ).first()
    
    # Fallback to last entry if today is not logged
    if not lifestyle_entry:
        lifestyle_entry = db.query(models.LifestyleEntry).filter(
            models.LifestyleEntry.user_id == current_user.id
        ).order_by(models.LifestyleEntry.entry_date.desc()).first()
        
    # Standard values if profiles are missing
    concerns = []
    if profile and profile.skin_concerns:
        # We assume moderate severity for active profile concerns for dynamic scoring check
        concerns = [{"concern": name.strip(), "severity": "medium"} for name in profile.skin_concerns.split(",") if name.strip()]
        
    sleep_h = lifestyle_entry.sleep_hours if lifestyle_entry else None
    water_l = lifestyle_entry.water_intake_liters if lifestyle_entry else None
    env_exp = lifestyle_entry.environmental_exposure if lifestyle_entry else None
    
    # Calculate scores
    s_cond = calculate_s_cond(concerns)
    l_habits = calculate_l_habits(env_exp)
    s_sleep = calculate_s_sleep(sleep_h)
    h_hydro = calculate_h_hydro(water_l)
    
    # Calculate Consistency score
    mongo = get_mongo_db()
    seven_days_ago = date.today() - timedelta(days=7)
    mongo_logs = list(mongo.routine_logs.find({
        "user_id": current_user.id,
        "log_date": {
            "$gte": seven_days_ago.isoformat(),
            "$lte": date.today().isoformat()
        }
    }))
    
    active_steps = db.query(models.SkincareRoutine).filter(
        models.SkincareRoutine.user_id == current_user.id,
        models.SkincareRoutine.is_active == True
    ).all()
    
    num_am = len([s for s in active_steps if s.time_of_day == "AM"])
    num_pm = len([s for s in active_steps if s.time_of_day == "PM"])
    num_weekly = len([s for s in active_steps if s.time_of_day == "Weekly"])
    
    expected_steps = (num_am * 7) + (num_pm * 7) + (num_weekly * 1)
    r_consist = calculate_r_consist(mongo_logs, expected_steps)
    
    overall_score = calculate_skin_health_score(s_cond, l_habits, s_sleep, r_consist, h_hydro)
    
    # Log a historical snapshot in skin_assessments table
    detected_list = [c["concern"] for c in concerns]
    assessment = models.SkinAssessment(
        user_id=current_user.id,
        overall_score=overall_score,
        skin_condition_score=s_cond,
        lifestyle_score=l_habits,
        sleep_score=s_sleep,
        consistency_score=r_consist,
        hydration_score=h_hydro,
        detected_concerns=detected_list
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    return assessment
