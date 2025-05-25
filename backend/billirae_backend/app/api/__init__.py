from fastapi import APIRouter

# Create the router first
api_router = APIRouter()

# Then import the modules
from billirae_backend.app.api import auth, users, voice, profile, invoices, gdpr

# Include routers
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(voice.router, prefix="/voice", tags=["voice"])
api_router.include_router(profile.router, prefix="/profile", tags=["profile"])
api_router.include_router(invoices.router, prefix="/invoices", tags=["invoices"])
api_router.include_router(gdpr.router, prefix="/gdpr", tags=["gdpr"])
