"""
PashuRakshak - Pydantic Request & Response Schemas
"""

from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class ReportCreate(BaseModel):
    animal_id: Optional[int] = None
    species: str = "cow"
    age: int = 3
    symptoms: List[str]
    duration_days: int = 1
    vaccination_status: str = "Vaccinated"
    free_text_notes: Optional[str] = None
    photo_url: Optional[str] = None
    latitude: float = 30.9010
    longitude: float = 75.8572
    village: Optional[str] = "Samrala"
    district: Optional[str] = "Ludhiana"

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: str = "farmer"
    phone: Optional[str] = None
    village: Optional[str] = "Samrala"
    district: Optional[str] = "Ludhiana"

class UserLogin(BaseModel):
    email: str
    password: str

class VoiceParseRequest(BaseModel):
    transcript: str
    language: Optional[str] = "hi-IN"

class CaseStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None
