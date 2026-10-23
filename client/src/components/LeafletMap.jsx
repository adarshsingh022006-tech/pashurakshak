import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { AlertTriangle, Info, MapPin } from 'lucide-react';

// Custom SVG Pin Generator for Leaflet
function createColorIcon(color, isHigh = false) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${isHigh ? 32 : 26}" height="${isHigh ? 32 : 26}">
      <path fill="${color}" stroke="#ffffff" stroke-width="2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="3" fill="#ffffff"/>
    </svg>
  `;
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: svg,
    iconSize: [isHigh ? 32 : 26, isHigh ? 32 : 26],
    iconAnchor: [isHigh ? 16 : 13, isHigh ? 32 : 26],
    popupAnchor: [0, isHigh ? -30 : -24],
  });
}

const highIcon = createColorIcon('#DC2626', true);
const mediumIcon = createColorIcon('#D97706', false);
const lowIcon = createColorIcon('#16A34A', false);

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || 11);
    }
  }, [center, zoom, map]);
  return null;
}

export default function LeafletMap({
  reports = [],
  hotspots = [],
  center = [30.9010, 75.8572],
  zoom = 11,
  height = '500px',
  interactive = true,
  onReportSelect
}) {
  const getMarkerIcon = (riskLevel) => {
    if (riskLevel === 'High') return highIcon;
    if (riskLevel === 'Medium') return mediumIcon;
    return lowIcon;
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height }}>
      {/* Map Legend */}
      <div className="absolute top-3 right-3 z-20 bg-white/95 backdrop-blur-md px-3 py-2.5 rounded-xl border border-slate-200/90 shadow-md text-xs font-medium space-y-1.5 select-none pointer-events-auto">
        <div className="font-bold text-slate-900 border-b border-slate-100 pb-1 flex items-center gap-1.5">
          <MapPin size={13} className="text-pashu-dark" />
          <span>Risk Level Legend</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-600 inline-block shadow-xs"></span>
          <span className="text-slate-700">High Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-xs"></span>
          <span className="text-slate-700">Medium Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-600 inline-block shadow-xs"></span>
          <span className="text-slate-700">Low Risk</span>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500">
          <span className="w-3 h-1 border-t-2 border-dashed border-red-600 inline-block"></span>
          <span>Hotspot Radius (5 km)</span>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        style={{ width: '100%', height: '100%' }}
      >
        <MapController center={center} zoom={zoom} />

        {/* OpenStreetMap Base Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Hotspot Circles with Dashed Border & Popup matching PPT */}
        {hotspots.map((spot, idx) => {
          const lat = spot.center_lat || spot.centerLat;
          const lng = spot.center_lng || spot.centerLng;
          const radiusMeters = (spot.radius_km || spot.radiusKm || 5.0) * 1000;
          const totalReports = spot.total_reports || spot.totalReports || 28;
          const highRiskCount = spot.high_risk_reports || spot.highRiskCount || 7;

          if (!lat || !lng) return null;

          return (
            <Circle
              key={`hotspot-${spot.id || idx}`}
              center={[lat, lng]}
              radius={radiusMeters}
              pathOptions={{
                color: '#DC2626',
                weight: 2.5,
                dashArray: '8, 8',
                fillColor: '#FEE2E2',
                fillOpacity: 0.25,
                className: 'hotspot-circle-pulse'
              }}
            >
              <Popup className="hotspot-popup">
                <div className="p-1 space-y-1.5 text-xs">
                  <div className="font-bold text-sm text-red-700 flex items-center gap-1.5">
                    <AlertTriangle size={15} />
                    <span>Possible Outbreak Hotspot</span>
                  </div>
                  <div className="text-slate-700 space-y-0.5">
                    <div>
                      <span className="font-medium">Reports in this area: </span>
                      <span className="font-bold text-slate-900">{totalReports}</span>
                    </div>
                    <div>
                      <span className="font-medium">High-risk reports: </span>
                      <span className="font-bold text-red-600">{highRiskCount}</span>
                    </div>
                    <div>
                      <span className="font-medium">Detection radius: </span>
                      <span className="font-bold text-slate-900">{spot.radius_km || 5} km</span>
                    </div>
                  </div>
                  <div className="pt-1 border-t border-slate-100 text-[11px] text-slate-500 italic">
                    AI Spatial Engine: Haversine DBSCAN Cluster (Ludhiana East)
                  </div>
                </div>
              </Popup>
            </Circle>
          );
        })}

        {/* Reports GPS Pins */}
        {reports.map((report) => {
          if (!report.latitude || !report.longitude) return null;

          let symptoms = [];
          try {
            symptoms = typeof report.symptoms === 'string' ? JSON.parse(report.symptoms) : (report.symptoms || []);
          } catch (e) {
            symptoms = [];
          }

          const isHigh = report.risk_level === 'High';

          return (
            <Marker
              key={`report-${report.id}`}
              position={[report.latitude, report.longitude]}
              icon={getMarkerIcon(report.risk_level)}
              eventHandlers={{
                click: () => onReportSelect && onReportSelect(report)
              }}
            >
              <Popup>
                <div className="p-1 space-y-2 text-xs min-w-[200px]">
                  <div className="flex items-center justify-between gap-2 border-b pb-1.5">
                    <span className="font-bold text-slate-900 text-sm">{report.report_number}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isHigh
                          ? 'bg-red-100 text-red-800'
                          : report.risk_level === 'Medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {report.risk_level} Risk
                    </span>
                  </div>

                  <div className="space-y-1 text-slate-600">
                    <div>
                      <span className="font-medium text-slate-800">Animal: </span>
                      <span className="capitalize">{report.species} ({Math.round(report.age || 3)} yrs)</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-800">Location: </span>
                      <span>{report.village || 'Local Village'}, {report.district || 'Ludhiana'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-800">Status: </span>
                      <span className="font-semibold text-slate-900">{report.status}</span>
                    </div>
                    {symptoms.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {symptoms.slice(0, 3).map((sym, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px]"
                          >
                            {sym.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t">
                    <Link
                      to={`/case/${report.id}`}
                      className="block text-center w-full py-1.5 px-3 rounded-lg bg-navy text-white text-xs font-semibold hover:bg-navy-dark transition-colors"
                    >
                      View Case Detail
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
