"""
SQLAlchemy Database Models
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    analyses = relationship("AnalysisHistory", back_populates="user", cascade="all, delete-orphan")


class AnalysisHistory(Base):
    __tablename__ = "analysis_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # File information
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(10), nullable=False)  # MP3, MP4, WAV
    file_size = Column(Integer, nullable=False)  # in bytes
    
    # Analysis results
    truth_score = Column(Float, nullable=True)  # 0-100
    audio_score = Column(Float, nullable=True)  # 0-100
    video_score = Column(Float, nullable=True)  # 0-100
    
    # Additional data
    spectrogram_path = Column(String(500), nullable=True)
    anomalies_detected = Column(JSON, nullable=True)  # List of anomalies
    
    # Metadata
    analysis_duration = Column(Float, nullable=True)  # in seconds
    status = Column(String(20), default="pending")  # pending, processing, completed, failed
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    user = relationship("User", back_populates="analyses")