from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Body
from pydantic import BaseModel, EmailStr, Field
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.db.models.invoice import InvoiceInDB
from app.db.models.user import UserInDB
from app.db.models.client import ClientInDB
from app.services.pdf_service import PDFService
from app.services.email_service import EmailService
from app.core.security import get_current_user

router = APIRouter()
pdf_service = PDFService()
email_service = EmailService()

class InvoiceEmailRequest(BaseModel):
    """Request model for sending invoice email."""
    recipient_email: EmailStr
    subject: Optional[str] = None
    message: Optional[str] = None
    cc_emails: Optional[List[EmailStr]] = None

class InvoiceResponse(BaseModel):
    """Response model for invoice operations."""
    message: str
    success: bool
    data: Optional[Dict[str, Any]] = None

@router.post("/{invoice_id}/generate-pdf", response_model=InvoiceResponse)
async def generate_pdf(
    invoice_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Generate a PDF for a specific invoice.
    
    Args:
        invoice_id: ID of the invoice to generate PDF for
        current_user: Current authenticated user
        
    Returns:
        InvoiceResponse with success message and PDF URL
    """
    try:
        invoice = await InvoiceInDB.get_by_id(invoice_id)
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
            
        if invoice.user_id != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to access this invoice")
        
        client = await ClientInDB.get_by_id(invoice.client_id)
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        
        pdf_bytes = await pdf_service.generate_invoice_pdf(invoice, current_user, client)
        
        
        return InvoiceResponse(
            message="PDF generated successfully",
            success=True,
            data={"pdf_url": f"/api/invoices/{invoice_id}/pdf"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

@router.get("/{invoice_id}/pdf")
async def get_pdf(
    invoice_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get the PDF for a specific invoice.
    
    Args:
        invoice_id: ID of the invoice to get PDF for
        current_user: Current authenticated user
        
    Returns:
        PDF file as bytes
    """
    try:
        invoice = await InvoiceInDB.get_by_id(invoice_id)
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
            
        if invoice.user_id != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to access this invoice")
        
        client = await ClientInDB.get_by_id(invoice.client_id)
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        
        pdf_bytes = await pdf_service.generate_invoice_pdf(invoice, current_user, client)
        
        from fastapi.responses import Response
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=invoice_{invoice_id}.pdf"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting PDF: {str(e)}")

@router.post("/{invoice_id}/send-email", response_model=InvoiceResponse)
async def send_invoice_email(
    invoice_id: str,
    email_request: InvoiceEmailRequest,
    background_tasks: BackgroundTasks,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Send an invoice PDF via email.
    
    Args:
        invoice_id: ID of the invoice to send
        email_request: Email request data
        background_tasks: FastAPI background tasks
        current_user: Current authenticated user
        
    Returns:
        InvoiceResponse with success message
    """
    try:
        invoice = await InvoiceInDB.get_by_id(invoice_id)
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
            
        if invoice.user_id != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to access this invoice")
        
        client = await ClientInDB.get_by_id(invoice.client_id)
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        
        pdf_bytes = await pdf_service.generate_invoice_pdf(invoice, current_user, client)
        
        subject = email_request.subject or f"Rechnung {invoice.invoice_number} von {current_user.company_name or f'{current_user.first_name} {current_user.last_name}'}"
        
        body_html = f"""
        <html>
            <body>
                <p>Sehr geehrte(r) {client.name},</p>
                <p>anbei erhalten Sie die Rechnung {invoice.invoice_number} vom {invoice.invoice_date.strftime('%d.%m.%Y')}.</p>
                {email_request.message or ''}
                <p>Mit freundlichen Grüßen,<br>{current_user.company_name or f'{current_user.first_name} {current_user.last_name}'}</p>
                <hr>
                <p style="font-size: 12px; color: #666;">
                    Diese E-Mail wurde über Billirae gesendet, eine Anwendung für Rechnungsstellung.
                </p>
            </body>
        </html>
        """
        
        background_tasks.add_task(
            email_service.send_invoice_email,
            recipient_email=email_request.recipient_email,
            subject=subject,
            body_html=body_html,
            pdf_data=pdf_bytes,
            pdf_filename=f"Rechnung_{invoice.invoice_number}.pdf",
            cc_emails=email_request.cc_emails
        )
        
        invoice.status = "sent"
        invoice.sent_date = datetime.now()
        await invoice.save()
        
        return InvoiceResponse(
            message="Email sent successfully",
            success=True,
            data={"recipient": email_request.recipient_email}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending email: {str(e)}")
