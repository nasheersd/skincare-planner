import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db
from app.models import RoleEnum
from app.rbac import require_roles

router = APIRouter(prefix="/api/workspace", tags=["Workspace"])

require_consultant_workspace = require_roles(RoleEnum.skincare_consultant)
require_dermatologist_workspace = require_roles(RoleEnum.dermatologist)


def _to_dermatologist_profile_out(user: models.User) -> schemas.DermatologistProfileOut:
    profile = user.dermatologist_profile
    return schemas.DermatologistProfileOut(
        id=profile.id,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone=profile.phone,
        clinic_name=profile.clinic_name,
        specialty=profile.specialty,
        bio=profile.bio,
        address=profile.address,
        website=profile.website,
        accepting_new_patients=profile.accepting_new_patients,
        certificate_url=profile.certificate_url,
    )


def _to_consultant_profile_out(user: models.User) -> schemas.ConsultantProfileOut:
    profile = user.consultant_profile
    return schemas.ConsultantProfileOut(
        id=profile.id,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone=profile.phone,
        organization_name=profile.organization_name,
        specialization=profile.specialization,
        bio=profile.bio,
        website=profile.website,
    )


def _to_message_out(message: models.PatientMessage) -> schemas.PatientMessageOut:
    return schemas.PatientMessageOut(
        id=message.id,
        dermatologist_user_id=message.dermatologist_user_id,
        patient_user_id=message.patient_user_id,
        sender_user_id=message.sender_user_id,
        sender_name=message.sender.full_name,
        recipient_user_id=message.recipient_user_id,
        recipient_name=message.recipient.full_name,
        body=message.body,
        created_at=message.created_at,
    )


