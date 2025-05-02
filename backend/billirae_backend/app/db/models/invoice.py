from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from bson import ObjectId
from app.db.models.user import PyObjectId

class InvoiceItem(BaseModel):
    """Invoice item model."""
    service: str
    description: Optional[str] = None
    quantity: int = 1
    unit_price: float
    tax_rate: float = 0.19  # Default German VAT rate
    
    @validator('quantity')
    def quantity_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be positive')
        return v
    
    @validator('unit_price')
    def unit_price_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Unit price must be positive')
        return v
    
    @validator('tax_rate')
    def tax_rate_must_be_valid(cls, v):
        if v < 0:
            raise ValueError('Tax rate cannot be negative')
        return v

class InvoiceBase(BaseModel):
    """Base invoice model."""
    client_id: str
    invoice_date: date = Field(default_factory=date.today)
    due_date: Optional[date] = None
    items: List[InvoiceItem]
    notes: Optional[str] = None
    currency: str = "EUR"
    language: str = "de"
    
    @validator('due_date', pre=True, always=True)
    def set_due_date(cls, v, values):
        if v is None and 'invoice_date' in values:
            return values['invoice_date'] + datetime.timedelta(days=14)
        return v

class InvoiceCreate(InvoiceBase):
    """Invoice creation model."""
    user_id: str

class InvoiceInDB(InvoiceBase):
    """Invoice model as stored in the database."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: str
    invoice_number: str
    subtotal: float
    tax_amount: float
    total: float
    status: str = "draft"  # draft, sent, paid, overdue
    pdf_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Invoice(InvoiceBase):
    """Invoice model for API responses."""
    id: PyObjectId
    user_id: str
    invoice_number: str
    subtotal: float
    tax_amount: float
    total: float
    status: str
    pdf_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class InvoiceUpdate(BaseModel):
    """Invoice update model."""
    client_id: Optional[str] = None
    invoice_date: Optional[date] = None
    due_date: Optional[date] = None
    items: Optional[List[InvoiceItem]] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class VoiceInvoiceInput(BaseModel):
    """Model for voice input to be parsed by GPT."""
    voice_text: str
