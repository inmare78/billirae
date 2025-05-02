from fastapi import APIRouter

from . import voice, profile

api_router = APIRouter()
api_router.include_router(voice.router, prefix="/voice", tags=["voice"])
api_router.include_router(profile.router, prefix="/users", tags=["users"])
