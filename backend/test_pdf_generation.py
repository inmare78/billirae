"""Simple test script for PDF generation."""
import os
import sys
from datetime import datetime
import asyncio

# Add the backend directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'billirae_backend')))

# Import the necessary modules
from app.services.pdf_service import PDFService

async def test_pdf_generation():
    """Test PDF generation with mock data."""
    print("Testing PDF generation with mock data...")
    
    # Create PDF service
    pdf_service = PDFService()
    
    # Mock data for PDF generation
    invoice_data = {
        "invoice_number": "INV-2025-001",
        "invoice_date": datetime.now(),
        "due_date": datetime.now(),
        "items": [
            {
                "service": "Massage",
                "quantity": 3,
                "unit_price": 80.0,
                "tax_rate": 0.19
            }
        ],
        "subtotal": 240.0,
        "tax_amount": 45.60,
        "total": 285.60,
        "currency": "EUR",
        "notes": "Vielen Dank für Ihren Auftrag!"
    }
    
    user_data = {
        "company_name": "Test Company GmbH",
        "first_name": "Test",
        "last_name": "User",
        "address": "Teststraße 123, 10115 Berlin",
        "city": "Berlin",
        "postal_code": "10115",
        "country": "Deutschland",
        "tax_id": "DE123456789",
        "vat_id": "DE987654321",
        "bank_name": "Test Bank",
        "bank_iban": "DE89370400440532013000",
        "bank_bic": "TESTBICXXXX",
        "is_small_business": False
    }
    
    client_data = {
        "name": "Test Client GmbH",
        "email": "client@example.com",
        "address": "Kundenstraße 456, 80331 München"
    }
    
    try:
        # Generate PDF directly with mock data
        pdf_bytes = await pdf_service.generate_invoice_pdf_mock(invoice_data, user_data, client_data)
        
        # Save PDF to file for inspection
        with open("test_invoice_mock.pdf", "wb") as f:
            f.write(pdf_bytes)
        
        print(f"PDF generated successfully and saved to test_invoice_mock.pdf ({len(pdf_bytes)} bytes)")
        return pdf_bytes
    except Exception as e:
        print(f"Error generating PDF: {str(e)}")
        return None

if __name__ == "__main__":
    asyncio.run(test_pdf_generation())
