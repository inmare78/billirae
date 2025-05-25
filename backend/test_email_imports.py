"""Test script for email service imports."""
import os
import sys

# Add the backend directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'billirae_backend')))

# Try to import the necessary modules
try:
    from app.services.email_service import EmailService
    print("Successfully imported EmailService")
except Exception as e:
    print(f"Error importing EmailService: {str(e)}")

if __name__ == "__main__":
    print("Testing email service imports...")
