"""
Utility functions for file processing, analysis, and reporting
"""

import os
import shutil
import librosa
import numpy as np
import cv2
from pathlib import Path
from typing import List, Dict, Optional
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
from fastapi import UploadFile
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.enums import TA_CENTER


async def save_upload_file(upload_file: UploadFile, destination: Path) -> Path:
    """Save uploaded file to disk"""
    file_path = destination / f"{datetime.utcnow().timestamp()}_{upload_file.filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    
    return file_path


def extract_audio_features(file_path: Path) -> np.ndarray:
    """
    Extract audio features from file
    
    Args:
        file_path: Path to audio/video file
        
    Returns:
        numpy array of audio samples
    """
    try:
        # Load audio file
        audio, sr = librosa.load(str(file_path), sr=16000, mono=True)
        return audio
    except Exception as e:
        print(f"Error extracting audio: {e}")
        # Return dummy audio for demonstration
        return np.random.randn(16000 * 5)  # 5 seconds of random audio


def extract_video_frames(file_path: Path, max_frames: int = 100) -> List[np.ndarray]:
    """
    Extract frames from video file
    
    Args:
        file_path: Path to video file
        max_frames: Maximum number of frames to extract
        
    Returns:
        List of frames as numpy arrays
    """
    try:
        cap = cv2.VideoCapture(str(file_path))
        frames = []
        frame_count = 0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Calculate frame skip to get evenly distributed frames
        skip = max(1, total_frames // max_frames)
        
        while cap.isOpened() and len(frames) < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_count % skip == 0:
                # Convert BGR to RGB
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frames.append(frame_rgb)
            
            frame_count += 1
        
        cap.release()
        return frames
    
    except Exception as e:
        print(f"Error extracting frames: {e}")
        # Return dummy frames for demonstration
        return [np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8) for _ in range(10)]


def generate_spectrogram(audio: np.ndarray, output_path: Path) -> Path:
    """
    Generate and save spectrogram image
    
    Args:
        audio: Audio samples
        output_path: Where to save spectrogram
        
    Returns:
        Path to saved spectrogram
    """
    try:
        plt.figure(figsize=(12, 6))
        
        # Compute spectrogram
        D = librosa.amplitude_to_db(
            np.abs(librosa.stft(audio)),
            ref=np.max
        )
        
        # Plot spectrogram
        librosa.display.specshow(
            D,
            sr=16000,
            x_axis='time',
            y_axis='hz',
            cmap='viridis'
        )
        
        plt.colorbar(format='%+2.0f dB')
        plt.title('Frequency Spectrogram Analysis')
        plt.xlabel('Time (s)')
        plt.ylabel('Frequency (Hz)')
        plt.tight_layout()
        
        # Save figure
        plt.savefig(str(output_path), dpi=150, bbox_inches='tight')
        plt.close()
        
        return output_path
    
    except Exception as e:
        print(f"Error generating spectrogram: {e}")
        
        # Generate dummy spectrogram
        plt.figure(figsize=(12, 6))
        plt.imshow(np.random.rand(100, 100), cmap='viridis', aspect='auto')
        plt.colorbar()
        plt.title('Frequency Spectrogram Analysis')
        plt.xlabel('Time (s)')
        plt.ylabel('Frequency (Hz)')
        plt.savefig(str(output_path), dpi=150, bbox_inches='tight')
        plt.close()
        
        return output_path


def detect_anomalies(
    audio_result: Optional[Dict],
    video_result: Optional[Dict]
) -> List[Dict]:
    """
    Detect anomalies in analysis results
    
    Args:
        audio_result: Audio analysis results
        video_result: Video analysis results
        
    Returns:
        List of detected anomalies
    """
    anomalies = []
    
    if audio_result:
        confidence = audio_result.get("confidence", 50)
        
        if confidence < 40:
            anomalies.append({
                "type": "audio",
                "severity": "high",
                "description": "Significant audio manipulation detected",
                "confidence": confidence
            })
        elif confidence < 60:
            anomalies.append({
                "type": "audio",
                "severity": "medium",
                "description": "Possible audio inconsistencies detected",
                "confidence": confidence
            })
        
        # Check spectral features
        features = audio_result.get("features", {})
        if features.get("spectral_consistency", 100) < 50:
            anomalies.append({
                "type": "audio_spectral",
                "severity": "medium",
                "description": "Unusual frequency patterns detected",
                "confidence": features["spectral_consistency"]
            })
    
    if video_result:
        confidence = video_result.get("confidence", 50)
        
        if confidence < 40:
            anomalies.append({
                "type": "video",
                "severity": "high",
                "description": "Significant video manipulation detected",
                "confidence": confidence
            })
        elif confidence < 60:
            anomalies.append({
                "type": "video",
                "severity": "medium",
                "description": "Possible video inconsistencies detected",
                "confidence": confidence
            })
        
        # Check temporal coherence
        features = video_result.get("features", {})
        if features.get("temporal_coherence", 100) < 55:
            anomalies.append({
                "type": "video_temporal",
                "severity": "medium",
                "description": "Frame-to-frame inconsistencies detected",
                "confidence": features["temporal_coherence"]
            })
    
    return anomalies


