from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
import json

from app.api.auth import get_current_user
from app.db.mongodb import mongodb
from app.db.models.user import UserInDB

router = APIRouter(tags=["gdpr"])

@router.get("/gdpr/export-data")
async def export_user_data(current_user: UserInDB = Depends(get_current_user)):
    """Export all user data (GDPR compliance)."""
    user_data = await mongodb.db.users.find_one({"_id": current_user.id})
    
    clients = []
    async for client in mongodb.db.clients.find({"user_id": str(current_user.id)}):
        clients.append(client)
    
    invoices = []
    async for invoice in mongodb.db.invoices.find({"user_id": str(current_user.id)}):
        invoices.append(invoice)
    
    data = {
        "user": user_data,
        "clients": clients,
        "invoices": invoices
    }
    
    data_str = json.dumps(data, default=str)
    
    return {"data": json.loads(data_str)}

@router.delete("/gdpr/delete-account", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(current_user: UserInDB = Depends(get_current_user)):
    """Delete user account and all associated data (GDPR compliance)."""
    await mongodb.db.invoices.delete_many({"user_id": str(current_user.id)})
    
    await mongodb.db.clients.delete_many({"user_id": str(current_user.id)})
    
    await mongodb.db.users.delete_one({"_id": current_user.id})
    
    return None
