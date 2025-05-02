from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId
from app.db.models.user import PyObjectId, Address

class ClientBase(BaseModel):
    """Base client model."""
    name: str
    email: Optional[EmailStr] = None
    address: Optional[Address] = None
    tax_id: Optional[str] = None

class ClientCreate(ClientBase):
    """Client creation model."""
    user_id: str

class ClientInDB(ClientBase):
    """Client model as stored in the database."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Client(ClientBase):
    """Client model for API responses."""
    id: PyObjectId
    user_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class ClientUpdate(BaseModel):
    """Client update model."""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[Address] = None
    tax_id: Optional[str] = None