def _get_dermatologist_patient(db: Session, dermatologist_id: str, patient_id: str) -> models.User:
    patient = (
        db.query(models.User)
        .options(joinedload(models.User.skin_profile))
        .filter(
            models.User.id == patient_id,
            models.User.assigned_dermatologist_id == dermatologist_id,
            models.User.role == RoleEnum.user,
        )
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found for this dermatologist")
    return patient


def _get_professional_participants(db: Session, consultant_id: str, dermatologist_id: str) -> tuple[models.User, models.User]:
    consultant = (
        db.query(models.User)
        .filter(
            models.User.id == consultant_id,
            models.User.role == RoleEnum.skincare_consultant,
            models.User.is_active.is_(True),
        )
        .first()
    )
    if not consultant:
        raise HTTPException(status_code=404, detail="Consultant not found")

    dermatologist = (
        db.query(models.User)
        .filter(
            models.User.id == dermatologist_id,
            models.User.role == RoleEnum.dermatologist,
            models.User.is_active.is_(True),
        )
        .first()
    )
    if not dermatologist:
        raise HTTPException(status_code=404, detail="Dermatologist not found")

    return consultant, dermatologist


def _validate_professional_thread_access(
    current_user: models.User,
    consultant_id: str,
    dermatologist_id: str,
) -> None:
    if current_user.role == RoleEnum.skincare_consultant and current_user.id != consultant_id:
        raise HTTPException(status_code=403, detail="Consultants can access only their own professional messages")
    if current_user.role == RoleEnum.dermatologist and current_user.id != dermatologist_id:
        raise HTTPException(status_code=403, detail="Dermatologists can access only their own professional messages")


@router.get(
    "/dermatologist-profile",
    response_model=schemas.DermatologistProfileOut,
    dependencies=[Depends(require_dermatologist_workspace)],
)
def get_my_dermatologist_profile(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = (
        db.query(models.User)
        .options(joinedload(models.User.dermatologist_profile))
        .filter(models.User.id == current_user.id)
        .first()
    )
    if not user or not user.dermatologist_profile:
        raise HTTPException(status_code=404, detail="Dermatologist profile not found")
    return _to_dermatologist_profile_out(user)


@router.put(
    "/dermatologist-profile",
    response_model=schemas.DermatologistProfileOut,
    dependencies=[Depends(require_dermatologist_workspace)],
)
def upsert_my_dermatologist_profile(
    payload: schemas.DermatologistProfileIn,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(models.DermatologistProfile).filter(models.DermatologistProfile.user_id == current_user.id).first()
    if not profile:
        profile = models.DermatologistProfile(user_id=current_user.id, **payload.model_dump())
        db.add(profile)
    else:
        for field, value in payload.model_dump().items():
            setattr(profile, field, value)
    db.commit()
    user = (
        db.query(models.User)
        .options(joinedload(models.User.dermatologist_profile))
        .filter(models.User.id == current_user.id)
        .first()
    )
    return _to_dermatologist_profile_out(user)


@router.get(
    "/consultant-profile",
    response_model=schemas.ConsultantProfileOut,
    dependencies=[Depends(require_consultant_workspace)],
)
def get_my_consultant_profile(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = (
        db.query(models.User)
        .options(joinedload(models.User.consultant_profile))
        .filter(models.User.id == current_user.id)
        .first()
    )
    if not user or not user.consultant_profile:
        raise HTTPException(status_code=404, detail="Consultant profile not found")
    return _to_consultant_profile_out(user)


@router.put(
    "/consultant-profile",
    response_model=schemas.ConsultantProfileOut,
    dependencies=[Depends(require_consultant_workspace)],
)
def upsert_my_consultant_profile(
    payload: schemas.ConsultantProfileIn,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(models.ConsultantProfile).filter(models.ConsultantProfile.user_id == current_user.id).first()
    if not profile:
        profile = models.ConsultantProfile(user_id=current_user.id, **payload.model_dump())
        db.add(profile)
    else:
        for field, value in payload.model_dump().items():
            setattr(profile, field, value)
    db.commit()
    user = (
        db.query(models.User)
        .options(joinedload(models.User.consultant_profile))
        .filter(models.User.id == current_user.id)
        .first()
    )
    return _to_consultant_profile_out(user)


@router.get(
    "/dermatologist/patients",
    response_model=list[schemas.DermatologistPatientSummaryOut],
    dependencies=[Depends(require_dermatologist_workspace)],
)
def list_dermatologist_patients(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    patients = (
        db.query(models.User)
        .options(joinedload(models.User.skin_profile))
        .filter(
            models.User.assigned_dermatologist_id == current_user.id,
            models.User.role == RoleEnum.user,
        )
        .order_by(models.User.full_name)
        .all()
    )

    results = []
    for patient in patients:
        lifestyle_entries = (
            db.query(models.LifestyleEntry)
            .filter(models.LifestyleEntry.user_id == patient.id)
            .order_by(models.LifestyleEntry.entry_date.desc(), models.LifestyleEntry.created_at.desc())
            .limit(5)
            .all()
        )
        progress_entries = (
            db.query(models.ProgressEntry)
            .filter(models.ProgressEntry.user_id == patient.id)
            .order_by(models.ProgressEntry.entry_date.desc(), models.ProgressEntry.created_at.desc())
            .limit(5)
            .all()
        )
        latest_appointment = (
            db.query(models.AppointmentRequest)
            .filter(
                models.AppointmentRequest.patient_user_id == patient.id,
                models.AppointmentRequest.dermatologist_user_id == current_user.id,
            )
            .order_by(models.AppointmentRequest.created_at.desc())
            .first()
        )
        recent_messages = (
            db.query(models.PatientMessage)
            .options(
                joinedload(models.PatientMessage.sender),
                joinedload(models.PatientMessage.recipient),
            )
            .filter(
                models.PatientMessage.patient_user_id == patient.id,
                models.PatientMessage.dermatologist_user_id == current_user.id,
            )
            .order_by(models.PatientMessage.created_at.desc())
            .limit(3)
            .all()
        )
        results.append(
            schemas.DermatologistPatientSummaryOut(
                id=patient.id,
                full_name=patient.full_name,
                email=patient.email,
                skin_profile=patient.skin_profile,
                lifestyle_entries=lifestyle_entries,
                progress_entries=progress_entries,
                latest_appointment_status=latest_appointment.status if latest_appointment else None,
                recent_messages=[_to_message_out(message) for message in reversed(recent_messages)],
            )
        )
    return results


@router.get(
    "/dermatologist/patients/{patient_id}/messages",
    response_model=list[schemas.PatientMessageOut],
    dependencies=[Depends(require_dermatologist_workspace)],
)
def list_messages_for_dermatologist_patient(
    patient_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_dermatologist_patient(db, current_user.id, patient_id)
    messages = (
        db.query(models.PatientMessage)
        .options(
            joinedload(models.PatientMessage.sender),
            joinedload(models.PatientMessage.recipient),
        )
        .filter(
            models.PatientMessage.patient_user_id == patient_id,
            models.PatientMessage.dermatologist_user_id == current_user.id,
        )
        .order_by(models.PatientMessage.created_at.asc())
        .all()
    )
    return [_to_message_out(message) for message in messages]


@router.post(
    "/dermatologist/patients/{patient_id}/messages",
    response_model=schemas.PatientMessageOut,
    status_code=201,
    dependencies=[Depends(require_dermatologist_workspace)],
)
def send_message_to_patient(
    patient_id: str,
    payload: schemas.PatientMessageIn,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    patient = _get_dermatologist_patient(db, current_user.id, patient_id)
    message = models.PatientMessage(
        dermatologist_user_id=current_user.id,
        patient_user_id=patient.id,
        sender_user_id=current_user.id,
        recipient_user_id=patient.id,
        body=payload.body.strip(),
    )
    db.add(message)
    db.commit()
    message = (
        db.query(models.PatientMessage)
        .options(
            joinedload(models.PatientMessage.sender),
            joinedload(models.PatientMessage.recipient),
        )
        .filter(models.PatientMessage.id == message.id)
        .first()
    )
    return _to_message_out(message)


@router.get("/my-dermatologist/messages", response_model=list[schemas.PatientMessageOut])
def list_messages_with_my_dermatologist(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.assigned_dermatologist_id:
        raise HTTPException(status_code=404, detail="No dermatologist assigned yet")
    messages = (
        db.query(models.PatientMessage)
        .options(
            joinedload(models.PatientMessage.sender),
            joinedload(models.PatientMessage.recipient),
        )
        .filter(
            models.PatientMessage.patient_user_id == current_user.id,
            models.PatientMessage.dermatologist_user_id == current_user.assigned_dermatologist_id,
        )
        .order_by(models.PatientMessage.created_at.asc())
        .all()
    )
    return [_to_message_out(message) for message in messages]


@router.post("/my-dermatologist/messages", response_model=schemas.PatientMessageOut, status_code=201)
def send_message_to_my_dermatologist(
    payload: schemas.PatientMessageIn,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == RoleEnum.dermatologist:
        raise HTTPException(status_code=403, detail="Dermatologists cannot use the patient messaging endpoint")
    if not current_user.assigned_dermatologist_id:
        raise HTTPException(status_code=404, detail="No dermatologist assigned yet")

    dermatologist = (
        db.query(models.User)
        .filter(
            models.User.id == current_user.assigned_dermatologist_id,
            models.User.role == RoleEnum.dermatologist,
        )
        .first()
    )
    if not dermatologist:
        raise HTTPException(status_code=404, detail="Assigned dermatologist not found")

    message = models.PatientMessage(
        dermatologist_user_id=dermatologist.id,
        patient_user_id=current_user.id,
        sender_user_id=current_user.id,
        recipient_user_id=dermatologist.id,
        body=payload.body.strip(),
    )
    db.add(message)
    db.commit()
    message = (
        db.query(models.PatientMessage)
        .options(
            joinedload(models.PatientMessage.sender),
            joinedload(models.PatientMessage.recipient),
        )
        .filter(models.PatientMessage.id == message.id)
        .first()
    )
    return _to_message_out(message)


@router.post("/upload-certificate")
def upload_dermatologist_certificate(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != RoleEnum.dermatologist:
        raise HTTPException(status_code=403, detail="Only dermatologists can upload certificates.")
    
    ext = os.path.splitext(file.filename)[1]
    if ext.lower() not in [".pdf", ".jpg", ".jpeg", ".png"]:
        raise HTTPException(status_code=400, detail="Only PDF or image files (.jpg, .jpeg, .png, .pdf) are allowed.")
    
    os.makedirs("static/uploads", exist_ok=True)
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join("static/uploads", filename)
    
    with open(filepath, "wb") as buffer:
        buffer.write(file.file.read())
        
    return {"url": f"/static/uploads/{filename}"}


@router.get("/consultant/patients", response_model=list[schemas.ConsultantPatientOut], dependencies=[Depends(require_consultant_workspace)])
def list_patients_for_consultant(
    db: Session = Depends(get_db)
):
    patients = db.query(models.User).options(
        joinedload(models.User.skin_profile)
    ).filter(models.User.role == RoleEnum.user).order_by(models.User.full_name).all()
    
    from app.routers.dermatologists import _to_contact
    
    results = []
    for p in patients:
        # Get assigned dermatologist (if any)
        assigned_derm = None
        if p.assigned_dermatologist_id:
            derm = db.query(models.User).options(
                joinedload(models.User.dermatologist_profile)
            ).filter(models.User.id == p.assigned_dermatologist_id).first()
            if derm:
                assigned_derm = _to_contact(derm)
                
        # Get progress entries
        progress = db.query(models.ProgressEntry).filter(
            models.ProgressEntry.user_id == p.id
        ).order_by(models.ProgressEntry.entry_date.desc()).all()
        
        # Get lifestyle entries
        lifestyle = db.query(models.LifestyleEntry).filter(
            models.LifestyleEntry.user_id == p.id
        ).order_by(models.LifestyleEntry.entry_date.desc()).all()
        
        # Get latest score
        latest_score = None
        assessment = db.query(models.SkinAssessment).filter(
            models.SkinAssessment.user_id == p.id
        ).order_by(models.SkinAssessment.created_at.desc()).first()
        if assessment:
            latest_score = assessment.overall_score
            
        results.append(schemas.ConsultantPatientOut(
            id=p.id,
            full_name=p.full_name,
            email=p.email,
            skin_profile=p.skin_profile,
            assigned_dermatologist=assigned_derm,
            lifestyle_entries=lifestyle,
            progress_entries=progress,
            latest_score=latest_score
        ))
        
    return results


@router.get("/consultant/dermatologists", response_model=list[schemas.DermatologistContactOut], dependencies=[Depends(require_consultant_workspace)])
def list_dermatologists_for_consultant(
    db: Session = Depends(get_db)
):
    from app.routers.dermatologists import _to_contact
    derms = db.query(models.User).options(
        joinedload(models.User.dermatologist_profile)
    ).filter(models.User.role == RoleEnum.dermatologist, models.User.is_active.is_(True)).order_by(models.User.full_name).all()
    return [_to_contact(d) for d in derms]


@router.get(
    "/dermatologist/consultants",
    response_model=list[schemas.ConsultantProfileOut],
    dependencies=[Depends(require_dermatologist_workspace)],
)
def list_consultants_for_dermatologist(
    db: Session = Depends(get_db)
):
    consultants = (
        db.query(models.User)
        .options(joinedload(models.User.consultant_profile))
        .filter(models.User.role == RoleEnum.skincare_consultant, models.User.is_active.is_(True))
        .order_by(models.User.full_name)
        .all()
    )
    
    results = []
    for c in consultants:
        profile = c.consultant_profile
        results.append(
            schemas.ConsultantProfileOut(
                id=profile.id if profile else "",
                user_id=c.id,
                full_name=c.full_name,
                email=c.email,
                phone=profile.phone if profile else None,
                organization_name=profile.organization_name if profile else None,
                specialization=profile.specialization if profile else None,
                bio=profile.bio if profile else None,
                website=profile.website if profile else None,
            )
        )
    return results


def _to_professional_message_out(message: models.ProfessionalMessage) -> schemas.ProfessionalMessageOut:
    return schemas.ProfessionalMessageOut(
        id=message.id,
        consultant_id=message.consultant_id,
        consultant_name=message.consultant.full_name,
        dermatologist_id=message.dermatologist_id,
        dermatologist_name=message.dermatologist.full_name,
        sender_user_id=message.sender_user_id,
        sender_name=message.sender.full_name,
        body=message.body,
        created_at=message.created_at
    )


@router.get("/professional/messages", response_model=list[schemas.ProfessionalMessageOut])
def get_professional_messages(
    dermatologist_id: str,
    consultant_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [RoleEnum.skincare_consultant, RoleEnum.dermatologist]:
        raise HTTPException(status_code=403, detail="Access denied.")
    _validate_professional_thread_access(current_user, consultant_id, dermatologist_id)
    _get_professional_participants(db, consultant_id, dermatologist_id)
        
    messages = db.query(models.ProfessionalMessage).options(
        joinedload(models.ProfessionalMessage.sender),
        joinedload(models.ProfessionalMessage.consultant),
        joinedload(models.ProfessionalMessage.dermatologist)
    ).filter(
        models.ProfessionalMessage.consultant_id == consultant_id,
        models.ProfessionalMessage.dermatologist_id == dermatologist_id
    ).order_by(models.ProfessionalMessage.created_at.asc()).all()
    
    return [_to_professional_message_out(m) for m in messages]


@router.post("/professional/messages", response_model=schemas.ProfessionalMessageOut)
def send_professional_message(
    dermatologist_id: str,
    consultant_id: str,
    payload: schemas.ProfessionalMessageIn,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [RoleEnum.skincare_consultant, RoleEnum.dermatologist]:
        raise HTTPException(status_code=403, detail="Access denied.")
    _validate_professional_thread_access(current_user, consultant_id, dermatologist_id)
    _get_professional_participants(db, consultant_id, dermatologist_id)
        
    message = models.ProfessionalMessage(
        consultant_id=consultant_id,
        dermatologist_id=dermatologist_id,
        sender_user_id=current_user.id,
        body=payload.body.strip()
    )
    db.add(message)
    db.commit()
    
    message = db.query(models.ProfessionalMessage).options(
        joinedload(models.ProfessionalMessage.sender),
        joinedload(models.ProfessionalMessage.consultant),
        joinedload(models.ProfessionalMessage.dermatologist)
    ).filter(models.ProfessionalMessage.id == message.id).first()
    
    return _to_professional_message_out(message)
