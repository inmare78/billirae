"""Test imports to verify module structure."""
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'billirae_backend')))

try:
    from app.services.pdf_service import PDFService
    print("Successfully imported PDFService")
except ImportError as e:
    print(f"Error importing PDFService: {str(e)}")

try:
    from app.services.email_service import EmailService
    print("Successfully imported EmailService")
except ImportError as e:
    print(f"Error importing EmailService: {str(e)}")

try:
    from app.api.invoices import router as invoices_router
    print("Successfully imported invoices router")
except ImportError as e:
    print(f"Error importing invoices router: {str(e)}")
