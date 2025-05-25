from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
from bson import ObjectId

class UserBase(BaseModel):
    """Base model for user data."""
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = "DE"
    phone: Optional[str] = None
    tax_id: Optional[str] = None
    vat_id: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    bank_iban: Optional[str] = None
    bank_bic: Optional[str] = None
    logo_url: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    """Model for user creation."""
    password: str

class UserUpdate(BaseModel):
    """Model for user update."""
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    tax_id: Optional[str] = None
    vat_id: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    bank_iban: Optional[str] = None
    bank_bic: Optional[str] = None
    logo_url: Optional[str] = None
    password: Optional[str] = None

class UserInDB(UserBase):
    """Model for user in database."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    @classmethod
    async def get_by_id(cls, user_id: str):
        """Get user by ID."""
        from billirae_backend.app.db.mongodb import MongoDB
        user_data = await MongoDB.db.users.find_one({"id": user_id})
        if user_data:
            return cls(**user_data)
        return None
    
    @classmethod
    async def get_by_email(cls, email: str):
        """Get user by email."""
        from billirae_backend.app.db.mongodb import MongoDB
        user_data = await MongoDB.db.users.find_one({"email": email})
        if user_data:
            return cls(**user_data)
        return None
    
    async def save(self):
        """Save user to database."""
        from billirae_backend.app.db.mongodb import MongoDB
        self.updated_at = datetime.now()
        user_data = self.dict()
        await MongoDB.db.users.update_one(
            {"id": self.id},
            {"$set": user_data},
            upsert=True
        )
        return self
    
    async def delete(self):
        """Delete user from database."""
        from billirae_backend.app.db.mongodb import MongoDB
        await MongoDB.db.users.delete_one({"id": self.id})
        return True
