from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional

from billirae_backend.app.core.security import get_current_user
from billirae_backend.app.db.models.user import UserInDB, UserUpdate

router = APIRouter()

class UserResponse(BaseModel):
    """Response model for user operations."""
    success: bool
    message: str

@router.get("/me")
async def get_current_user_info(current_user: UserInDB = Depends(get_current_user)):
    """
    Get current user info.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Current user info
    """
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_user(
    user_update: UserUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Update current user.
    
    Args:
        user_update: User data to update
        current_user: Current authenticated user
        
    Returns:
        Success message
    """
    try:
        # Update user fields
        for field, value in user_update.dict(exclude_unset=True).items():
            setattr(current_user, field, value)
            
        # Save the updated user
        await current_user.save()
        
        return UserResponse(
            success=True,
            message="User updated successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating user: {str(e)}")
