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
