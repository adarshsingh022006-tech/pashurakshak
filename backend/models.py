"""
PashuRakshak - Relational Database Models (SQLAlchemy ORM)
Compatible with PostgreSQL & SQLite
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="farmer")  # 'farmer', 'vet', 'authority'
    phone = Column(String(50), nullable=True)
    village = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    state = Column(String(100), default="Punjab")
    created_at = Column(DateTime, default=datetime.utcnow)

    animals = relationship("Animal", back_populates="owner")
    reports = relationship("HealthReport", back_populates="user")

class Animal(Base):
    __tablename__ = "animals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    name_or_tag = Column(String(100), nullable=False)
    species = Column(String(50), nullable=False)  # cow, buffalo, goat, sheep, pig, poultry
    age = Column(Float, default=2.0)
    sex = Column(String(20), default="female")
    breed = Column(String(100), nullable=True)
    vaccination_status = Column(String(50), default="Vaccinated")
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="animals")
    reports = relationship("HealthReport", back_populates="animal")

class HealthReport(Base):
    __tablename__ = "health_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_number = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    animal_id = Column(Integer, ForeignKey("animals.id", ondelete="SET NULL"), nullable=True)
    species = Column(String(50), nullable=False)
    age = Column(Float, default=2.0)
    symptoms = Column(Text, nullable=False)  # JSON list string
    duration_days = Column(Integer, default=1)
    vaccination_status = Column(String(50), default="Vaccinated")
    free_text_notes = Column(Text, nullable=True)
    photo_url = Column(Text, nullable=True)

    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    village = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)

    # AI Risk Assessment
    risk_level = Column(String(20), default="Low", index=True)  # High, Medium, Low
    ai_confidence = Column(Float, default=0.85)
    ai_reason = Column(Text, nullable=True)
    contributing_factors = Column(Text, nullable=True)  # JSON list

    # Veterinary Human-in-the-Loop & Status
    is_verified = Column(Boolean, default=False)
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="New", index=True)  # New, Under Review, Visit Scheduled, In Treatment, Resolved
    is_escalated = Column(Boolean, default=False)

    # Environmental snapshot
    weather_temp = Column(Float, nullable=True)
    weather_humidity = Column(Float, nullable=True)
    weather_description = Column(String(100), nullable=True)
    weather_wind_speed = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id], back_populates="reports")
    animal = relationship("Animal", back_populates="reports")
    treatments = relationship("Treatment", back_populates="report")
    visits = relationship("Visit", back_populates="report")

class MortalityReport(Base):
    __tablename__ = "mortality_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    species = Column(String(50), nullable=False)
    count = Column(Integer, default=1)
    suspected_cause = Column(String(255), nullable=True)
    symptoms = Column(Text, nullable=True)
    date_of_death = Column(DateTime, default=datetime.utcnow)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    village = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Hotspot(Base):
    __tablename__ = "hotspots"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    center_lat = Column(Float, nullable=False)
    center_lng = Column(Float, nullable=False)
    radius_km = Column(Float, default=5.0)
    total_reports = Column(Integer, default=0)
    high_risk_reports = Column(Integer, default=0)
    dominant_symptoms = Column(Text, nullable=True)  # JSON list
    status = Column(String(50), default="active")    # active, monitoring, resolved
    detected_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class Treatment(Base):
    __tablename__ = "treatments"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("health_reports.id", ondelete="CASCADE"))
    vet_id = Column(Integer, ForeignKey("users.id"))
    diagnosis = Column(String(255), nullable=False)
    prescribed_medicines = Column(Text, nullable=True)
    dosage_instructions = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    follow_up_date = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    report = relationship("HealthReport", back_populates="treatments")

class Visit(Base):
    __tablename__ = "visits"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("health_reports.id", ondelete="CASCADE"))
    vet_id = Column(Integer, ForeignKey("users.id"))
    scheduled_date = Column(String(50), nullable=False)
    scheduled_time = Column(String(50), nullable=True)
    status = Column(String(50), default="scheduled")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    report = relationship("HealthReport", back_populates="visits")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    role_target = Column(String(50), nullable=True)
    report_id = Column(Integer, ForeignKey("health_reports.id", ondelete="CASCADE"), nullable=True)
    hotspot_id = Column(Integer, ForeignKey("hotspots.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="high_risk_alert")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class WeatherSnapshot(Base):
    __tablename__ = "weather_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    temp = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    wind_speed = Column(Float, default=0.0)
    clouds = Column(Integer, default=0)
    description = Column(String(100), nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow)
