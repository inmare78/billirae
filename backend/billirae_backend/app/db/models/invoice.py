from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class InvoiceItem(BaseModel):
    """Model for an invoice item."""
    service: str
    quantity: int
    unit_price: float
    tax_rate: float = 0.19  # Default German VAT rate

class InvoiceInDB(BaseModel):
    """Model for an invoice stored in the database."""
    id: Optional[str] = None
    user_id: str
    client_id: str
    invoice_number: str
    invoice_date: datetime = Field(default_factory=datetime.now)
    due_date: Optional[datetime] = None
    items: List[InvoiceItem]
    subtotal: float
    tax_amount: float
    total: float
    status: str = "draft"  # draft, sent, paid, overdue, cancelled
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    sent_date: Optional[datetime] = None
    paid_date: Optional[datetime] = None

    @classmethod
    async def get_by_id(cls, invoice_id: str) -> Optional['InvoiceInDB']:
        """Get invoice by ID."""
        # This would normally query the database
        # For now, return a mock invoice for testing
        return cls(
            id=invoice_id,
            user_id="user123",
            client_id="client123",
            invoice_number="INV-2023-001",
            items=[
                InvoiceItem(
                    service="Massage",
                    quantity=3,
                    unit_price=80.0,
                    tax_rate=0.19
                )
            ],
            subtotal=240.0,
            tax_amount=45.6,
            total=285.6
        )

    async def save(self) -> 'InvoiceInDB':
        """Save invoice to database."""
        self.updated_at = datetime.now()
        # This would normally save to the database
        return self
