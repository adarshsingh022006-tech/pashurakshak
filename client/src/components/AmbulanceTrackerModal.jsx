import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Truck, Phone, ShieldCheck, AlertTriangle, Clock, 
  MapPin, CheckCircle2, Navigation, Activity, X
} from 'lucide-react';
import { MOBILE_VET_UNITS } from '../data/nearbyVetsData';

// Custom Ambulance & Farm Leaflet HTML Icons
const createAmbulanceIcon = () => {
  return L.divIcon({
    className: 'custom-mvu-icon',
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; inset: -4px; border-radius: 9999px; background-color: #ef4444; opacity: 0.75; animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; width: 36px; height: 36px; border-radius: 9999px; background-color: #dc2626; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3); border: 2px solid white; font-size: 18px;">
          🚑
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });
};

const createFarmIcon = () => {
  return L.divIcon({
    className: 'custom-farm-icon',
    html: `
      <div style="width: 36px; height: 36px; border-radius: 9999px; background-color: #059669; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3); border: 2px solid white; font-size: 16px;">
        🏡
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
};

export default function AmbulanceTrackerModal({ caseNumber, village = 'Samrala', onClose }) {
  const mvu = MOBILE_VET_UNITS[0];
  const [step, setStep] = useState(0);
  const [isCallingHelp, setIsCallingHelp] = useState(false);

  // Route waypoints from Highway to Farm
  const waypoints = [
    [30.9125, 75.8710], // Starting: Highway Junction
    [30.9095, 75.8670], // Sector 2 Samrala
    [30.9060, 75.8630], // Hospital Crossing
    [30.9030, 75.8595], // Village Road Entry
    [30.9010, 75.8572]  // Arrived: Farm Gate
  ];

  const distances = [3.2, 2.4, 1.6, 0.7, 0.0];
  const etas = [12, 9, 6, 2, 0];

  // Moving step animation every 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setStep(prev => (prev < waypoints.length - 1 ? prev + 1 : prev));
    }, 3500);

    return () => clearInterval(timer);
  }, [waypoints.length]);

  const currentPos = waypoints[step];
  const currentDistance = distances[step];
  const currentEta = etas[step];
  const hasArrived = step === waypoints.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white shadow-2xl rounded-3xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-600 via-rose-700 to-navy text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl shadow-inner">
              🚑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg">1962 Pashu Ambulance (MVU) Live Tracker</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 font-black text-[10px] uppercase tracking-wider">
                  Emergency Unit
                </span>
              </div>
              <p className="text-xs text-rose-100">
                Government Mobile Veterinary Unit • Dispatched to {village} (Case {caseNumber || '#0036'})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Live Status Banner Bar */}
        <div className="px-6 py-3 bg-rose-50 border-b border-rose-100 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${hasArrived ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'}`} />
            <strong className="text-rose-950">
              {hasArrived ? '✅ 1962 Ambulance has arrived at your farm!' : 'Emergency Van is En Route to your farm!'}
            </strong>
          </div>

          <div className="flex items-center gap-4 font-mono font-bold">
            <span className="text-slate-600">
              Distance: <strong className="text-rose-700">{currentDistance.toFixed(1)} km</strong>
            </span>
            <span className="text-slate-600">
              ETA: <strong className="text-emerald-700">{hasArrived ? 'ARRIVED' : `${currentEta} mins`}</strong>
            </span>
          </div>
        </div>

        {/* Main Content Area: Leaflet Map + Van Telemetry Side Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 flex-1 overflow-y-auto">

          {/* Interactive Map (2 Cols) */}
          <div className="md:col-span-2 h-[340px] md:h-auto min-h-[340px] relative">
            <MapContainer
              center={currentPos}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Highway Route Polyline */}
              <Polyline
                positions={waypoints}
                color="#dc2626"
                weight={4}
                dashArray="6, 8"
              />

              {/* Destination Farm Pin */}
              <Marker position={waypoints[waypoints.length - 1]} icon={createFarmIcon()}>
                <Popup>
                  <div className="text-xs p-1">
                    <strong>🏡 Your Farm</strong>
                    <p className="text-slate-500">{village}, Ludhiana</p>
                  </div>
                </Popup>
              </Marker>

              {/* Moving Ambulance Pin */}
              <Marker position={currentPos} icon={createAmbulanceIcon()}>
                <Popup>
                  <div className="text-xs p-1">
                    <strong>🚑 PB-10-MVU-1962</strong>
                    <p className="text-rose-600 font-bold">Speed: 42 km/h</p>
                    <p className="text-slate-500">Lead: Dr. Aman Kaur</p>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>

            {/* Over-map Quick Badge */}
            <div className="absolute top-3 left-3 z-[1000] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200 text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
              <Navigation size={14} className="text-rose-600" />
              <span>Real-time GPS Tracking</span>
            </div>
          </div>

          {/* Side Panel: Driver, Doctor, Equipment Details (1 Col) */}
          <div className="p-5 bg-slate-50 border-l border-slate-100 space-y-4 text-xs">

            {/* Vehicle Card */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-navy text-sm">{mvu.vehicleNumber}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                  MVU Clinic
                </span>
              </div>
              <p className="text-slate-500 text-[11px]">{mvu.vehicleType}</p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                <span>Speed: <strong>{mvu.speedKmH} km/h</strong></span>
                <span>Toll Helpline: <strong className="text-rose-600 font-bold">1962</strong></span>
              </div>
            </div>

            {/* Crew Card */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                On-Duty Ambulance Team
              </h4>

              {/* Lead Doctor */}
              <div className="flex items-center justify-between">
                <div>
                  <strong className="block text-slate-900 font-semibold">{mvu.leadVet}</strong>
                  <span className="text-[11px] text-slate-400">Veterinary Officer</span>
                </div>
                <a
                  href={`tel:${mvu.leadVetPhone}`}
                  className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                  title="Call Doctor"
                >
                  <Phone size={15} />
                </a>
              </div>

              {/* Driver */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  <strong className="block text-slate-900 font-semibold">{mvu.driverName}</strong>
                  <span className="text-[11px] text-slate-400">Ambulance Pilot / Driver</span>
                </div>
                <a
                  href={`tel:${mvu.driverPhone}`}
                  className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  title="Call Driver"
                >
                  <Phone size={15} />
                </a>
              </div>
            </div>

            {/* Emergency Equipment Onboard */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Activity size={14} className="text-emerald-600" />
                Equipment & Medicine Onboard
              </h4>
              <ul className="space-y-1 text-[11px] text-slate-600">
                {mvu.equipment.slice(0, 4).map((eq, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                    <span className="truncate">{eq}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 1962 Toll Free Direct Action Button */}
            <a
              href="tel:1962"
              className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-center block shadow-lg shadow-red-600/30 transition-all active:scale-95"
            >
              📞 Call National Pashu Helpline (1962)
            </a>

          </div>
        </div>

      </div>
    </div>
  );
}
