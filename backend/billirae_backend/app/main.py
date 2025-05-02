from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from .api import voice

app = FastAPI(
    title="Billirae API",
    description="API for Billirae voice-first invoicing tool",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(voice.router, prefix="/api/voice", tags=["voice"])

@app.get("/")
async def root():
    return {"message": "Welcome to Billirae API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
