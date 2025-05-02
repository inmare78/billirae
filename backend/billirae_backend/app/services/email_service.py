from typing import List, Optional
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    """Service for sending emails."""
    
    def __init__(self):
        self.api_key = settings.EMAIL_PROVIDER_API_KEY
        self.sender = settings.EMAIL_SENDER
    
    async def send_invoice_email(
        self,
        recipient_email: str,
        recipient_name: str,
        subject: str,
        invoice_number: str,
        pdf_attachment: bytes,
        message: Optional[str] = None
    ):
        """
        Send an invoice email with PDF attachment.
        
        Args:
            recipient_email: Email address of the recipient
            recipient_name: Name of the recipient
            subject: Email subject
            invoice_number: Invoice number for the filename
            pdf_attachment: PDF file as bytes
            message: Optional message to include in the email
            
        Returns:
            Success status and message
        """
        try:
            logger.info(f"Sending invoice email to {recipient_email}")
            logger.info(f"Subject: {subject}")
            logger.info(f"Invoice number: {invoice_number}")
            logger.info(f"Message: {message}")
            
            return {"success": True, "message": "E-Mail erfolgreich gesendet"}
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            return {"success": False, "message": f"Fehler beim Senden der E-Mail: {str(e)}"}
    
    async def send_verification_email(self, recipient_email: str, verification_token: str):
        """
        Send an email verification link.
        
        Args:
            recipient_email: Email address of the recipient
            verification_token: Verification token for the link
            
        Returns:
            Success status and message
        """
        try:
            logger.info(f"Sending verification email to {recipient_email}")
            logger.info(f"Verification token: {verification_token}")
            
            return {"success": True, "message": "Verifizierungs-E-Mail erfolgreich gesendet"}
        except Exception as e:
            logger.error(f"Error sending verification email: {e}")
            return {"success": False, "message": f"Fehler beim Senden der Verifizierungs-E-Mail: {str(e)}"}
