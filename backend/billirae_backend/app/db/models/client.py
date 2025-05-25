from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr

class Address(BaseModel):
    """Model for an address."""
    street: str
    city: str
    zip: str
    country: str = "Deutschland"

class ClientInDB(BaseModel):
    """Model for a client stored in the database."""
    id: Optional[str] = None
    user_id: str
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[Address] = None
    tax_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    @classmethod
    async def get_by_id(cls, client_id: str) -> Optional['ClientInDB']:
        """Get client by ID."""
        # This would normally query the database
        # For now, return a mock client for testing
        return cls(
            id=client_id,
            user_id="user123",
            name="Max Mustermann",
            email="max@example.com",
            address=Address(
                street="Musterstraße 123",
                city="Berlin",
                zip="10115",
                country="Deutschland"
            )
        )

    async def save(self) -> 'ClientInDB':
        """Save client to database."""
        self.updated_at = datetime.now()
        # This would normally save to the database
        return self
