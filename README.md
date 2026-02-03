Echo-Check
AI-Powered Synthetic Media Detection Platform
1. Vision Document
1.1 Project Name & Overview

Project Name: Echo-Check

Overview:
Echo-Check is a full-stack web application designed to detect synthetic manipulation in audio and video files. Users can upload MP3 or MP4 files, which are analyzed using pre-trained deep learning models—Wav2Vec2 for audio analysis and Vision Transformers for video frame analysis. The system generates a Truth Score representing the likelihood of authenticity and visualizes frequency anomalies using spectrograms. The platform is containerized using Docker and maintains a complete history log of analyzed files.

1.2 Problem It Solves

With the rapid rise of AI-generated deepfake audio and video, it has become increasingly difficult to verify the authenticity of digital media. Fake voices, manipulated videos, and synthetic content can lead to misinformation, fraud, and loss of trust. Echo-Check addresses this problem by providing an accessible, AI-driven solution to analyze and verify media authenticity.

1.3 Target Users (Personas)

Persona 1: Journalist

Needs to verify audio/video sources before publishing

Concerned about misinformation

Persona 2: Cybersecurity Analyst

Investigates suspicious media files

Requires quick authenticity checks

Persona 3: General User

Wants to verify viral audio/video clips

No technical background

1.4 Vision Statement

To create a reliable, user-friendly platform that helps individuals and organizations identify synthetic and manipulated media using AI-based detection techniques.

1.5 Key Features / Goals

Upload MP3 and MP4 files

Audio analysis using Wav2Vec2

Video frame analysis using Vision Transformer

Truth Score generation (percentage)

Spectrogram visualization highlighting frequency anomalies

Analysis history log

Dockerized deployment

1.6 Success Metrics

Accurate Truth Score generation

Successful analysis of uploaded files

Low response time for processing

User satisfaction with UI clarity

1.7 Assumptions & Constraints

Assumptions

Users upload valid MP3/MP4 files

Pre-trained models provide reliable inference

Constraints

No model training from scratch

Limited compute resources

File size restrictions
