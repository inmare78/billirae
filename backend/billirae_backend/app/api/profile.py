from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any

from app.db.models.user import UserInDB, Address, BankDetails, UserSettings
from app.core.security import get_current_user

router = APIRouter()

class AddressUpdate(BaseModel):
    """Address update model."""
    street: str
    city: str
    zip: str
    country: str = "Deutschland"

class BankDetailsUpdate(BaseModel):
    """Bank details update model."""
    account_holder: str
    iban: str
    bic: Optional[str] = None

class UserSettingsUpdate(BaseModel):
    """User settings update model."""
    dark_mode: Optional[bool] = None
    language: Optional[str] = None
    invoice_prefix: Optional[str] = None
    next_invoice_number: Optional[int] = None

class ProfileUpdate(BaseModel):
    """Profile update model."""
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_name: Optional[str] = None
    address: Optional[AddressUpdate] = None
    tax_id: Optional[str] = None
    bank_details: Optional[BankDetailsUpdate] = None
    settings: Optional[UserSettingsUpdate] = None

@router.get("/profile", response_model=Dict[str, Any])
async def get_user_profile(current_user: UserInDB = Depends(get_current_user)):
    """
    Get the current user's profile.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User profile data
    """
    user_email = current_user.email
    redacted_email = f"{user_email[0]}{'*' * (len(user_email.split('@')[0]) - 2)}{user_email[-1]}@{user_email.split('@')[1]}"
    
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "company_name": current_user.company_name,
        "address": current_user.address.dict() if current_user.address else None,
        "tax_id": current_user.tax_id,
        "bank_details": current_user.bank_details.dict() if current_user.bank_details else None,
        "settings": current_user.settings.dict() if current_user.settings else None,
    }

@router.put("/profile", response_model=Dict[str, Any])
async def update_user_profile(
    profile_update: ProfileUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Update the current user's profile.
    
    Args:
        profile_update: Profile data to update
        current_user: Current authenticated user
        
    Returns:
        Updated user profile data
    """
    try:
        if profile_update.first_name is not None:
            current_user.first_name = profile_update.first_name
            
        if profile_update.last_name is not None:
            current_user.last_name = profile_update.last_name
            
        if profile_update.company_name is not None:
            current_user.company_name = profile_update.company_name
            
        if profile_update.tax_id is not None:
            current_user.tax_id = profile_update.tax_id
            
        if profile_update.address:
            current_user.address = Address(
                street=profile_update.address.street,
                city=profile_update.address.city,
                zip=profile_update.address.zip,
                country=profile_update.address.country,
            )
            
        if profile_update.bank_details:
            current_user.bank_details = BankDetails(
                account_holder=profile_update.bank_details.account_holder,
                iban=profile_update.bank_details.iban,
                bic=profile_update.bank_details.bic,
            )
            
        if profile_update.settings:
            if not current_user.settings:
                current_user.settings = UserSettings()
                
            if profile_update.settings.dark_mode is not None:
                current_user.settings.dark_mode = profile_update.settings.dark_mode
                
            if profile_update.settings.language is not None:
                current_user.settings.language = profile_update.settings.language
                
            if profile_update.settings.invoice_prefix is not None:
                current_user.settings.invoice_prefix = profile_update.settings.invoice_prefix
                
            if profile_update.settings.next_invoice_number is not None:
                current_user.settings.next_invoice_number = profile_update.settings.next_invoice_number
        
        await current_user.save()
        
        return {
            "id": str(current_user.id),
            "email": current_user.email,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "company_name": current_user.company_name,
            "address": current_user.address.dict() if current_user.address else None,
            "tax_id": current_user.tax_id,
            "bank_details": current_user.bank_details.dict() if current_user.bank_details else None,
            "settings": current_user.settings.dict() if current_user.settings else None,
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating profile: {str(e)}")
