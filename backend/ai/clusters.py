"""
PashuRakshak - Spatial Hotspot Clustering Engine (Python)
Algorithm: Haversine Spherical Distance + DBSCAN Density Clustering
Window: 3-Day Active Surveillance Window (5.0 km radius)
"""

import math
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import HealthReport, Hotspot

def get_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine formula in kilometers"""
    R = 6371.0  # Earth's radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def detect_clusters(reports: list, eps_km: float = 5.0, min_pts: int = 3) -> list:
    if not reports:
        return []

    visited = set()
    clusters = []

    def region_query(point_idx):
        p = reports[point_idx]
        neighbors = []
        for j, q in enumerate(reports):
            if get_distance_km(p.latitude, p.longitude, q.latitude, q.longitude) <= eps_km:
                neighbors.append(j)
        return neighbors

    for i in range(len(reports)):
        if i in visited:
            continue
        visited.add(i)

        neighbors = region_query(i)
        if len(neighbors) < min_pts:
            continue

        cluster_indices = [i]
        queue = [idx for idx in neighbors if idx != i]

        while queue:
            current = queue.pop(0)
            if current not in visited:
                visited.add(current)
                current_neighbors = region_query(current)
                if len(current_neighbors) >= min_pts:
                    for n in current_neighbors:
                        if n not in queue and n not in cluster_indices:
                            queue.append(n)
            if current not in cluster_indices:
                cluster_indices.append(current)

        cluster_reports = [reports[idx] for idx in cluster_indices]
        center_lat = sum(r.latitude for r in cluster_reports) / len(cluster_reports)
        center_lng = sum(r.longitude for r in cluster_reports) / len(cluster_reports)
        high_risk_count = sum(1 for r in cluster_reports if r.risk_level == 'High')

        primary_village = cluster_reports[0].village or cluster_reports[0].district or 'Surveillance Zone'
        cluster_name = f"{primary_village} Outbreak Hotspot"

        clusters.append({
            "name": cluster_name,
            "center_lat": round(center_lat, 5),
            "center_lng": round(center_lng, 5),
            "radius_km": eps_km,
            "total_reports": len(cluster_reports),
            "high_risk_reports": high_risk_count,
            "report_ids": [r.id for r in cluster_reports],
            "status": "active" if high_risk_count >= 3 else "monitoring"
        })

    return clusters

def update_hotspots(db: Session, days: int = 3):
    """Recalculate clusters using reports from the last 3 days"""
    try:
        cutoff = datetime.utcnow() - timedelta(days=days)
        recent_reports = db.query(HealthReport).filter(HealthReport.created_at >= cutoff).all()

        clusters = detect_clusters(recent_reports, eps_km=5.0, min_pts=3)

        for cl in clusters:
            existing = db.query(Hotspot).filter(
                Hotspot.center_lat >= cl["center_lat"] - 0.05,
                Hotspot.center_lat <= cl["center_lat"] + 0.05,
                Hotspot.center_lng >= cl["center_lng"] - 0.05,
                Hotspot.center_lng <= cl["center_lng"] + 0.05
            ).first()

            if existing:
                existing.total_reports = cl["total_reports"]
                existing.high_risk_reports = cl["high_risk_reports"]
                existing.status = cl["status"]
                existing.updated_at = datetime.utcnow()
            else:
                new_spot = Hotspot(
                    name=cl["name"],
                    center_lat=cl["center_lat"],
                    center_lng=cl["center_lng"],
                    radius_km=cl["radius_km"],
                    total_reports=cl["total_reports"],
                    high_risk_reports=cl["high_risk_reports"],
                    status=cl["status"],
                    detected_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(new_spot)

        db.commit()
        return clusters
    except Exception as e:
        print(f"[Spatial Hotspot Error]: {e}")
        return []

def get_nearby_report_count(db: Session, lat: float, lng: float, radius_km: float = 5.0, days: int = 3):
    try:
        cutoff = datetime.utcnow() - timedelta(days=days)
        reports = db.query(HealthReport).filter(HealthReport.created_at >= cutoff).all()
        count = 0
        high_risk_count = 0
        for r in reports:
            if get_distance_km(lat, lng, r.latitude, r.longitude) <= radius_km:
                count += 1
                if r.risk_level == 'High':
                    high_risk_count += 1
        return count, high_risk_count
    except Exception:
        return 0, 0
