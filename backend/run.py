"""
PashuRakshak - FastAPI Server Launcher
Runs on port 5000 (Aligned with Vite proxy)
"""

import uvicorn

if __name__ == "__main__":
    print("=" * 65)
    print("🚀 Launching PashuRakshak Python + FastAPI Backend...")
    print("📊 AI Model: Scikit-Learn RandomForestClassifier (100 Estimators)")
    print("📍 Spatial DBSCAN: 3-Day Window (5 km Hotspots)")
    print("💾 Database: PostgreSQL (with SQLite zero-config local fallback)")
    print("🌐 Port: http://localhost:5000")
    print("📖 Interactive Swagger API Docs: http://localhost:5000/docs")
    print("=" * 65)
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
