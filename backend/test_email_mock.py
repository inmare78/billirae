"""Test script for email service with mocked settings."""
import os
import sys
import asyncio
from unittest.mock import patch, MagicMock

# Add the backend directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'billirae_backend')))

# Mock the settings
mock_settings = MagicMock()
mock_settings.EMAIL_SENDER = "test@example.com"
mock_settings.EMAIL_PROVIDER = "mock"
mock_settings.EMAIL_PROVIDER_API_KEY = "test_key"

# Apply the mock
with patch('app.services.email_service.settings', mock_settings):
    # Now import the EmailService
    from app.services.email_service import EmailService

class MockEmailService(EmailService):
    """Mock version of EmailService for testing."""
    
    def __init__(self):
        """Initialize with mock settings."""
        self.sender_email = "test@example.com"
        self.api_key = "test_key"
        self.provider = "mock"
    
    async def send_invoice_email(self, recipient_email, subject, body_html, pdf_data, pdf_filename, cc_emails=None):
        """Mock implementation that always succeeds."""
        print(f"MOCK: Would send email to {recipient_email} with subject '{subject}'")
        print(f"MOCK: PDF attachment: {pdf_filename} ({len(pdf_data)} bytes)")
        if cc_emails:
            print(f"MOCK: CC: {', '.join(cc_emails)}")
        return True

async def test_mock_email_service():
    """Test the mock email service."""
    print("Testing mock email service...")
    
    # Create mock email service
    email_service = MockEmailService()
    
    # Test email parameters
    recipient_email = "customer@example.com"
    subject = "Test Invoice Email"
    body_html = "<html><body><p>Test email body</p></body></html>"
    
    # Get PDF data from file if it exists, otherwise use dummy data
    try:
        with open("test_invoice_mock.pdf", "rb") as f:
            pdf_data = f.read()
    except FileNotFoundError:
        print("PDF file not found, using dummy data")
        pdf_data = b"Dummy PDF data"
    
    # Test email delivery
    success = await email_service.send_invoice_email(
        recipient_email=recipient_email,
        subject=subject,
        body_html=body_html,
        pdf_data=pdf_data,
        pdf_filename="test_invoice.pdf",
        cc_emails=["accounting@example.com"]
    )
    
    if success:
        print("Mock email sent successfully")
    else:
        print("Mock email sending failed")

if __name__ == "__main__":
    asyncio.run(test_mock_email_service())
