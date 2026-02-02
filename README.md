# Echo-Check: Intelligent Deepfake Detection System

A full-stack web application for detecting deepfakes in audio (MP3) and video (MP4) files using advanced AI models.

## 🚀 Features

- **Audio Analysis**: Wav2Vec2 model for detecting audio manipulation
- **Video Analysis**: Vision Transformer for detecting video deepfakes
- **Truth Score**: Combined authenticity score (0-100%)
- **Spectrogram Visualization**: Frequency analysis with anomaly highlighting
- **Analysis History**: Complete log of all analyzed files
- **PDF Reports**: Downloadable detailed analysis reports
- **User Authentication**: Secure JWT-based authentication
- **Docker Support**: Fully containerized application

## 📋 Prerequisites

- **Python**: 3.9 or 3.10
- **Node.js**: 18.x or 20.x LTS
- **Docker** (optional but recommended)
- **PostgreSQL**: 15+ (or use SQLite for development)
- **FFmpeg**: For audio/video processing

## 🛠️ Installation

### Option 1: Docker (Recommended)

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/echo-check.git
cd echo-check
```

2. **Start with Docker Compose**
```bash
docker-compose up --build
```

3. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Option 2: Manual Setup

#### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Create virtual environment**
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Install FFmpeg**

**Ubuntu/Debian:**
```bash
sudo apt-get install ffmpeg libsndfile1
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
- Download from https://ffmpeg.org/download.html
- Add to PATH

5. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your settings
```

6. **Run the backend**
```bash
python main.py
```

Backend will run on http://localhost:8000

#### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
# Create .env file
echo "VITE_API_BASE_URL=http://localhost:8000" > .env
```

4. **Run the frontend**
```bash
npm run dev
```

Frontend will run on http://localhost:5173

## 📁 Project Structure

```
echo-check/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── database.py          # Database configuration
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── auth.py              # Authentication logic
│   ├── ai_models.py         # AI model implementations
│   ├── utils.py             # Utility functions
│   ├── requirements.txt     # Python dependencies
│   ├── .env                 # Environment variables
│   └── Dockerfile           # Docker configuration
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main React component
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Upload.jsx
│   │   │   ├── Results.jsx
│   │   │   └── History.jsx
│   │   └── components/
│   │       └── Navbar.jsx
│   ├── package.json
│   └── Dockerfile
│
└── docker-compose.yml       # Docker Compose configuration
```

## 🔑 Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL=sqlite:///./echocheck.db
# or
DATABASE_URL=postgresql://user:pass@localhost:5432/echocheck

# Security
SECRET_KEY=your-super-secret-key-min-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# File Upload
MAX_FILE_SIZE=104857600
UPLOAD_DIR=./uploads
ALLOWED_EXTENSIONS=mp3,mp4,wav,m4a

# AI Models
MODEL_CACHE_DIR=./models
DEVICE=cuda  # or cpu
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:8000
```

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

#### Authentication
- `POST /register` - Register new user
- `POST /token` - Login and get JWT token
- `GET /users/me` - Get current user info

#### Analysis
- `POST /upload` - Upload and analyze file
- `GET /history` - Get analysis history
- `GET /history/{id}` - Get specific analysis
- `DELETE /history/{id}` - Delete analysis
- `GET /report/{id}` - Download PDF report
- `GET /spectrograms/{id}` - Get spectrogram image

## 🎯 Usage

1. **Register/Login**
   - Create an account or login with existing credentials

2. **Upload File**
   - Navigate to Upload page
   - Drag and drop or browse for MP3/MP4 file (max 100MB)
   - Click "Start Analysis"

3. **View Results**
   - Truth Score (0-100%)
   - Audio/Video breakdown scores
   - Detected anomalies
   - Frequency spectrogram
   - Download PDF report

4. **History**
   - View all past analyses
   - Re-open results
   - Delete old analyses

## 🤖 AI Models

### Wav2Vec2 (Audio Analysis)
- **Model**: facebook/wav2vec2-base-960h
- **Purpose**: Detect audio manipulation and synthetic speech
- **Features**: Spectral analysis, audio quality assessment

### Vision Transformer (Video Analysis)
- **Model**: google/vit-base-patch16-224
- **Purpose**: Detect video frame manipulation
- **Features**: Face consistency, temporal coherence

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚢 Deployment

### Docker Production Build

1. **Update docker-compose.yml for production**
```yaml
environment:
  - DATABASE_URL=postgresql://prod_user:prod_pass@db:5432/echocheck
  - SECRET_KEY=your-production-secret-key
  - DEVICE=cuda  # if GPU available
```

2. **Build and deploy**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Cloud Deployment Options

- **AWS**: EC2 with Docker, or ECS
- **Google Cloud**: Cloud Run
- **Azure**: Container Instances
- **DigitalOcean**: Droplets
- **Heroku**: Container deployment

## 🔒 Security Considerations

1. **Change default SECRET_KEY** in production
2. **Use HTTPS** with SSL certificates
3. **Enable CORS** only for trusted domains
4. **Implement rate limiting** for API endpoints
5. **Regular security updates** for dependencies
6. **Secure file upload** validation
7. **Database backups** regularly

## 🐛 Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Change port in main.py or .env
PORT=8001 python main.py
```

**FFmpeg not found:**
```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg
```

**CUDA not available:**
```bash
# Edit .env
DEVICE=cpu
```

### Frontend Issues

**Port already in use:**
```bash
# Edit vite.config.js to change port
npm run dev -- --port 3000
```

**API connection refused:**
```bash
# Check VITE_API_BASE_URL in .env
# Ensure backend is running
```

## 📊 Performance Optimization

1. **Use GPU** for faster inference (DEVICE=cuda)
2. **Enable Redis** caching for repeated analyses
3. **Implement Celery** for async task processing
4. **Use CDN** for frontend assets
5. **Database indexing** on frequently queried fields

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Hugging Face for Transformers library
- FastAPI framework
- React and Vite
- OpenCV and Librosa communities

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Email: support@echocheck.com
- Documentation: https://docs.echocheck.com

## 🗺️ Roadmap

- [ ] Batch file processing
- [ ] Real-time WebSocket analysis updates
- [ ] Advanced model fine-tuning
- [ ] Mobile app (React Native)
- [ ] API rate limiting and quotas
- [ ] Multi-language support
- [ ] Custom model training interface
- [ ] Integration with cloud storage (S3, GCS)

---

**Made with ❤️ for a safer digital world**