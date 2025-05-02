from datetime import datetime
from typing import Optional, Dict, List
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId

class PyObjectId(str):
    """Custom ObjectId field for Pydantic models."""
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
        
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)

class Address(BaseModel):
    """User or client address."""
    street: str
    city: str
    zip: str
    country: str = "Deutschland"

class BankDetails(BaseModel):
    """User bank details."""
    account_holder: str
    iban: str
    bic: Optional[str] = None

class UserSettings(BaseModel):
    """User settings."""
    dark_mode: bool = False
    language: str = "de"
    invoice_prefix: Optional[str] = None
    next_invoice_number: int = 1

class UserBase(BaseModel):
    """Base user model."""
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_name: Optional[str] = None
    address: Optional[Address] = None
    tax_id: Optional[str] = None
    bank_details: Optional[BankDetails] = None
    settings: UserSettings = Field(default_factory=UserSettings)

class UserCreate(UserBase):
    """User creation model."""
    password: str

class UserInDB(UserBase):
    """User model as stored in the database."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    password_hash: str
    email_verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class User(UserBase):
    """User model for API responses."""
    id: PyObjectId
    email_verified: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserUpdate(BaseModel):
    """User update model."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_name: Optional[str] = None
    address: Optional[Address] = None
    tax_id: Optional[str] = None
    bank_details: Optional[BankDetails] = None
    settings: Optional[UserSettings] = None
