/**
 * Spatial-temporal clustering engine using Haversine distance and DBSCAN
 */

// Haversine formula in kilometers
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * DBSCAN-style clustering algorithm
 * @param {Array} reports - List of health reports with latitude and longitude
 * @param {number} epsKm - Radius in kilometers (default 5.0 km)
 * @param {number} minPts - Minimum reports to form a cluster (default 3)
 */
function detectClusters(reports, epsKm = 5.0, minPts = 3) {
  if (!reports || reports.length === 0) return [];

  const visited = new Set();
  const clusters = [];

  function regionQuery(pointIndex) {
    const p = reports[pointIndex];
    const neighbors = [];
    for (let i = 0; i < reports.length; i++) {
      const q = reports[i];
      if (getDistanceKm(p.latitude, p.longitude, q.latitude, q.longitude) <= epsKm) {
        neighbors.push(i);
      }
    }
    return neighbors;
  }

  for (let i = 0; i < reports.length; i++) {
    if (visited.has(i)) continue;
    visited.add(i);

    const neighbors = regionQuery(i);
    if (neighbors.length < minPts) {
      // Noise or unclustered report
      continue;
    }

    // New cluster
    const clusterIndices = [i];
    const queue = [...neighbors.filter(idx => idx !== i)];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!visited.has(current)) {
        visited.add(current);
        const currentNeighbors = regionQuery(current);
        if (currentNeighbors.length >= minPts) {
          for (const n of currentNeighbors) {
            if (!queue.includes(n) && !clusterIndices.includes(n)) {
              queue.push(n);
            }
          }
        }
      }
      if (!clusterIndices.includes(current)) {
        clusterIndices.push(current);
      }
    }

    // Compile cluster metrics
    const clusterReports = clusterIndices.map(idx => reports[idx]);
    const centerLat = clusterReports.reduce((sum, r) => sum + r.latitude, 0) / clusterReports.length;
    const centerLng = clusterReports.reduce((sum, r) => sum + r.longitude, 0) / clusterReports.length;
    const highRiskCount = clusterReports.filter(r => r.risk_level === 'High').length;

    // Dominant symptoms
    const symptomCounts = {};
    clusterReports.forEach(r => {
      let symptoms = [];
      try {
        symptoms = typeof r.symptoms === 'string' ? JSON.parse(r.symptoms) : (r.symptoms || []);
      } catch (e) {
        symptoms = [];
      }
      symptoms.forEach(sym => {
        symptomCounts[sym] = (symptomCounts[sym] || 0) + 1;
      });
    });

    const dominantSymptoms = Object.entries(symptomCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([sym]) => sym);

    const primaryVillage = clusterReports[0]?.village || clusterReports[0]?.district || 'Surveillance Zone';
    const clusterName = `${primaryVillage} Outbreak Hotspot`;

    clusters.push({
      name: clusterName,
      center_lat: Number(centerLat.toFixed(5)),
      center_lng: Number(centerLng.toFixed(5)),
      radius_km: epsKm,
      total_reports: clusterReports.length,
      high_risk_reports: highRiskCount,
      dominant_symptoms: dominantSymptoms,
      report_ids: clusterReports.map(r => r.id),
      status: highRiskCount >= 3 ? 'active' : 'monitoring'
    });
  }

  return clusters;
}

/**
 * Recalculate clusters and sync with hotspots table in DB
 */
async function updateHotspots(db) {
  try {
    // Get reports from the last 3 days (focused active surveillance window)
    const recentReports = await db('health_reports')
      .where('created_at', '>=', db.raw("datetime('now', '-3 days')"))
      .orWhereNotNull('latitude')
      .select('*');

    const clusters = detectClusters(recentReports, 5.0, 3);

    for (const cluster of clusters) {
      const existing = await db('hotspots')
        .where('center_lat', '>=', cluster.center_lat - 0.05)
        .where('center_lat', '<=', cluster.center_lat + 0.05)
        .where('center_lng', '>=', cluster.center_lng - 0.05)
        .where('center_lng', '<=', cluster.center_lng + 0.05)
        .first();

      if (existing) {
        await db('hotspots')
          .where('id', existing.id)
          .update({
            total_reports: cluster.total_reports,
            high_risk_reports: cluster.high_risk_reports,
            dominant_symptoms: JSON.stringify(cluster.dominant_symptoms),
            status: cluster.status,
            updated_at: db.fn.now()
          });
      } else {
        await db('hotspots').insert({
          name: cluster.name,
          center_lat: cluster.center_lat,
          center_lng: cluster.center_lng,
          radius_km: cluster.radius_km,
          total_reports: cluster.total_reports,
          high_risk_reports: cluster.high_risk_reports,
          dominant_symptoms: JSON.stringify(cluster.dominant_symptoms),
          status: cluster.status,
          detected_at: db.fn.now(),
          updated_at: db.fn.now()
        });
      }
    }

    return clusters;
  } catch (err) {
    console.error('[Spatial Engine] Error updating hotspots:', err);
    return [];
  }
}

/**
 * Count nearby reports within radiusKm of a point in the last N days (default 3 days)
 */
async function getNearbyReportCount(db, lat, lng, radiusKm = 5.0, days = 3) {
  try {
    const reports = await db('health_reports')
      .where('created_at', '>=', db.raw(`datetime('now', '-${days} days')`))
      .select('latitude', 'longitude', 'risk_level');

    let count = 0;
    let highRiskCount = 0;
    for (const r of reports) {
      if (getDistanceKm(lat, lng, r.latitude, r.longitude) <= radiusKm) {
        count++;
        if (r.risk_level === 'High') highRiskCount++;
      }
    }
    return { count, highRiskCount };
  } catch (err) {
    console.warn('[Spatial Engine] Failed to get nearby report count:', err.message);
    return { count: 0, highRiskCount: 0 };
  }
}

module.exports = {
  getDistanceKm,
  detectClusters,
  updateHotspots,
  getNearbyReportCount
};
