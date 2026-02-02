"""
Echo-Check Backend - main.py
FastAPI application for deepfake detection
"""

from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List
import uvicorn
import os
import shutil
from pathlib import Path

# Local imports (we'll create these files)
from database import engine, Base, get_db
from models import User, AnalysisHistory
from schemas import UserCreate, UserLogin, Token, AnalysisResponse, HistoryResponse
from auth import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from ai_models import AudioAnalyzer, VideoAnalyzer
from utils import (
    save_upload_file,
    extract_audio_features,
    extract_video_frames,
    generate_spectrogram,
    detect_anomalies,
    calculate_truth_score,
    generate_pdf_report
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Echo-Check API",
    description="Intelligent Deepfake Detection System",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create necessary directories
UPLOAD_DIR = Path("uploads")
MODELS_DIR = Path("models")
SPECTROGRAMS_DIR = Path("spectrograms")

for directory in [UPLOAD_DIR, MODELS_DIR, SPECTROGRAMS_DIR]:
    directory.mkdir(exist_ok=True)

# Initialize AI models
audio_analyzer = AudioAnalyzer()
video_analyzer = VideoAnalyzer()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


# ============= AUTHENTICATION ENDPOINTS =============

@app.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "User created successfully", "user_id": new_user.id}


@app.post("/token", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login and get access token"""
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/users/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email
    }


# ============= FILE UPLOAD & ANALYSIS ENDPOINTS =============

@app.post("/upload", response_model=AnalysisResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload and analyze media file"""
    
    # Validate file type
    allowed_extensions = [".mp3", ".mp4", ".wav", ".m4a"]
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type not supported. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Validate file size (max 100MB)
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > 100 * 1024 * 1024:  # 100MB
        raise HTTPException(
            status_code=400,
            detail="File size exceeds 100MB limit"
        )
    
    # Save file
    file_path = await save_upload_file(file, UPLOAD_DIR)
    
    # Create analysis record
    analysis = AnalysisHistory(
        user_id=current_user.id,
        file_name=file.filename,
        file_type=file_ext[1:].upper(),
        file_size=file_size,
        status="processing"
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    
    try:
        start_time = datetime.utcnow()
        
        # Determine file type and analyze
        is_video = file_ext in [".mp4"]
        
        audio_score = None
        video_score = None
        anomalies = []
        spectrogram_path = None
        
        if is_video:
            # Extract audio from video
            audio_data = extract_audio_features(file_path)
            frames = extract_video_frames(file_path)
            
            # Analyze audio
            audio_result = audio_analyzer.analyze(audio_data)
            audio_score = audio_result["confidence"]
            
            # Analyze video frames
            video_result = video_analyzer.analyze(frames)
            video_score = video_result["confidence"]
            
            # Generate spectrogram
            spectrogram_path = generate_spectrogram(
                audio_data, 
                SPECTROGRAMS_DIR / f"{analysis.id}_spectrogram.png"
            )
            
            # Detect anomalies
            anomalies = detect_anomalies(audio_result, video_result)
            
        else:
            # Audio only
            audio_data = extract_audio_features(file_path)
            audio_result = audio_analyzer.analyze(audio_data)
            audio_score = audio_result["confidence"]
            
            # Generate spectrogram
            spectrogram_path = generate_spectrogram(
                audio_data,
                SPECTROGRAMS_DIR / f"{analysis.id}_spectrogram.png"
            )
            
            # Detect anomalies
            anomalies = detect_anomalies(audio_result, None)
        
        # Calculate overall truth score
        truth_score = calculate_truth_score(audio_score, video_score)
        
        # Update analysis record
        end_time = datetime.utcnow()
        analysis.truth_score = truth_score
        analysis.audio_score = audio_score
        analysis.video_score = video_score
        analysis.spectrogram_path = str(spectrogram_path) if spectrogram_path else None
        analysis.anomalies_detected = anomalies
        analysis.analysis_duration = (end_time - start_time).total_seconds()
        analysis.status = "completed"
        
        db.commit()
        db.refresh(analysis)
        
        return AnalysisResponse(
            id=analysis.id,
            file_name=analysis.file_name,
            file_type=analysis.file_type,
            truth_score=analysis.truth_score,
            audio_score=analysis.audio_score,
            video_score=analysis.video_score,
            anomalies_detected=analysis.anomalies_detected,
            spectrogram_url=f"/spectrograms/{analysis.id}",
            analysis_duration=analysis.analysis_duration,
            status=analysis.status,
            created_at=analysis.created_at
        )
        
    except Exception as e:
        # Update status to failed
        analysis.status = "failed"
        db.commit()
        
        # Clean up file
        if os.path.exists(file_path):
            os.remove(file_path)
        
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


@app.get("/spectrograms/{analysis_id}")
async def get_spectrogram(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get spectrogram image for an analysis"""
    analysis = db.query(AnalysisHistory).filter(
        AnalysisHistory.id == analysis_id,
        AnalysisHistory.user_id == current_user.id
    ).first()
    
    if not analysis or not analysis.spectrogram_path:
        raise HTTPException(status_code=404, detail="Spectrogram not found")
    
    if not os.path.exists(analysis.spectrogram_path):
        raise HTTPException(status_code=404, detail="Spectrogram file not found")
    
    return FileResponse(analysis.spectrogram_path)


# ============= HISTORY ENDPOINTS =============

@app.get("/history", response_model=List[HistoryResponse])
async def get_history(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's analysis history"""
    analyses = db.query(AnalysisHistory).filter(
        AnalysisHistory.user_id == current_user.id
    ).order_by(
        AnalysisHistory.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return [
        HistoryResponse(
            id=a.id,
            file_name=a.file_name,
            file_type=a.file_type,
            truth_score=a.truth_score,
            status=a.status,
            created_at=a.created_at
        ) for a in analyses
    ]


@app.get("/history/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis_detail(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed analysis result"""
    analysis = db.query(AnalysisHistory).filter(
        AnalysisHistory.id == analysis_id,
        AnalysisHistory.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return AnalysisResponse(
        id=analysis.id,
        file_name=analysis.file_name,
        file_type=analysis.file_type,
        truth_score=analysis.truth_score,
        audio_score=analysis.audio_score,
        video_score=analysis.video_score,
        anomalies_detected=analysis.anomalies_detected,
        spectrogram_url=f"/spectrograms/{analysis.id}",
        analysis_duration=analysis.analysis_duration,
        status=analysis.status,
        created_at=analysis.created_at
    )


@app.delete("/history/{analysis_id}")
async def delete_analysis(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an analysis record"""
    analysis = db.query(AnalysisHistory).filter(
        AnalysisHistory.id == analysis_id,
        AnalysisHistory.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Delete associated files
    if analysis.spectrogram_path and os.path.exists(analysis.spectrogram_path):
        os.remove(analysis.spectrogram_path)
    
    db.delete(analysis)
    db.commit()
    
    return {"message": "Analysis deleted successfully"}


# ============= REPORT ENDPOINTS =============

@app.get("/report/{analysis_id}")
async def download_report(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate and download PDF report"""
    analysis = db.query(AnalysisHistory).filter(
        AnalysisHistory.id == analysis_id,
        AnalysisHistory.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Generate PDF report
    pdf_path = generate_pdf_report(analysis, current_user)
    
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"echo_check_report_{analysis_id}.pdf"
    )


# ============= HEALTH CHECK =============

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Echo-Check API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",
        "models": {
            "audio_analyzer": "loaded",
            "video_analyzer": "loaded"
        }
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )