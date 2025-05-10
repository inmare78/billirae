import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Application settings."""
    
    # API settings
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "Billirae"
    
    # MongoDB settings
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "billirae")
    
    # JWT settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-for-jwt")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # OpenAI settings
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Email settings
    EMAIL_PROVIDER: str = os.getenv("EMAIL_PROVIDER", "smtp")  # smtp, resend, mailgun
    EMAIL_PROVIDER_API_KEY: str = os.getenv("EMAIL_PROVIDER_API_KEY", "")
    EMAIL_SENDER: str = os.getenv("EMAIL_SENDER", "noreply@billirae.com")
    
    # SMTP settings (if using SMTP)
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "465"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    
    # Mailgun settings (if using Mailgun)
    MAILGUN_DOMAIN: str = os.getenv("MAILGUN_DOMAIN", "")
    
    class Config:
        env_file = ".env"

settings = Settings()
