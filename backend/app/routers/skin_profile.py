from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/api/skin-profile", tags=["Skin Profile"])


@router.get("/", response_model=schemas.SkinProfileOut)
def get_my_skin_profile(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(models.SkinProfile).filter(models.SkinProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Skin profile not created yet")
    return profile


@router.put("/", response_model=schemas.SkinProfileOut)
def upsert_my_skin_profile(
    payload: schemas.SkinProfileIn,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(models.SkinProfile).filter(models.SkinProfile.user_id == current_user.id).first()
    if not profile:
        profile = models.SkinProfile(user_id=current_user.id, **payload.model_dump())
        db.add(profile)
    else:
        for field, value in payload.model_dump().items():
            setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile
