from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import schemas
from app.auth import get_current_user
from app.rbac import require_admin
from app import models

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/me", response_model=schemas.UserOut)
def get_my_account(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.get("/", response_model=list[schemas.UserOut], dependencies=[Depends(require_admin)])
def list_all_users(db: Session = Depends(get_db)):
    """Administrator-only: list every user in the system."""
    return db.query(models.User).all()
