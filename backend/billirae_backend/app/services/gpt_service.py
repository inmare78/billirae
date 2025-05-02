import os
import json
from datetime import datetime
import openai
from typing import Dict, Any, Optional

openai.api_key = os.getenv("OPENAI_API_KEY")

class GPTService:
    """Service for interacting with OpenAI's GPT models for invoice parsing."""
    
    @staticmethod
    async def parse_invoice_text(text: str) -> Dict[str, Any]:
        """
        Parse German invoice text into structured JSON data using GPT-4.
        
        Args:
            text: The German voice input text to parse
            
        Returns:
            Dict containing the parsed invoice data with fields:
            - client (String)
            - service (String)
            - quantity (Integer)
            - unit_price (Float)
            - tax_rate (Float)
            - invoice_date (yyyy-mm-dd)
            - currency ('EUR')
            - language ('de')
        """
        try:
            system_message = """Du bist ein Parsing-Assistent. Deine Aufgabe ist es, deutsche Spracheingaben für Rechnungen in saubere JSON-Daten umzuwandeln. Gib ausschließlich ein valides JSON-Objekt zurück mit folgenden Feldern: client (String), service (String), quantity (Integer), unit_price (Float), tax_rate (Float), invoice_date (yyyy-mm-dd), currency ('EUR'), language ('de'). Verwende niemals freien Text. Interpretiere Begriffe wie 'heute' korrekt. Antworte nur mit JSON."""
            
            response = await openai.ChatCompletion.acreate(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": text}
                ],
                temperature=0.1,  # Low temperature for more deterministic outputs
                max_tokens=500
            )
            
            content = response.choices[0].message.content.strip()
            parsed_data = json.loads(content)
            
            required_fields = ["client", "service", "quantity", "unit_price", 
                              "tax_rate", "invoice_date", "currency", "language"]
            
            for field in required_fields:
                if field not in parsed_data:
                    raise ValueError(f"Missing required field: {field}")
            
            parsed_data["quantity"] = int(parsed_data["quantity"])
            parsed_data["unit_price"] = float(parsed_data["unit_price"])
            parsed_data["tax_rate"] = float(parsed_data["tax_rate"])
            
            try:
                datetime.strptime(parsed_data["invoice_date"], "%Y-%m-%d")
            except ValueError:
                raise ValueError("Invalid date format. Expected yyyy-mm-dd")
            
            return parsed_data
            
        except json.JSONDecodeError:
            raise ValueError("Failed to parse GPT response as JSON")
        except Exception as e:
            raise Exception(f"Error parsing invoice text: {str(e)}")
