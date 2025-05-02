import os
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    """Application settings."""
    
    APP_NAME: str = "Billirae API"
    API_V1_STR: str = "/api/v1"
    
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "billirae_db")
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "insecuresecretkey")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    EMAIL_PROVIDER_API_KEY: str = os.getenv("EMAIL_PROVIDER_API_KEY", "")
    EMAIL_SENDER: str = os.getenv("EMAIL_SENDER", "noreply@billirae.com")
    
    CORS_ORIGINS: List[str] = ["*"]
    
    GPT_SYSTEM_MESSAGE: str = """Du bist ein Parsing-Assistent. Deine Aufgabe ist es, deutsche Spracheingaben für Rechnungen in saubere JSON-Daten umzuwandeln. Gib ausschließlich ein valides JSON-Objekt zurück mit folgenden Feldern: client (String), service (String), quantity (Integer), unit_price (Float), tax_rate (Float), invoice_date (yyyy-mm-dd), currency ('EUR'), language ('de'). Verwende niemals freien Text. Interpretiere Begriffe wie „heute" korrekt. Antworte nur mit JSON."""

settings = Settings()
