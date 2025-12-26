from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from .. import models, schemas, database
from ..auth import get_current_user, get_password_hash

router = APIRouter(
    prefix="/api/users", # Changed from /users to /api/users to match convention
    tags=["Users"]
)

@router.get("/me", response_model=schemas.UserResponse)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=schemas.UserResponse)
async def update_user_me(
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    # Update fields if provided
    if user_update.email:
        # Check if email is already taken by another user
        result = await db.execute(select(models.User).where(models.User.email == user_update.email))
        existing_user = result.scalar_one_or_none()
        
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = user_update.email
    
    # User model in models.py doesn't have full_name, but schema does.
    # Ignoring full_name update to avoid crash if column missing.
    # if user_update.full_name:
    #     current_user.full_name = user_update.full_name
        
    if user_update.password:
        current_user.hashed_password = get_password_hash(user_update.password)
    
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user

# --- Saved Views ---

# Helper to allow "Guest" views (mapped to a Demo User)
async def get_default_user(db: AsyncSession = Depends(database.get_db)) -> models.User:
    # 1. Try to find demo user
    result = await db.execute(select(models.User).where(models.User.email == "demo@example.com"))
    user = result.scalar_one_or_none()
    
    if not user:
        # Create Demo User
        user = models.User(
            email="demo@example.com",
            hashed_password="demo_password_hash", # Dummy hash
            role=models.UserRole.VIEWER
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
    return user

@router.post("/me/views", response_model=schemas.SavedViewResponse)
async def create_saved_view(
    view_data: schemas.SavedViewCreate,
    current_user: models.User = Depends(get_default_user), # Use Default/Demo User
    db: AsyncSession = Depends(database.get_db)
):
    new_view = models.SavedView(
        user_id=current_user.id,
        name=view_data.name,
        settings=view_data.settings
    )
    db.add(new_view)
    await db.commit()
    await db.refresh(new_view)
    return new_view

@router.get("/me/views", response_model=List[schemas.SavedViewResponse])
async def get_saved_views(
    current_user: models.User = Depends(get_default_user), # Use Default/Demo User
    db: AsyncSession = Depends(database.get_db)
):
    result = await db.execute(select(models.SavedView).where(models.SavedView.user_id == current_user.id))
    return result.scalars().all()

@router.delete("/me/views/{view_id}")
async def delete_saved_view(
    view_id: int,
    current_user: models.User = Depends(get_default_user), # Use Default/Demo User
    db: AsyncSession = Depends(database.get_db)
):
    result = await db.execute(select(models.SavedView).where(models.SavedView.id == view_id, models.SavedView.user_id == current_user.id))
    view = result.scalar_one_or_none()
    
    if not view:
        raise HTTPException(status_code=404, detail="View not found")
        
    await db.delete(view)
    await db.commit()
    return {"status": "success"}
