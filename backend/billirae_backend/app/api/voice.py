from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any

from ..services.gpt_service import GPTService

router = APIRouter()

class VoiceTranscriptRequest(BaseModel):
    """Request model for voice transcript processing."""
    text: str

class VoiceTranscriptResponse(BaseModel):
    """Response model for processed voice transcript."""
    parsed_data: Dict[str, Any]

@router.post("/parse", response_model=VoiceTranscriptResponse)
async def parse_voice_transcript(request: VoiceTranscriptRequest):
    """
    Parse voice transcript into structured invoice data using GPT-4.
    
    Args:
        request: VoiceTranscriptRequest containing the voice transcript text
        
    Returns:
        VoiceTranscriptResponse containing the parsed invoice data
    """
    try:
        parsed_data = await GPTService.parse_invoice_text(request.text)
        return VoiceTranscriptResponse(parsed_data=parsed_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing voice transcript: {str(e)}")
