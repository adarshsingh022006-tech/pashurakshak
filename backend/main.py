"""
PashuRakshak - Python + FastAPI Backend Server
Architecture:
- Backend: Python 3.10+ & FastAPI
- AI / ML: Scikit-Learn RandomForestClassifier (100 Estimators)
- Database: PostgreSQL (with zero-config SQLite local fallback)
- Spatial Engine: Haversine Spherical Distance + DBSCAN (3-Day / 5km Hotspots)
- Environmental Data: OpenWeatherMap API
- Speech Processing: Vernacular Speech-to-Text Keyword Parser
"""

import json
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt, JWTError

from database import engine, Base, get_db
from models import User, Animal, HealthReport, Hotspot, Notification, MortalityReport
from schemas import ReportCreate, UserRegister, UserLogin, VoiceParseRequest, CaseStatusUpdate
from ai.risk_model import train_model, predict_risk
from ai.clusters import update_hotspots, get_nearby_report_count
from services.weather import get_weather
from services.voice import parse_voice_transcript
from seed import seed_db

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PashuRakshak API",
    description="Livestock Health Surveillance & Early-Warning Platform (FastAPI + Scikit-Learn)",
    version="2.0.0"
)

# CORS setup for Vite frontend (localhost:5173 / production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "pashurakshak_secret_key_fastapi_2026"
ALGORITHM = "HS256"

# Startup event
@app.on_event("startup")
def on_startup():
    print("=" * 60)
    print("🌿 PashuRakshak FastAPI Server Initializing...")
    print("=" * 60)
    seed_db()
    train_model(sample_count=1500)
    print("🚀 FastAPI Backend Ready on http://localhost:5000 (Proxy aligned with Vite)")

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "platform": "PashuRakshak Early-Warning Surveillance",
        "tech_stack": {
            "backend": "Python + FastAPI",
            "ai_ml": "Scikit-Learn RandomForestClassifier",
            "database": "PostgreSQL (SQLAlchemy ORM)",
            "maps": "Leaflet + OpenStreetMap (5km DBSCAN Hotspots)",
            "weather": "OpenWeatherMap API",
            "voice": "Speech-to-Text API"
        },
        "timestamp": datetime.utcnow().isoformat()
    }

# ----------------- AUTHENTICATION -----------------

def create_access_token(data: dict):
    to_encode = data.copy()
    to_encode.update({"exp": datetime.utcnow() + timedelta(days=7)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@app.post("/api/auth/register")
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already registered")

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=pwd_context.hash(user_data.password),
        role=user_data.role,
        phone=user_data.phone,
        village=user_data.village,
        district=user_data.district
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"id": new_user.id, "email": new_user.email, "role": new_user.role})
    return {"user": {"id": new_user.id, "name": new_user.name, "email": new_user.email, "role": new_user.role}, "token": token}

