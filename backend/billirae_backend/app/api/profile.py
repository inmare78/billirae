from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional

from billirae_backend.app.core.security import get_current_user
from billirae_backend.app.db.models.user import UserInDB, UserUpdate

router = APIRouter()

class ProfileResponse(BaseModel):
    """Response model for profile operations."""
    success: bool
    message: str

class BusinessProfileUpdate(BaseModel):
    """Business profile update model."""
    company_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    tax_id: Optional[str] = None
    vat_id: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    bank_iban: Optional[str] = None
    bank_bic: Optional[str] = None
    logo_url: Optional[str] = None

@router.get("/business")
async def get_business_profile(current_user: UserInDB = Depends(get_current_user)):
    """
    Get business profile.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Business profile data
    """
    business_data = {
        "company_name": current_user.company_name,
        "address": current_user.address,
        "city": current_user.city,
        "postal_code": current_user.postal_code,
        "country": current_user.country,
        "phone": current_user.phone,
        "tax_id": current_user.tax_id,
        "vat_id": current_user.vat_id,
        "bank_name": current_user.bank_name,
        "bank_account": current_user.bank_account,
        "bank_iban": current_user.bank_iban,
        "bank_bic": current_user.bank_bic,
        "logo_url": current_user.logo_url
    }
    
    return business_data

@router.put("/business", response_model=ProfileResponse)
async def update_business_profile(
    profile_update: BusinessProfileUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Update business profile.
    
    Args:
        profile_update: Business profile data to update
        current_user: Current authenticated user
        
    Returns:
        Success message
    """
    try:
        # Update user fields
        for field, value in profile_update.dict(exclude_unset=True).items():
            setattr(current_user, field, value)
            
        # Save the updated user
        await current_user.save()
        
        return ProfileResponse(
            success=True,
            message="Business profile updated successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating business profile: {str(e)}")
