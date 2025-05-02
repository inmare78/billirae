import json
from typing import Dict, Any
import openai
from app.core.config import settings
from app.db.models.invoice import VoiceInvoiceInput

class GPTService:
    """Service for interacting with OpenAI GPT."""
    
    def __init__(self):
        openai.api_key = settings.OPENAI_API_KEY
    
    async def parse_voice_input(self, voice_input: VoiceInvoiceInput) -> Dict[str, Any]:
        """
        Parse German voice input into structured invoice data using GPT-4.
        
        Args:
            voice_input: The voice input text to parse
            
        Returns:
            Structured invoice data as a dictionary
        """
        try:
            response = await openai.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": settings.GPT_SYSTEM_MESSAGE},
                    {"role": "user", "content": voice_input.voice_text}
                ],
                temperature=0.1,  # Low temperature for more deterministic outputs
                max_tokens=500
            )
            
            content = response.choices[0].message.content
            
            parsed_data = json.loads(content)
            
            return parsed_data
        except Exception as e:
            print(f"Error parsing voice input: {e}")
            raise
