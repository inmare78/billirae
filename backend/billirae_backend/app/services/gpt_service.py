import logging
import json
import tempfile
from typing import Dict, Any, Tuple
from datetime import datetime, timedelta
import openai
from billirae_backend.app.core.config import settings

logger = logging.getLogger(__name__)

class GPTService:
    """Service for processing voice input with GPT."""
    
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.system_message = """
        Du bist ein Parsing-Assistent. Deine Aufgabe ist es, deutsche Spracheingaben für Rechnungen in saubere JSON-Daten umzuwandeln. 
        Gib ausschließlich ein valides JSON-Objekt zurück mit folgenden Feldern: 
        client (String), service (String), quantity (Integer), unit_price (Float), tax_rate (Float), 
        invoice_date (yyyy-mm-dd), currency ('EUR'), language ('de'). 
        Verwende niemals freien Text. Interpretiere Begriffe wie 'heute' korrekt. Antworte nur mit JSON.
        """
    
    async def parse_invoice_text(self, text: str) -> Dict[str, Any]:
        """
        Parse German voice input into structured invoice data using GPT.
        
        Args:
            text: German voice input text
            
        Returns:
            Structured invoice data as dictionary
        """
        try:
            logger.info("Processing voice input with GPT")
            
            # Set OpenAI API key
            openai.api_key = self.api_key
            
            # Call GPT API
            response = await openai.ChatCompletion.acreate(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": self.system_message},
                    {"role": "user", "content": text}
                ],
                temperature=0.1,  # Low temperature for more deterministic output
                max_tokens=500
            )
            
            # Extract JSON response
            json_str = response.choices[0].message.content.strip()
            
            # Parse JSON
            invoice_data = json.loads(json_str)
            
            # Validate required fields
            required_fields = ["client", "service", "quantity", "unit_price", "tax_rate", "invoice_date", "currency", "language"]
            for field in required_fields:
                if field not in invoice_data:
                    raise ValueError(f"Missing required field: {field}")
            
            # Convert invoice_date string to datetime
            invoice_data["invoice_date"] = datetime.strptime(invoice_data["invoice_date"], "%Y-%m-%d")
            
            # Set default due date (30 days from invoice date)
            invoice_data["due_date"] = invoice_data["invoice_date"] + datetime.timedelta(days=30)
            
            return invoice_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing GPT response as JSON: {str(e)}")
            raise ValueError("Could not parse GPT response as JSON")
            
        except Exception as e:
            logger.error(f"Error processing voice input with GPT: {str(e)}")
            raise ValueError(f"Error processing voice input: {str(e)}")
    
    async def transcribe_audio(self, audio_file_path: str) -> Tuple[str, Dict[str, Any]]:
        """
        Transcribe audio file using OpenAI Whisper API and parse the transcript.
        
        Args:
            audio_file_path: Path to the audio file
            
        Returns:
            Tuple of (transcript, parsed_invoice_data)
        """
        try:
            logger.info("Transcribing audio with OpenAI Whisper")
            
            # Set OpenAI API key
            openai.api_key = self.api_key
            
            with open(audio_file_path, "rb") as audio_file:
                response = await openai.Audio.atranscribe(
                    model="whisper-1",
                    file=audio_file,
                    language="de",
                    response_format="text"
                )
            
            transcript = response.text
            
            logger.info(f"Transcription result: {transcript}")
            
            invoice_data = await self.parse_invoice_text(transcript)
            
            return transcript, invoice_data
            
        except Exception as e:
            logger.error(f"Error transcribing audio with Whisper: {str(e)}")
            raise ValueError(f"Error transcribing audio: {str(e)}")
    
    def _mock_parse_invoice(self, text: str) -> Dict[str, Any]:
        """
        Mock implementation for testing without OpenAI API.
        
        Args:
            text: German voice input text
            
        Returns:
            Structured invoice data as dictionary
        """
        # Example: "Drei Massagen à 80 Euro für Max Mustermann, heute, inklusive Mehrwertsteuer."
        today = datetime.now().strftime("%Y-%m-%d")
        
        return {
            "client": "Max Mustermann",
            "service": "Massage",
            "quantity": 3,
            "unit_price": 80.0,
            "tax_rate": 0.19,
            "invoice_date": datetime.strptime(today, "%Y-%m-%d"),
            "currency": "EUR",
            "language": "de"
        }
