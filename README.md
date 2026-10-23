# PashuRakshak – From Farmer Reports to Early-Warning Action
### Livestock Disease Early-Detection & Surveillance Platform

> *"Multiple weak signals → one actionable risk signal"*

- **🌐 Live Production Deployment**: [https://client-wine-theta.vercel.app](https://client-wine-theta.vercel.app)
- **📦 GitHub Repository**: [https://github.com/adarshsingh022006-tech/pashurakshak](https://github.com/adarshsingh022006-tech/pashurakshak)

**PashuRakshak** is an AI-powered livestock health reporting and disease early-warning platform designed to bridge the critical time lag between grassroots village symptom observations and veterinary mobilization. Built for rural mobile-first accessibility across India, it combines vernacular speech-to-text reporting, offline-first data queues, a Scikit-Learn Random Forest risk classifier, and spatial-temporal outbreak clustering (Haversine DBSCAN).

---

## 🛠️ Official Tech Stack (Hackathon Presentation Aligned)

| Component | Technology | Implementation Details |
| :--- | :--- | :--- |
| **Frontend** | **React.js + Tailwind CSS** | React 18, Vite 5, Tailwind CSS 3.4, Lucide Icons, Mobile-first responsive UI |
| **Backend** | **Python + FastAPI** | Modern asynchronous Python 3.10+ FastAPI server (`backend/main.py`), Pydantic v2 schemas |
| **Database** | **PostgreSQL** | PostgreSQL with SQLAlchemy ORM (with zero-config SQLite local fallback) |
| **AI / ML** | **Random Forest Classifier → Risk** | Scikit-Learn `RandomForestClassifier` (100 Estimators, 19 Clinical Features) |
| **Maps & GIS** | **Leaflet + OpenStreetMap** | Leaflet 1.9, React-Leaflet, Haversine + DBSCAN (5 km radius, 3-day active surveillance) |
| **Environmental Data** | **OpenWeatherMap** | Live micro-climate temperature & humidity risk integration with Punjab fallback |
| **Voice Processing** | **Speech-to-Text API** | Multilingual browser Web Speech API + backend symptom NLP parser (Hindi, Punjabi, English) |

---

## 🌟 The PashuRakshak Intelligence Loop

1. **CAPTURE (Grassroots Ingestion)**:
   - Voice dictation in English, Hindi (हिन्दी), and Punjabi (ਪੰਜਾਬੀ) powered by the browser Speech-to-Text API with backend NLP keyword extraction.
   - 10 multi-select clinical symptom chips (fever, coughing, difficulty walking, salivation, loss of appetite, diarrhea, skin lesions, nasal discharge, lameness, swelling).
   - Herd registry, ante-mortem herd mortality reporting, and GPS geolocation auto-capture.
   - Offline-first resilience via Service Worker and IndexedDB queue with automatic background sync when connectivity returns.

2. **ASSESS (AI-Assisted Risk Engine)**:
   - Python Scikit-Learn Random Forest risk classifier (`RandomForestClassifier`, 100 estimators, max depth 8) trained across 19 clinical epidemiological features.
   - Outputs risk category (**High**, **Medium**, **Low**), confidence metrics, and transparent, human-readable clinical rationale.
   - Clinically-calibrated veterinary rule fallback mechanism ensuring zero inference failures.
   - Human-in-the-loop governance: **"AI-assisted, vet-verified"**.

3. **CONNECT (Spatial-Temporal Epidemiological Fusion)**:
   - Haversine DBSCAN clustering algorithm grouping reports within a **5 km detection radius over a 3-day active surveillance window**.
   - Live integration with OpenWeatherMap API for environmental context (temperature, humidity, wind) as vulnerability baselines.
   - Outbreak hotspot detection highlighting active transmission clusters (e.g. Ludhiana East Cluster: 28 reports, 7 high-risk).

4. **ACT (Early-Warning Veterinary Response)**:
   - Instant routing of submitted reports to the **Doctor Triage Queue** (`/vet/cases`).
   - Complete Case Lifecycle stepper: **New → Under Review → Visit Scheduled → In Treatment → Resolved**, with an emergency **Escalate Case** button.
   - Mobile clinical unit visit scheduling, prescription management, and state-level biosecurity advisories.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python** (v3.10+ / v3.12+ / v3.14+)
- **Node.js** (v18+ or v20+)
- **npm** (v9+)

### 2. Run Python + FastAPI Backend
```bash
# In the project directory:
cd backend
pip install -r requirements.txt
python run.py
```
*The FastAPI backend will automatically initialize the database, seed demo cluster cases, train the Scikit-Learn Random Forest model, and start running on `http://localhost:5000`.*  
*Interactive Swagger API documentation is available at `http://localhost:5000/docs`.*

### 3. Run React Frontend (New Terminal)
```bash
cd client
npm install
npm run dev
```
*The frontend will launch on `http://localhost:5173`, automatically connected through Vite proxy to the FastAPI backend.*

*(Optional: Dual Node.js Express backend is also preserved in `server/` for full backwards compatibility).*

---

## 🔐 Demo Credentials

All test accounts use the password: `Demo@123`

| Role | Email | Password | Primary Workflow |
| :--- | :--- | :--- | :--- |
| **Farmer** | `farmer@demo.com` | `Demo@123` | Voice symptom reporting, herd health records, mortality alerts, offline sync |
| **Veterinarian** | `vet@demo.com` | `Demo@123` | Priority triage queue, AI verification, visit scheduling, treatment logs |
| **Government Authority** | `govt@demo.com` | `Demo@123` | State surveillance map, Recharts epidemiological curves, district matrix, BAHS 2025 mortality chart |

> **Pro-Tip**: You can use the **1-Click Demo Evaluation Buttons** on the Login screen or the **DEMO ROLE SWITCH** buttons in the sidebar footer to switch roles instantly without logging out!

---

## 📊 Pre-Seeded Hackathon Scenarios

### 1. Case #0036 (Exact PPT Specimen)
- **Animal**: Cow, 2.5 years old (Tag `0036`, Sahiwal Indigenous)
- **Symptoms**: Fever, Difficulty Walking, Excessive Salivation
- **Vaccination**: Vaccinated
- **AI Classification**: **High Risk** (94% confidence)
- **Reason**: *"Acute pyrexia combined with oral salivation and locomotor distress indicates vesicular disease / FMD episode within an active surveillance cluster."*
- **Status**: **Visit Scheduled** (Dr. Amritpal Singh assigned)

### 2. Ludhiana Outbreak Hotspot (Exact PPT Map Popup)
- **Coordinates**: 30.9010° N, 75.8572° E (Samrala / Ludhiana East)
- **Total Reports in Area**: 28
- **High-Risk Reports**: 7
- **Detection Radius**: 5 km (3-Day Active Surveillance Window)
- **Map Visual**: Dashed red pulsing circle with detailed epidemiological popup.

### 3. Official Disease Mortality Statistics (BAHS 2025)
- **Source**: *Government of India, Department of Animal Husbandry & Dairying, Basic Animal Husbandry Statistics 2025*
- **Timeframe**: January – June 2024
- **Highlight Callout**: **51,848 Reported deaths from Ranikhet disease + IBD**
- **Data Points**:
  - Ranikhet Disease: 27,420
  - Infectious Bursal Disease (IBD): 24,428
  - African Swine Fever: 2,840
  - Peste des Petits Ruminants (PPR): 3,510
  - Fowl Pox: 1,230

---

## 📡 Key REST API Endpoints (FastAPI)

- `POST /api/auth/login` — JWT authentication
- `POST /api/auth/register` — Role-based registration
- `GET /api/reports` — Filtered community health reports (supports `days=3`)
- `POST /api/reports` — Submit report (triggers Scikit-Learn Random Forest risk classifier)
- `GET /api/reports/{id}` — Full case details (with treatments, visits, weather)
- `PATCH /api/reports/{id}/status` — Status transition (New → Under Review → Visit Scheduled → In Treatment → Resolved)
- `PATCH /api/reports/{id}/verify` — Licensed veterinarian verification
- `GET /api/hotspots` — Active outbreak clusters (Haversine DBSCAN 5 km radius, 3-day window)
- `POST /api/voice/parse` — Multilingual voice keyword extraction (Hindi, Punjabi, English)
- `GET /api/weather` — Real-time environmental temperature/humidity snapshot
- `GET /api/animals` — Registered livestock roster
- `GET /api/health` — Platform status & tech stack telemetry
