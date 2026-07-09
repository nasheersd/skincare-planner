from fastapi import APIRouter, Depends, HTTPException
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
