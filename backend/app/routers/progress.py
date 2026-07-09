from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/api/progress", tags=["Progress Tracking"])


@router.get("/", response_model=list[schemas.ProgressEntryOut])
def list_my_progress_entries(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.ProgressEntry)
        .filter(models.ProgressEntry.user_id == current_user.id)
        .order_by(models.ProgressEntry.entry_date.desc(), models.ProgressEntry.created_at.desc())
        .all()
    )


@router.post("/", response_model=schemas.ProgressEntryOut, status_code=201)
def create_progress_entry(
    payload: schemas.ProgressEntryIn,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = models.ProgressEntry(user_id=current_user.id, **payload.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
