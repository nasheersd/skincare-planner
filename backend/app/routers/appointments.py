from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db
from app.models import AppointmentStatusEnum, RoleEnum
from app.rbac import require_dermatologist

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])


def _to_appointment_out(appointment: models.AppointmentRequest) -> schemas.AppointmentRequestOut:
    return schemas.AppointmentRequestOut(
        id=appointment.id,
        patient_user_id=appointment.patient_user_id,
        patient_name=appointment.patient.full_name,
        patient_email=appointment.patient.email,
        dermatologist_user_id=appointment.dermatologist_user_id,
        dermatologist_name=appointment.dermatologist.full_name,
        dermatologist_email=appointment.dermatologist.email,
        status=appointment.status,
        request_message=appointment.request_message,
        response_message=appointment.response_message,
        reviewed_at=appointment.reviewed_at,
        created_at=appointment.created_at,
        updated_at=appointment.updated_at,
    )


@router.post("/requests", response_model=schemas.AppointmentRequestOut, status_code=status.HTTP_201_CREATED)
def create_appointment_request(
    payload: schemas.AppointmentRequestCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == RoleEnum.dermatologist:
        raise HTTPException(status_code=403, detail="Dermatologists cannot create appointment requests")

    if not current_user.assigned_dermatologist_id:
        raise HTTPException(status_code=400, detail="Assign a dermatologist before sending a request")

    dermatologist = (
        db.query(models.User)
        .filter(
            models.User.id == current_user.assigned_dermatologist_id,
            models.User.role == RoleEnum.dermatologist,
            models.User.is_active.is_(True),
        )
        .first()
    )
    if not dermatologist:
        raise HTTPException(status_code=404, detail="Assigned dermatologist not found")

    existing_pending_request = (
        db.query(models.AppointmentRequest)
        .filter(
            models.AppointmentRequest.patient_user_id == current_user.id,
            models.AppointmentRequest.dermatologist_user_id == dermatologist.id,
            models.AppointmentRequest.status == AppointmentStatusEnum.pending,
        )
        .first()
    )
    if existing_pending_request:
        raise HTTPException(status_code=409, detail="You already have a pending appointment request")

    appointment = models.AppointmentRequest(
        patient_user_id=current_user.id,
        dermatologist_user_id=dermatologist.id,
        request_message=payload.request_message,
    )
    db.add(appointment)
    db.commit()
    appointment = (
        db.query(models.AppointmentRequest)
        .options(
            joinedload(models.AppointmentRequest.patient),
            joinedload(models.AppointmentRequest.dermatologist),
        )
        .filter(models.AppointmentRequest.id == appointment.id)
        .first()
    )
    return _to_appointment_out(appointment)


@router.get("/requests/me", response_model=list[schemas.AppointmentRequestOut])
def list_my_appointment_requests(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    appointments = (
        db.query(models.AppointmentRequest)
        .options(
            joinedload(models.AppointmentRequest.patient),
            joinedload(models.AppointmentRequest.dermatologist),
        )
        .filter(models.AppointmentRequest.patient_user_id == current_user.id)
        .order_by(models.AppointmentRequest.created_at.desc())
        .all()
    )
    return [_to_appointment_out(appointment) for appointment in appointments]


@router.get(
    "/requests/inbox",
    response_model=list[schemas.AppointmentRequestOut],
    dependencies=[Depends(require_dermatologist)],
)
def list_incoming_appointment_requests(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    appointments = (
        db.query(models.AppointmentRequest)
        .options(
            joinedload(models.AppointmentRequest.patient),
            joinedload(models.AppointmentRequest.dermatologist),
        )
        .filter(models.AppointmentRequest.dermatologist_user_id == current_user.id)
        .order_by(
            models.AppointmentRequest.status.asc(),
            models.AppointmentRequest.created_at.desc(),
        )
        .all()
    )
    return [_to_appointment_out(appointment) for appointment in appointments]


@router.patch(
    "/requests/{appointment_id}",
    response_model=schemas.AppointmentRequestOut,
    dependencies=[Depends(require_dermatologist)],
)
def review_appointment_request(
    appointment_id: str,
    payload: schemas.AppointmentDecisionIn,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.status not in {AppointmentStatusEnum.accepted, AppointmentStatusEnum.declined}:
        raise HTTPException(status_code=400, detail="Status must be accepted or declined")

    appointment = (
        db.query(models.AppointmentRequest)
        .options(
            joinedload(models.AppointmentRequest.patient),
            joinedload(models.AppointmentRequest.dermatologist),
        )
        .filter(
            models.AppointmentRequest.id == appointment_id,
            models.AppointmentRequest.dermatologist_user_id == current_user.id,
        )
        .first()
    )
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment request not found")

    if appointment.status != AppointmentStatusEnum.pending:
        raise HTTPException(status_code=409, detail="This request has already been reviewed")

    appointment.status = payload.status
    appointment.response_message = payload.response_message
    appointment.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(appointment)
    return _to_appointment_out(appointment)