@app.post("/api/auth/login")
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not pwd_context.verify(login_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"id": user.id, "email": user.email, "role": user.role})
    return {"user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}, "token": token}

# ----------------- HEALTH REPORTS -----------------

@app.post("/api/reports", status_code=status.HTTP_201_CREATED)
def create_report(payload: ReportCreate, db: Session = Depends(get_db)):
    # 1. Fetch environmental weather context
    weather = get_weather(payload.latitude, payload.longitude)

    # 2. Query spatial density (nearby cases in last 3 days within 5km)
    nearby_cases, _ = get_nearby_report_count(db, payload.latitude, payload.longitude, radius_km=5.0, days=3)

    # 3. Query recent herd mortality
    herd_mortality = 0
    mort = db.query(MortalityReport).filter(MortalityReport.village == payload.village).first()
    if mort:
        herd_mortality = mort.count

    # 4. Predict Risk with Python Scikit-Learn Random Forest
    ai_eval = predict_risk({
        "species": payload.species,
        "symptoms": payload.symptoms,
        "age": payload.age,
        "vaccination_status": payload.vaccination_status,
        "duration_days": payload.duration_days,
        "herd_mortality_count": herd_mortality,
        "nearby_cases_count": nearby_cases,
        "weather_temp": weather.get("temp", 32),
        "weather_humidity": weather.get("humidity", 60)
    })

    # 5. Generate sequential Case ID
    total_count = db.query(HealthReport).count()
    report_num = f"Case #{str(total_count + 1).zfill(4)}"

    new_report = HealthReport(
        report_number=report_num,
        user_id=1,  # Default demo session user
        animal_id=payload.animal_id,
        species=payload.species.lower(),
        age=payload.age,
        symptoms=json.dumps(payload.symptoms),
        duration_days=payload.duration_days,
        vaccination_status=payload.vaccination_status,
        free_text_notes=payload.free_text_notes,
        photo_url=payload.photo_url,
        latitude=payload.latitude,
        longitude=payload.longitude,
        village=payload.village,
        district=payload.district,
        risk_level=ai_eval["riskLevel"],
        ai_confidence=ai_eval["confidence"],
        ai_reason=ai_eval["reason"],
        contributing_factors=json.dumps(ai_eval["contributingFactors"]),
        is_verified=False,
        status="Under Review" if ai_eval["riskLevel"] == "High" else "New",
        weather_temp=weather.get("temp"),
        weather_humidity=weather.get("humidity"),
        weather_description=weather.get("description"),
        weather_wind_speed=weather.get("wind_speed", 10.0),
        created_at=datetime.utcnow()
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    # 6. Recalculate 3-day hotspots asynchronously
    update_hotspots(db, days=3)

    return {
        "report": {
            "id": new_report.id,
            "report_number": new_report.report_number,
            "species": new_report.species,
            "symptoms": json.loads(new_report.symptoms),
            "risk_level": new_report.risk_level,
            "ai_confidence": new_report.ai_confidence,
            "ai_reason": new_report.ai_reason,
            "status": new_report.status,
            "created_at": new_report.created_at.isoformat()
        },
        "aiAssessment": ai_eval,
        "message": "Health report registered and triaged into Doctor Queue via Python Scikit-Learn Model"
    }

@app.get("/api/reports")
def list_reports(
    species: Optional[str] = None,
    risk_level: Optional[str] = None,
    status: Optional[str] = None,
    days: Optional[int] = 3,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(HealthReport)

    # 3-Day active surveillance filter
    if days:
        cutoff = datetime.utcnow() - timedelta(days=days)
        query = query.filter(HealthReport.created_at >= cutoff)

    if species and species != "all":
        query = query.filter(HealthReport.species == species.lower())
    if risk_level and risk_level != "all":
        query = query.filter(HealthReport.risk_level == risk_level)
    if status and status != "all":
        query = query.filter(HealthReport.status == status)

    reports = query.order_by(HealthReport.created_at.desc()).limit(limit).all()

    result = []
    for r in reports:
        try:
            sym = json.loads(r.symptoms) if isinstance(r.symptoms, str) else (r.symptoms or [])
        except Exception:
            sym = []
        result.append({
            "id": r.id,
            "report_number": r.report_number,
            "species": r.species,
            "age": r.age,
            "symptoms": sym,
            "risk_level": r.risk_level,
            "ai_confidence": r.ai_confidence,
            "ai_reason": r.ai_reason,
            "status": r.status,
            "is_verified": r.is_verified,
            "village": r.village,
            "district": r.district,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "created_at": r.created_at.isoformat() if r.created_at else datetime.utcnow().isoformat(),
            "owner_name": "Gurdeep Singh",
            "owner_phone": "+91 98765 43210"
        })

    return {"reports": result}

@app.get("/api/reports/{report_id}")
def get_report_detail(report_id: int, db: Session = Depends(get_db)):
    r = db.query(HealthReport).filter(HealthReport.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Case not found")

    try:
        sym = json.loads(r.symptoms) if isinstance(r.symptoms, str) else (r.symptoms or [])
        factors = json.loads(r.contributing_factors) if r.contributing_factors else []
    except Exception:
        sym = []
        factors = []

    return {
        "report": {
            "id": r.id,
            "report_number": r.report_number,
            "species": r.species,
            "age": r.age,
            "symptoms": sym,
            "duration_days": r.duration_days,
            "vaccination_status": r.vaccination_status,
            "free_text_notes": r.free_text_notes,
            "photo_url": r.photo_url,
            "risk_level": r.risk_level,
            "ai_confidence": r.ai_confidence,
            "ai_reason": r.ai_reason,
            "contributing_factors": factors,
            "status": r.status,
            "is_verified": r.is_verified,
            "village": r.village,
            "district": r.district,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "weather_temp": r.weather_temp,
            "weather_humidity": r.weather_humidity,
            "created_at": r.created_at.isoformat() if r.created_at else datetime.utcnow().isoformat()
        },
        "treatments": [],
        "visits": []
    }

@app.patch("/api/reports/{report_id}/status")
def update_case_status(report_id: int, payload: CaseStatusUpdate, db: Session = Depends(get_db)):
    r = db.query(HealthReport).filter(HealthReport.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Case not found")
    r.status = payload.status
    db.commit()
    return {"message": "Status updated", "status": r.status}

@app.patch("/api/reports/{report_id}/verify")
def verify_case(report_id: int, db: Session = Depends(get_db)):
    r = db.query(HealthReport).filter(HealthReport.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Case not found")
    r.is_verified = True
    r.status = "Visit Scheduled"
    db.commit()
    return {"message": "Case verified by licensed veterinarian", "report": r}

# ----------------- HOTSPOTS & GIS -----------------

@app.get("/api/hotspots")
def get_hotspots(db: Session = Depends(get_db)):
    spots = db.query(Hotspot).filter(Hotspot.status != "resolved").all()
    result = []
    for s in spots:
        try:
            dom = json.loads(s.dominant_symptoms) if s.dominant_symptoms else ["salivation", "fever"]
        except Exception:
            dom = ["salivation", "fever"]
        result.append({
            "id": s.id,
            "name": s.name,
            "center_lat": s.center_lat,
            "center_lng": s.center_lng,
            "radius_km": s.radius_km,
            "total_reports": s.total_reports,
            "high_risk_reports": s.high_risk_reports,
            "dominant_symptoms": dom,
            "status": s.status
        })
    return {"hotspots": result}

# ----------------- VOICE & NLP -----------------

@app.post("/api/voice/parse")
def parse_voice(payload: VoiceParseRequest):
    detected = parse_voice_transcript(payload.transcript)
    return {
        "detectedSymptoms": detected,
        "transcript": payload.transcript,
        "language": payload.language,
        "matchedCount": len(detected)
    }

# ----------------- WEATHER -----------------

@app.get("/api/weather")
def fetch_weather(lat: float = 30.9010, lng: float = 75.8572):
    return get_weather(lat, lng)

# ----------------- ANIMALS -----------------

@app.get("/api/animals")
def get_animals(db: Session = Depends(get_db)):
    animals = db.query(Animal).all()
    return {"animals": [
        {
            "id": a.id,
            "name_or_tag": a.name_or_tag,
            "species": a.species,
            "age": a.age,
            "vaccination_status": a.vaccination_status
        }
        for a in animals
    ]}

# ----------------- NOTIFICATIONS -----------------

@app.get("/api/notifications")
def get_notifications(db: Session = Depends(get_db)):
    nots = db.query(Notification).order_by(Notification.created_at.desc()).limit(20).all()
    return {"notifications": nots}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
