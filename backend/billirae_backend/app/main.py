from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.core.config import settings
from app.db.mongodb import mongodb

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.APP_NAME)

# CORS middleware. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    """Connect to MongoDB on startup."""
    await mongodb.connect_to_mongo()
    logger.info("Connected to MongoDB")

@app.on_event("shutdown")
async def shutdown_db_client():
    """Close MongoDB connection on shutdown."""
    await mongodb.close_mongo_connection()
    logger.info("MongoDB connection closed")

@app.get("/healthz")
async def healthz():
    """Health check endpoint."""
    return {"status": "ok"}

from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.invoices import router as invoices_router
from app.api.gdpr import router as gdpr_router

app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(invoices_router, prefix=settings.API_V1_STR)
app.include_router(gdpr_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Willkommen bei der Billirae API",
        "version": "0.1.0",
        "docs": "/docs"
    }
