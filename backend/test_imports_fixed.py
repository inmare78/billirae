"""Test script to check if import issues are fixed."""
import os
import sys

# Try to import the necessary modules
try:
    from billirae_backend.app.services.pdf_service import PDFService
    from billirae_backend.app.services.email_service import EmailService
    from billirae_backend.app.api.invoices import router as invoices_router
    print("Successfully imported all modules")
except Exception as e:
    print(f"Error importing modules: {str(e)}")

if __name__ == "__main__":
    print("Testing imports after setup.py installation...")