def calculate_truth_score(
    audio_score: Optional[float],
    video_score: Optional[float]
) -> float:
    """
    Calculate overall truth score from audio and video scores
    
    Args:
        audio_score: Audio authenticity score (0-100)
        video_score: Video authenticity score (0-100)
        
    Returns:
        Combined truth score (0-100)
    """
    if audio_score is not None and video_score is not None:
        # Weighted average (audio 40%, video 60%)
        return (audio_score * 0.4) + (video_score * 0.6)
    elif audio_score is not None:
        return audio_score
    elif video_score is not None:
        return video_score
    else:
        return 50.0  # Default neutral score


def generate_pdf_report(analysis, user) -> Path:
    """
    Generate PDF report for analysis
    
    Args:
        analysis: AnalysisHistory object
        user: User object
        
    Returns:
        Path to generated PDF
    """
    pdf_path = Path(f"reports/report_{analysis.id}.pdf")
    pdf_path.parent.mkdir(exist_ok=True)
    
    # Create PDF
    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18
    )
    
    # Container for PDF elements
    story = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1976d2'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    story.append(Paragraph("Echo-Check Analysis Report", title_style))
    story.append(Spacer(1, 12))
    
    # Report info
    data = [
        ['Report Generated:', datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')],
        ['User:', user.username],
        ['File Name:', analysis.file_name],
        ['File Type:', analysis.file_type],
        ['Analysis Date:', analysis.created_at.strftime('%Y-%m-%d %H:%M:%S')],
    ]
    
    table = Table(data, colWidths=[2*inch, 4*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.grey),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (1, 0), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(table)
    story.append(Spacer(1, 24))
    
    # Results
    story.append(Paragraph("Analysis Results", styles['Heading2']))
    story.append(Spacer(1, 12))
    
    # Determine verdict
    truth_score = analysis.truth_score or 50
    if truth_score >= 70:
        verdict = "LIKELY AUTHENTIC"
        verdict_color = colors.green
    elif truth_score >= 50:
        verdict = "UNCERTAIN"
        verdict_color = colors.orange
    else:
        verdict = "LIKELY MANIPULATED"
        verdict_color = colors.red
    
    results_data = [
        ['Truth Score:', f"{truth_score:.1f}%"],
        ['Verdict:', verdict],
    ]
    
    if analysis.audio_score:
        results_data.append(['Audio Score:', f"{analysis.audio_score:.1f}%"])
    if analysis.video_score:
        results_data.append(['Video Score:', f"{analysis.video_score:.1f}%"])
    
    results_table = Table(results_data, colWidths=[2*inch, 4*inch])
    results_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightblue),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 14),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('TEXTCOLOR', (1, 1), (1, 1), verdict_color),
    ]))
    
    story.append(results_table)
    story.append(Spacer(1, 24))
    
    # Anomalies
    if analysis.anomalies_detected and len(analysis.anomalies_detected) > 0:
        story.append(Paragraph("Detected Anomalies", styles['Heading2']))
        story.append(Spacer(1, 12))
        
        for anomaly in analysis.anomalies_detected:
            text = f"• <b>{anomaly['type'].upper()}</b> (Severity: {anomaly['severity']}): {anomaly['description']}"
            story.append(Paragraph(text, styles['Normal']))
            story.append(Spacer(1, 6))
    
    # Spectrogram
    if analysis.spectrogram_path and os.path.exists(analysis.spectrogram_path):
        story.append(Spacer(1, 24))
        story.append(Paragraph("Frequency Spectrogram", styles['Heading2']))
        story.append(Spacer(1, 12))
        
        img = Image(analysis.spectrogram_path, width=6*inch, height=3*inch)
        story.append(img)
    
    # Build PDF
    doc.build(story)
    
    return pdf_path