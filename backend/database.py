"""
Database configuration and session management
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL - change this based on your database
# For PostgreSQL:
# DATABASE_URL = "postgresql://user:password@localhost:5432/echocheck"
# For MySQL:
# DATABASE_URL = "mysql+pymysql://user:password@localhost:3306/echocheck"
# For SQLite (development):
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./echocheck.db")

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


# Dependency for database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()