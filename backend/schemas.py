"""
Pydantic schemas for request/response validation
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ============= User Schemas =============

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


# ============= Analysis Schemas =============

class AnalysisResponse(BaseModel):
    id: int
    file_name: str
    file_type: str
    truth_score: Optional[float]
    audio_score: Optional[float]
    video_score: Optional[float]
    anomalies_detected: Optional[List[dict]]
    spectrogram_url: Optional[str]
    analysis_duration: Optional[float]
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class HistoryResponse(BaseModel):
    id: int
    file_name: str
    file_type: str
    truth_score: Optional[float]
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True