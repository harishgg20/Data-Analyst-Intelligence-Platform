from fastapi import APIRouter, Depends
from ..dependencies import require_admin
from ..models import User

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(require_admin)]
)

@router.get("/dashboard")
async def get_admin_dashboard():
    return {
        "message": "Welcome to the Admin Dashboard",
        "private_data": "Only admins can see this"
    }
