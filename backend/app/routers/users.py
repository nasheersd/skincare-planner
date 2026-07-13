from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app import schemas
from app.auth import get_current_user
from app.rbac import require_admin
from app import models
from app.models import RoleEnum
from app.routers.dermatologists import _to_contact

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/me", response_model=schemas.UserOut)
def get_my_account(current_user: models.User = Depends(get_current_user)):
    return current_user


from typing import Optional

@router.get("/me/dermatologist", response_model=Optional[schemas.DermatologistContactOut])
def get_my_dermatologist(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.assigned_dermatologist_id:
        return None

    dermatologist = (
        db.query(models.User)
        .options(joinedload(models.User.dermatologist_profile))
        .filter(
            models.User.id == current_user.assigned_dermatologist_id,
            models.User.role == RoleEnum.dermatologist,
            models.User.is_active.is_(True),
        )
        .first()
    )
    if not dermatologist:
        return None
    return _to_contact(dermatologist)


@router.put("/me/dermatologist", response_model=schemas.DermatologistContactOut)
def assign_my_dermatologist(
    payload: schemas.AssignDermatologistIn,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dermatologist = (
        db.query(models.User)
        .options(joinedload(models.User.dermatologist_profile))
        .filter(
            models.User.id == payload.dermatologist_id,
            models.User.role == RoleEnum.dermatologist,
            models.User.is_active.is_(True),
        )
        .first()
    )
    if not dermatologist:
        raise HTTPException(status_code=404, detail="Dermatologist not found")

    current_user.assigned_dermatologist_id = dermatologist.id
    db.commit()
    db.refresh(current_user)
    return _to_contact(dermatologist)


@router.get("/", response_model=list[schemas.UserOut], dependencies=[Depends(require_admin)])
def list_all_users(db: Session = Depends(get_db)):
    """Administrator-only: list every user in the system."""
    return db.query(models.User).all()
