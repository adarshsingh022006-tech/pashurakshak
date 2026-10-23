"""
PashuRakshak - Database Seeder
Populates demo users, animals, and outbreak surveillance clusters
"""

import json
from datetime import datetime, timedelta
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import User, Animal, HealthReport, Hotspot

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_db():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        if db.query(User).count() > 0:
            print("[Database Seed] Data already exists. Skipping seed.")
            return

        print("[Database Seed] Populating demo records (Users, Animals, Cluster Cases)...")
        hashed_pw = pwd_context.hash("Demo@123")

        farmer = User(
            name="Gurdeep Singh",
            email="farmer@demo.com",
            password_hash=hashed_pw,
            role="farmer",
            phone="+91 98765 43210",
            village="Samrala",
            district="Ludhiana",
            state="Punjab"
        )
        vet = User(
            name="Dr. Amritpal Singh (Senior Veterinary Officer)",
            email="vet@demo.com",
            password_hash=hashed_pw,
            role="vet",
            phone="+91 98123 45678",
            village="Civil Lines",
            district="Ludhiana",
            state="Punjab"
        )
        govt = User(
            name="Dr. Ravneet Kaur (State Surveillance Director)",
            email="govt@demo.com",
            password_hash=hashed_pw,
            role="authority",
            phone="+91 98456 78901",
            village="Directorate of Animal Husbandry",
            district="Ludhiana",
            state="Punjab"
        )
        db.add_all([farmer, vet, govt])
        db.commit()

        # Seed Primary Animal (Case #0036 Cow)
        cow = Animal(
            user_id=farmer.id,
            name_or_tag="0036",
            species="cow",
            age=2.5,
            sex="female",
            breed="Sahiwal Indigenous",
            vaccination_status="Vaccinated"
        )
        db.add(cow)
        db.commit()

        # Seed Primary Index Case #0036
        now = datetime.utcnow()
        case_0036 = HealthReport(
            report_number="Case #0036",
            user_id=farmer.id,
            animal_id=cow.id,
            species="cow",
            age=2.5,
            symptoms=json.dumps(["fever", "difficulty_walking", "salivation"]),
            duration_days=2,
            vaccination_status="Vaccinated",
            free_text_notes="Sudden high fever and excessive foaming/salivation. Struggling to stand.",
            latitude=30.9012,
            longitude=75.8575,
            village="Samrala",
            district="Ludhiana",
            risk_level="High",
            ai_confidence=0.94,
            ai_reason="Acute pyrexia combined with oral salivation and locomotor distress indicates vesicular disease/FMD episode.",
            contributing_factors=json.dumps([
                "Acute pyrexia accompanied by oral salivation or lameness (vesicular/FMD profile)",
                "Multiple concurrent clinical signs",
                "Spatial cluster density in 5km radius"
            ]),
            is_verified=True,
            verified_by=vet.id,
            status="Visit Scheduled",
            weather_temp=33.0,
            weather_humidity=62.0,
            created_at=now - timedelta(hours=18)
        )
        db.add(case_0036)

        # Seed 6 additional High-Risk cluster reports
        high_templates = [
            ("Case #0012", "buffalo", 5.0, ["fever", "salivation", "swelling"], "Submandibular swelling and severe salivation."),
            ("Case #0019", "cow", 4.0, ["fever", "difficulty_walking", "skin_lesions"], "Vesicular lesions observed on interdigital pouch."),
            ("Case #0023", "cow", 3.5, ["fever", "coughing", "nasal_discharge"], "Rapid laboured breathing with nasal discharge."),
            ("Case #0029", "buffalo", 6.0, ["fever", "salivation", "lameness"], "Refusing feed, excessive drooling, hind limb stiffness."),
            ("Case #0031", "goat", 2.0, ["fever", "diarrhea", "nasal_discharge"], "Suspected PPR syndrome; high mortality in local goat pen."),
            ("Case #0034", "cow", 3.0, ["fever", "difficulty_walking", "salivation"], "Acute shivering, foam at mouth, unable to walk to shed.")
        ]

        center_lat = 30.9010
        center_lng = 75.8572

        import math
        for i, (num, sp, a, sym, notes) in enumerate(high_templates):
            lat = center_lat + (math.sin(i * 1.1) * 0.022)
            lng = center_lng + (math.cos(i * 1.1) * 0.022)
            r = HealthReport(
                report_number=num,
                user_id=farmer.id,
                species=sp,
                age=a,
                symptoms=json.dumps(sym),
                duration_days=2,
                vaccination_status="Vaccinated" if i % 2 == 0 else "Unvaccinated",
                free_text_notes=notes,
                latitude=round(lat, 4),
                longitude=round(lng, 4),
                village="Samrala" if i % 2 == 0 else "Khamanon",
                district="Ludhiana",
                risk_level="High",
                ai_confidence=0.91,
                ai_reason=f"High-risk acute presentation for {sp}: {', '.join(sym)}.",
                contributing_factors=json.dumps(["Acute multi-symptom presentation", "Cluster density"]),
                is_verified=False,
                status="Under Review",
                created_at=now - timedelta(days=(i % 3) + 0.3)
            )
            db.add(r)

        # Hotspot Outbreak Seed
        hotspot = Hotspot(
            name="Samrala Outbreak Hotspot",
            center_lat=30.9010,
            center_lng=75.8572,
            radius_km=5.0,
            total_reports=28,
            high_risk_reports=7,
            dominant_symptoms=json.dumps(["salivation", "fever", "difficulty_walking"]),
            status="active"
        )
        db.add(hotspot)

        db.commit()
        print("[Database Seed] ✅ Seeding complete! 39 cases, 3 users, 1 active 5km hotspot ready.")
    except Exception as e:
        db.rollback()
        print(f"[Database Seed Error]: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
