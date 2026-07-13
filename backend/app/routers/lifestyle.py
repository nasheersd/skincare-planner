from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/api/lifestyle", tags=["Lifestyle Tracking"])


@router.get("/", response_model=list[schemas.LifestyleEntryOut])
def list_my_lifestyle_entries(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(models.LifestyleEntry)
        .filter(models.LifestyleEntry.user_id == current_user.id)
        .order_by(models.LifestyleEntry.entry_date.desc())
        .all()
    )


@router.post("/", response_model=schemas.LifestyleEntryOut, status_code=201)
def create_lifestyle_entry(
    payload: schemas.LifestyleEntryIn,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(models.LifestyleEntry)
        .filter(
            models.LifestyleEntry.user_id == current_user.id,
            models.LifestyleEntry.entry_date == payload.entry_date,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="An entry for this date already exists. Use PUT to update it.")

    entry = models.LifestyleEntry(user_id=current_user.id, **payload.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.put("/{entry_id}", response_model=schemas.LifestyleEntryOut)
def update_lifestyle_entry(
    entry_id: str,
    payload: schemas.LifestyleEntryIn,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(models.LifestyleEntry)
        .filter(
            models.LifestyleEntry.id == entry_id,
            models.LifestyleEntry.user_id == current_user.id,
        )
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Lifestyle entry not found")

    entry.sleep_hours = payload.sleep_hours
    entry.water_intake_liters = payload.water_intake_liters
    entry.stress_level = payload.stress_level
    entry.environmental_exposure = payload.environmental_exposure
    if hasattr(payload, "exercise_minutes") and payload.exercise_minutes is not None:
        entry.exercise_minutes = payload.exercise_minutes

    db.commit()
    db.refresh(entry)
    return entry
