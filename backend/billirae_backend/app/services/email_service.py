import os
import logging
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import List, Optional
from ..core.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    """Service for sending emails with invoice PDFs."""
    
    def __init__(self):
        self.sender_email = settings.EMAIL_SENDER
        self.api_key = settings.EMAIL_PROVIDER_API_KEY
        self.provider = settings.EMAIL_PROVIDER.lower()
    
    async def send_invoice_email(
        self,
        recipient_email: str,
        subject: str,
        body_html: str,
        pdf_data: bytes,
        pdf_filename: str,
        cc_emails: Optional[List[str]] = None
    ) -> bool:
        """
        Send an email with an invoice PDF attachment.
        
        Args:
            recipient_email: Email address of the recipient
            subject: Email subject
            body_html: HTML body of the email
            pdf_data: PDF file as bytes
            pdf_filename: Filename for the PDF attachment
            cc_emails: Optional list of CC email addresses
            
        Returns:
            True if email was sent successfully, False otherwise
        """
        try:
            logger.info(f"Sending invoice email to {self._redact_email(recipient_email)}")
            
            if self.provider == "smtp":
                return await self._send_via_smtp(
                    recipient_email, subject, body_html, pdf_data, pdf_filename, cc_emails
                )
            elif self.provider == "resend":
                return await self._send_via_resend(
                    recipient_email, subject, body_html, pdf_data, pdf_filename, cc_emails
                )
            elif self.provider == "mailgun":
                return await self._send_via_mailgun(
                    recipient_email, subject, body_html, pdf_data, pdf_filename, cc_emails
                )
            else:
                logger.error(f"Unsupported email provider: {self.provider}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending email to {self._redact_email(recipient_email)}: {str(e)}")
            return False
    
    async def _send_via_smtp(
        self,
        recipient_email: str,
        subject: str,
        body_html: str,
        pdf_data: bytes,
        pdf_filename: str,
        cc_emails: Optional[List[str]] = None
    ) -> bool:
        """Send email using SMTP."""
        try:
            message = MIMEMultipart()
            message["From"] = self.sender_email
            message["To"] = recipient_email
            message["Subject"] = subject
            
            if cc_emails:
                message["Cc"] = ", ".join(cc_emails)
            
            message.attach(MIMEText(body_html, "html"))
            
            attachment = MIMEApplication(pdf_data, Name=pdf_filename)
            attachment["Content-Disposition"] = f'attachment; filename="{pdf_filename}"'
            message.attach(attachment)
            
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(settings.SMTP_SERVER, settings.SMTP_PORT, context=context) as server:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                recipients = [recipient_email]
                if cc_emails:
                    recipients.extend(cc_emails)
                server.sendmail(self.sender_email, recipients, message.as_string())
            
            logger.info(f"Email sent successfully via SMTP to {self._redact_email(recipient_email)}")
            return True
            
        except Exception as e:
            logger.error(f"SMTP error: {str(e)}")
            return False
    
    async def _send_via_resend(
        self,
        recipient_email: str,
        subject: str,
        body_html: str,
        pdf_data: bytes,
        pdf_filename: str,
        cc_emails: Optional[List[str]] = None
    ) -> bool:
        """Send email using Resend API."""
        try:
            import resend
            
            resend.api_key = self.api_key
            
            attachments = [{
                "content": pdf_data,
                "filename": pdf_filename
            }]
            
            email_data = {
                "from": self.sender_email,
                "to": recipient_email,
                "subject": subject,
                "html": body_html,
                "attachments": attachments
            }
            
            if cc_emails:
                email_data["cc"] = cc_emails
            
            response = resend.Emails.send(email_data)
            
            if response and "id" in response:
                logger.info(f"Email sent successfully via Resend to {self._redact_email(recipient_email)}")
                return True
            else:
                logger.error(f"Resend API error: {response}")
                return False
                
        except Exception as e:
            logger.error(f"Resend API error: {str(e)}")
            return False
    
    async def _send_via_mailgun(
        self,
        recipient_email: str,
        subject: str,
        body_html: str,
        pdf_data: bytes,
        pdf_filename: str,
        cc_emails: Optional[List[str]] = None
    ) -> bool:
        """Send email using Mailgun API."""
        try:
            import requests
            
            mailgun_domain = settings.MAILGUN_DOMAIN
            
            data = {
                "from": self.sender_email,
                "to": recipient_email,
                "subject": subject,
                "html": body_html
            }
            
            if cc_emails:
                data["cc"] = ", ".join(cc_emails)
            
            files = [("attachment", (pdf_filename, pdf_data, "application/pdf"))]
            
            response = requests.post(
                f"https://api.mailgun.net/v3/{mailgun_domain}/messages",
                auth=("api", self.api_key),
                data=data,
                files=files
            )
            
            if response.status_code == 200:
                logger.info(f"Email sent successfully via Mailgun to {self._redact_email(recipient_email)}")
                return True
            else:
                logger.error(f"Mailgun API error: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Mailgun API error: {str(e)}")
            return False
    
    def _redact_email(self, email: str) -> str:
        """Redact email address for logging purposes."""
        if not email or "@" not in email:
            return "invalid-email"
            
        parts = email.split("@")
        username = parts[0]
        domain = parts[1]
        
        if len(username) <= 2:
            redacted_username = "*" * len(username)
        else:
            redacted_username = username[0] + "*" * (len(username) - 2) + username[-1]
            
        return f"{redacted_username}@{domain}"
