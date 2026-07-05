from fastapi import Depends, HTTPException, status
from app.auth import get_current_user
from app.models import User, RoleEnum


def require_roles(*allowed_roles: RoleEnum):
    """
    Dependency factory for Role-Based Access Control.
    Usage: @router.get("/admin-only", dependencies=[Depends(require_roles(RoleEnum.administrator))])
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role.value}' is not permitted to access this resource."
            )
        return current_user
    return role_checker


# Convenience shortcuts
require_admin = require_roles(RoleEnum.administrator)
require_dermatologist = require_roles(RoleEnum.dermatologist, RoleEnum.administrator)
require_consultant = require_roles(RoleEnum.skincare_consultant, RoleEnum.dermatologist, RoleEnum.administrator)
require_any_authenticated = get_current_user
