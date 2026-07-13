from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.models import RoleEnum

router = APIRouter(prefix="/api/dermatologists", tags=["Dermatologists"])


def _to_contact(user: models.User) -> schemas.DermatologistContactOut:
    profile = user.dermatologist_profile
    return schemas.DermatologistContactOut(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone=profile.phone if profile else None,
        clinic_name=profile.clinic_name if profile else None,
        specialty=profile.specialty if profile else None,
        bio=profile.bio if profile else None,
        address=profile.address if profile else None,
        website=profile.website if profile else None,
        accepting_new_patients=profile.accepting_new_patients if profile else True,
        certificate_url=profile.certificate_url if profile else None,
    )


@router.get("/", response_model=list[schemas.DermatologistContactOut])
def list_dermatologists(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """List active dermatologists available for users to contact."""
    dermatologists = (
        db.query(models.User)
        .options(joinedload(models.User.dermatologist_profile))
        .filter(models.User.role == RoleEnum.dermatologist, models.User.is_active.is_(True))
        .order_by(models.User.full_name)
        .all()
    )
    return [_to_contact(d) for d in dermatologists]
