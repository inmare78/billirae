from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel
from typing import Dict, Any, Optional

from billirae_backend.app.core.security import get_current_user
from billirae_backend.app.db.models.user import UserInDB
from billirae_backend.app.services.gpt_service import GPTService

router = APIRouter()
gpt_service = GPTService()

class VoiceTranscriptionRequest(BaseModel):
    """Request model for voice transcription."""
    audio_text: str

class VoiceTranscriptionResponse(BaseModel):
    """Response model for voice transcription."""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

@router.post("/transcribe", response_model=VoiceTranscriptionResponse)
async def transcribe_voice(
    request: VoiceTranscriptionRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Transcribe voice input to structured invoice data.
    
    Args:
        request: Voice transcription request
        current_user: Current authenticated user
        
    Returns:
        Structured invoice data
    """
    try:
        if not request.audio_text:
            raise HTTPException(status_code=400, detail="Audio text is required")
            
        # Process the voice input with GPT
        invoice_data = await gpt_service.parse_invoice_text(request.audio_text)
        
        return VoiceTranscriptionResponse(
            success=True,
            data=invoice_data
        )
        
    except Exception as e:
        return VoiceTranscriptionResponse(
            success=False,
            error=str(e)
        )
