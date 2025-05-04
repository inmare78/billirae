from fastapi import APIRouter, HTTPException, Depends, Body, File, UploadFile, Form
from pydantic import BaseModel
from typing import Dict, Any, Optional
import tempfile
import os
import shutil

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
    transcript: Optional[str] = None

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

@router.post("/parse", response_model=VoiceTranscriptionResponse)
async def parse_voice_audio(
    audio: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Parse voice audio file to structured invoice data using OpenAI Whisper.
    
    Args:
        audio: Audio file upload
        current_user: Current authenticated user
        
    Returns:
        Transcript and structured invoice data
    """
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".webm")
    temp_file_path = temp_file.name
    
    try:
        with temp_file:
            shutil.copyfileobj(audio.file, temp_file)
        
        # Process the audio file with Whisper and GPT
        transcript, invoice_data = await gpt_service.transcribe_audio(temp_file_path)
        
        return VoiceTranscriptionResponse(
            success=True,
            data=invoice_data,
            transcript=transcript
        )
        
    except Exception as e:
        return VoiceTranscriptionResponse(
            success=False,
            error=str(e)
        )
    finally:
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
