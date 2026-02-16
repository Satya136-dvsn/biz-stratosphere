# © 2026 VenkataSatyanarayana Duba
# Biz Stratosphere - Proprietary Software
# Unauthorized copying or distribution prohibited.

from pydantic import BaseModel

class OllamaPredictionRequest(BaseModel):
    prompt: str
    model: str = "llama3.1"
    temperature: float = 0.7
    max_tokens: int = 1000
