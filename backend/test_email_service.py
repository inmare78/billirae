"""Test script for email service."""
import os
import sys
import asyncio
from datetime import datetime

# Add the backend directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'billirae_backend')))

# Import the necessary modules
from app.services.email_service import EmailService

async def test_email_service():
    """Test email service with mock data."""
    print("Testing email service with mock data...")
    
    # Create email service
    email_service = EmailService()
    
    # Test email parameters
    recipient_email = "test@example.com"
    subject = "Test Invoice Email"
    body_html = """
    <html>
        <body>
            <p>Sehr geehrte(r) Kunde,</p>
            <p>anbei erhalten Sie die Rechnung INV-2025-001 vom 02.05.2025.</p>
            <p>Mit freundlichen Grüßen,<br>Test Company GmbH</p>
            <hr>
            <p style="font-size: 12px; color: #666;">
                Diese E-Mail wurde über Billirae gesendet, eine Anwendung für Rechnungsstellung.
            </p>
        </body>
    </html>
    """
    
    # Get PDF data from file
    try:
        with open("test_invoice_mock.pdf", "rb") as f:
            pdf_data = f.read()
        
        # Test email delivery
        success = await email_service.send_invoice_email(
            recipient_email=recipient_email,
            subject=subject,
            body_html=body_html,
            pdf_data=pdf_data,
            pdf_filename="test_invoice.pdf"
        )
        
        if success:
            print("Email would be sent successfully (mock mode)")
        else:
            print("Email sending would fail (mock mode)")
            
    except Exception as e:
        print(f"Error in email test: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_email_service())
