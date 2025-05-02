from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.api.auth import get_current_user
from app.db.mongodb import mongodb
from app.db.models.user import User, UserUpdate, UserInDB

router = APIRouter(tags=["users"])

@router.get("/users/me", response_model=User)
async def read_users_me(current_user: UserInDB = Depends(get_current_user)):
    """Get the current user."""
    return current_user

@router.put("/users/me", response_model=User)
async def update_user(
    user_update: UserUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    """Update the current user."""
    user = await mongodb.db.users.find_one({"_id": current_user.id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Benutzer nicht gefunden"
        )
    
    update_data = user_update.dict(exclude_unset=True)
    
    if update_data:
        from datetime import datetime
        update_data["updated_at"] = datetime.utcnow()
        
        await mongodb.db.users.update_one(
            {"_id": current_user.id},
            {"$set": update_data}
        )
    
    updated_user = await mongodb.db.users.find_one({"_id": current_user.id})
    
    return User(**updated_user)
