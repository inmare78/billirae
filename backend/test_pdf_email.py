"""Test script for PDF generation and email delivery."""
import os
import sys
import asyncio
from datetime import datetime

# Add the backend directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'billirae_backend')))

# Import the necessary modules
from app.db.models.invoice import InvoiceInDB
from app.db.models.user import UserInDB
from app.db.models.client import ClientInDB
from app.services.pdf_service import PDFService
from app.services.email_service import EmailService

async def test_pdf_generation():
    """Test PDF generation with a sample invoice."""
    print("Testing PDF generation...")
    
    # Create a sample user
    user = UserInDB(
        id="test_user_id",
        email="test@example.com",
        hashed_password="hashed_password",
        first_name="Test",
        last_name="User",
        company_name="Test Company GmbH",
        address={
            "street": "Teststraße 123",
            "zip": "10115",
            "city": "Berlin",
            "country": "Deutschland"
        },
        tax_id="DE123456789",
        vat_id="DE987654321",
        bank_details={
            "account_holder": "Test Company GmbH",
            "iban": "DE89370400440532013000",
            "bic": "TESTBICXXXX",
            "bank_name": "Test Bank"
        },
        is_small_business=False
    )
    
    # Create a sample client
    client = ClientInDB(
        id="test_client_id",
        user_id="test_user_id",
        name="Test Client GmbH",
        email="client@example.com",
        address={
            "street": "Kundenstraße 456",
            "zip": "80331",
            "city": "München",
            "country": "Deutschland"
        }
    )
    
    # Create a sample invoice
    invoice = InvoiceInDB(
        id="test_invoice_id",
        user_id="test_user_id",
        client_id="test_client_id",
        invoice_number="INV-2025-001",
        invoice_date=datetime.now(),
        due_date=datetime.now(),
        status="draft",
        items=[
            {
                "service": "Massage",
                "quantity": 3,
                "unit_price": 80.0,
                "tax_rate": 0.19
            }
        ],
        subtotal=240.0,
        tax_amount=45.60,
        total=285.60,
        currency="EUR",
        language="de",
        notes="Vielen Dank für Ihren Auftrag!"
    )
    
    # Generate PDF
    pdf_service = PDFService()
    try:
        pdf_bytes = await pdf_service.generate_invoice_pdf(invoice, user, client)
        
        # Save PDF to file for inspection
        with open("test_invoice.pdf", "wb") as f:
            f.write(pdf_bytes)
        
        print(f"PDF generated successfully and saved to test_invoice.pdf ({len(pdf_bytes)} bytes)")
        return pdf_bytes
    except Exception as e:
        print(f"Error generating PDF: {str(e)}")
        return None

async def test_email_delivery(pdf_bytes):
    """Test email delivery with a sample email."""
    if not pdf_bytes:
        print("Cannot test email delivery without PDF bytes")
        return
    
    print("Testing email delivery...")
    
    # Create email service
    email_service = EmailService()
    
    # Test email delivery
    try:
        # This will not actually send an email unless SMTP/Resend/Mailgun is configured
        success = await email_service.send_invoice_email(
            recipient_email="test@example.com",
            subject="Test Invoice",
            body_html="<html><body><p>This is a test email with an invoice PDF attachment.</p></body></html>",
            pdf_data=pdf_bytes,
            pdf_filename="test_invoice.pdf"
        )
        
        if success:
            print("Email sent successfully")
        else:
            print("Email sending failed")
    except Exception as e:
        print(f"Error sending email: {str(e)}")

async def main():
    """Run the tests."""
    pdf_bytes = await test_pdf_generation()
    await test_email_delivery(pdf_bytes)

if __name__ == "__main__":
    asyncio.run(main())
