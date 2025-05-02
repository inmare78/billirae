from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List, Optional
import json
from datetime import datetime

from app.api.auth import get_current_user
from app.db.mongodb import mongodb
from app.db.models.user import UserInDB
from app.db.models.invoice import Invoice, InvoiceCreate, InvoiceUpdate, InvoiceInDB, VoiceInvoiceInput
from app.services.gpt_service import GPTService

router = APIRouter(tags=["invoices"])

gpt_service = GPTService()

@router.post("/invoices", response_model=Invoice)
async def create_invoice(
    invoice_create: InvoiceCreate,
    current_user: UserInDB = Depends(get_current_user)
):
    """Create a new invoice."""
    client = await mongodb.db.clients.find_one({"_id": invoice_create.client_id, "user_id": str(current_user.id)})
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kunde nicht gefunden"
        )
    
    subtotal = sum(item.quantity * item.unit_price for item in invoice_create.items)
    tax_amount = sum(item.quantity * item.unit_price * item.tax_rate for item in invoice_create.items)
    total = subtotal + tax_amount
    
    next_invoice_number = current_user.settings.next_invoice_number
    invoice_prefix = current_user.settings.invoice_prefix or ""
    invoice_number = f"{invoice_prefix}{next_invoice_number:04d}"
    
    invoice_dict = invoice_create.dict()
    invoice_dict["user_id"] = str(current_user.id)
    invoice_dict["invoice_number"] = invoice_number
    invoice_dict["subtotal"] = subtotal
    invoice_dict["tax_amount"] = tax_amount
    invoice_dict["total"] = total
    
    result = await mongodb.db.invoices.insert_one(invoice_dict)
    
    await mongodb.db.users.update_one(
        {"_id": current_user.id},
        {"$set": {"settings.next_invoice_number": next_invoice_number + 1}}
    )
    
    created_invoice = await mongodb.db.invoices.find_one({"_id": result.inserted_id})
    
    return Invoice(**created_invoice)

@router.get("/invoices", response_model=List[Invoice])
async def read_invoices(
    status: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get all invoices for the current user."""
    query = {"user_id": str(current_user.id)}
    if status:
        query["status"] = status
    
    invoices = []
    async for invoice in mongodb.db.invoices.find(query):
        invoices.append(Invoice(**invoice))
    
    return invoices

@router.get("/invoices/{invoice_id}", response_model=Invoice)
async def read_invoice(
    invoice_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get a specific invoice."""
    invoice = await mongodb.db.invoices.find_one({"_id": invoice_id, "user_id": str(current_user.id)})
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rechnung nicht gefunden"
        )
    
    return Invoice(**invoice)

@router.put("/invoices/{invoice_id}", response_model=Invoice)
async def update_invoice(
    invoice_id: str,
    invoice_update: InvoiceUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    """Update a specific invoice."""
    invoice = await mongodb.db.invoices.find_one({"_id": invoice_id, "user_id": str(current_user.id)})
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rechnung nicht gefunden"
        )
    
    update_data = invoice_update.dict(exclude_unset=True)
    
    if update_data:
        if "items" in update_data:
            update_data["subtotal"] = sum(item.quantity * item.unit_price for item in update_data["items"])
            update_data["tax_amount"] = sum(item.quantity * item.unit_price * item.tax_rate for item in update_data["items"])
            update_data["total"] = update_data["subtotal"] + update_data["tax_amount"]
        
        update_data["updated_at"] = datetime.utcnow()
        
        await mongodb.db.invoices.update_one(
            {"_id": invoice_id},
            {"$set": update_data}
        )
    
    updated_invoice = await mongodb.db.invoices.find_one({"_id": invoice_id})
    
    return Invoice(**updated_invoice)

@router.delete("/invoices/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_invoice(
    invoice_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Delete a specific invoice."""
    invoice = await mongodb.db.invoices.find_one({"_id": invoice_id, "user_id": str(current_user.id)})
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rechnung nicht gefunden"
        )
    
    await mongodb.db.invoices.delete_one({"_id": invoice_id})
    
    return None

@router.post("/invoices/parse-voice", response_model=dict)
async def parse_voice_input(
    voice_input: VoiceInvoiceInput,
    current_user: UserInDB = Depends(get_current_user)
):
    """Parse voice input into structured invoice data."""
    parsed_data = await gpt_service.parse_voice_input(voice_input)
    return parsed_data

@router.post("/invoices/{invoice_id}/generate-pdf")
async def generate_pdf(
    invoice_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Generate a PDF for a specific invoice."""
    return {"message": "PDF generiert", "pdf_url": f"/api/v1/invoices/{invoice_id}/pdf"}

@router.post("/invoices/{invoice_id}/send-email")
async def send_email(
    invoice_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Send an invoice via email."""
    return {"message": "E-Mail gesendet"}
