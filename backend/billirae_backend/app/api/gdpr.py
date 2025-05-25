from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
import json
from typing import Dict, Any, List

from billirae_backend.app.core.security import get_current_user
from billirae_backend.app.db.models.user import UserInDB
from billirae_backend.app.db.models.invoice import InvoiceInDB

router = APIRouter()

class GDPRResponse(BaseModel):
    """Response model for GDPR operations."""
    success: bool
    message: str

@router.get("/export-data")
async def export_user_data(current_user: UserInDB = Depends(get_current_user)):
    """
    Export all user data (GDPR compliance).
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        JSON with all user data
    """
    try:
        # Get user data
        user_data = current_user.dict(exclude={"hashed_password"})
        
        # Get user invoices
        invoices = await InvoiceInDB.find({"user_id": str(current_user.id)})
        invoice_data = [invoice.dict() for invoice in invoices]
        
        # Combine data
        export_data = {
            "user": user_data,
            "invoices": invoice_data
        }
        
        # Return as JSON
        return export_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting data: {str(e)}")

@router.delete("/delete-account", response_model=GDPRResponse)
async def delete_user_account(
    background_tasks: BackgroundTasks,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Delete user account and all associated data (GDPR compliance).
    
    Args:
        background_tasks: FastAPI background tasks
        current_user: Current authenticated user
        
    Returns:
        Success message
    """
    try:
        # Export data first (for backup)
        export_data = await export_user_data(current_user)
        
        # Delete user invoices
        await InvoiceInDB.delete_many({"user_id": str(current_user.id)})
        
        # Delete user
        await current_user.delete()
        
        return GDPRResponse(
            success=True,
            message="Account and all associated data deleted successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting account: {str(e)}")
