"""
PashuRakshak - Database Configuration
Primary: PostgreSQL (Production / PPT Architecture)
Fallback: SQLite (Zero-config local development)
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Fetch DATABASE_URL from environment (e.g. postgresql://user:pass@localhost:5432/pashurakshak)
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Local fallback to SQLite so it runs out-of-the-box
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pashurakshak.db")
    DATABASE_URL = f"sqlite:///{db_path}"

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
