from fastapi import Depends, HTTPException, status
from typing import List
from .models import User, UserRole
from .auth import get_current_user

class RoleChecker:
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)):
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Operation not permitted"
            )
        return user

require_admin = RoleChecker([UserRole.ADMIN])
require_viewer = RoleChecker([UserRole.ADMIN, UserRole.VIEWER])
