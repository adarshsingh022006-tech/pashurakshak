import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Truck, Phone, ShieldCheck, AlertTriangle, Clock, 
  MapPin, CheckCircle2, Navigation, Activity, PhoneCall, RefreshCw 
} from 'lucide-react';
import { MOBILE_VET_UNITS } from '../data/nearbyVetsData';

// Custom Leaflet Icons
const createAmbulanceIcon = () => {
  return L.divIcon({
    className: 'custom-mvu-icon-page',
    html: `
      <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; inset: -4px; border-radius: 9999px; background-color: #ef4444; opacity: 0.75; animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; width: 40px; height: 40px; border-radius: 9999px; background-color: #dc2626; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3); border: 2.5px solid white; font-size: 20px;">
          🚑
        </div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24]
  });
};

const createFarmIcon = () => {
  return L.divIcon({
    className: 'custom-farm-icon-page',
    html: `
      <div style="width: 40px; height: 40px; border-radius: 9999px; background-color: #059669; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3); border: 2.5px solid white; font-size: 18px;">
        🏡
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

export default function AmbulanceTrackerPage() {
  const mvu = MOBILE_VET_UNITS[0];
  const [step, setStep] = useState(0);
  const [village, setVillage] = useState('Samrala');
  const [emergencyReason, setEmergencyReason] = useState('Acute FMD & Locomotor Distress');
  const [isDispatched, setIsDispatched] = useState(true);

  // GPS Route Waypoints
  const waypoints = [
    [30.9125, 75.8710], // Samrala Highway Junction
    [30.9095, 75.8670], // Sector 2
    [30.9060, 75.8630], // Hospital Crossing
    [30.9030, 75.8595], // Village Road Entry
    [30.9010, 75.8572]  // Farm Gate
  ];

  const distances = [3.2, 2.4, 1.6, 0.7, 0.0];
  const etas = [12, 9, 6, 2, 0];

  useEffect(() => {
    if (!isDispatched) return;
    const timer = setInterval(() => {
      setStep(prev => (prev < waypoints.length - 1 ? prev + 1 : prev));
    }, 4000);
    return () => clearInterval(timer);
  }, [isDispatched, waypoints.length]);

  const currentPos = waypoints[step];
  const currentDistance = distances[step];
  const currentEta = etas[step];
  const hasArrived = step === waypoints.length - 1;

  const handleReset = () => {
    setStep(0);
    setIsDispatched(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-red-100 text-red-600">
              <Truck size={24} />
            </span>
            <h1 className="text-2xl font-black text-navy">
              1962 Pashu Ambulance (Mobile Veterinary Unit) Command Center
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time GPS dispatch and live telemetry for Department of Animal Husbandry Mobile Veterinary Units (MVU).
          </p>
        </div>

        {/* 1962 National Helpline Dial Button */}
        <a
          href="tel:1962"
          className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-transform active:scale-95"
        >
          <PhoneCall size={16} />
          <span>Call 1962 Emergency Helpline</span>
        </a>
      </div>

      {/* Live Status Header Bar */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-red-600 via-rose-700 to-navy text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`w-3.5 h-3.5 rounded-full ${hasArrived ? 'bg-emerald-400' : 'bg-amber-300 animate-ping'}`} />
          <div>
            <strong className="text-sm">
              {hasArrived ? 'Unit Arrived at Farm Gate (इकाई फार्म पर पहुंच चुकी है)' : 'Vehicle Dispatched & En Route (एम्बुलेंस रास्ते में है)'}
            </strong>
            <p className="text-xs text-rose-100">
              Assigned: {mvu.vehicleNumber} ({mvu.vehicleType}) • Sector: Samrala-Ludhiana East
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-black/20 px-3 py-1.5 rounded-xl">
            Distance: <strong className="text-amber-300">{currentDistance.toFixed(1)} km</strong>
          </div>
          <div className="bg-black/20 px-3 py-1.5 rounded-xl">
            ETA: <strong className="text-emerald-300">{hasArrived ? 'ARRIVED' : `${currentEta} mins`}</strong>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
            title="Replay Route Animation"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Main Grid: 2 Cols Map + 1 Col Telemetry & Crew */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Map (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col h-[520px] relative">
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

            {/* Red Route Line */}
            <Polyline
              positions={waypoints}
              color="#dc2626"
              weight={5}
              dashArray="6, 8"
            />

            {/* Destination Farm Pin */}
            <Marker position={waypoints[waypoints.length - 1]} icon={createFarmIcon()}>
              <Popup>
                <div className="p-1 text-xs">
                  <strong>🏡 Farmer Livestock Shed</strong>
                  <p className="text-slate-500">{village}, Ludhiana</p>
                  <p className="text-emerald-600 font-bold">Case #0036 (FMD Protocol)</p>
                </div>
              </Popup>
            </Marker>

            {/* Moving Ambulance Marker */}
            <Marker position={currentPos} icon={createAmbulanceIcon()}>
              <Popup>
                <div className="p-1 text-xs">
                  <strong className="text-red-600">🚑 PB-10-MVU-1962</strong>
                  <p className="font-semibold text-slate-800">Speed: 42 km/h</p>
                  <p className="text-slate-500">Driver: Balwinder Singh</p>
                </div>
              </Popup>
            </Marker>
          </MapContainer>

          {/* Floating Map Controls */}
          <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-md border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2">
            <Navigation size={15} className="text-red-600" />
            <span>Telemetry Active • GPS Lock: ±3m</span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              Destination: <strong className="text-navy">{village} Dairy Herd</strong> (Emergency Reason: {emergencyReason})
            </span>
            <span className="text-emerald-700 font-bold font-mono">
              Status: {hasArrived ? 'On Site' : 'In Transit'}
            </span>
          </div>
        </div>

        {/* Right Details Panel (1 col) */}
        <div className="space-y-4">

          {/* Van Profile Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-navy text-sm">{mvu.vehicleNumber}</h3>
                <p className="text-xs text-slate-500">{mvu.unitName}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                1962 Active MVU
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
              <div className="p-2.5 rounded-xl bg-slate-50">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Speed</span>
                <span className="font-bold text-slate-800">{mvu.speedKmH} km/h</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Fuel / Battery</span>
                <span className="font-bold text-emerald-600">88% Normal</span>
              </div>
            </div>
          </div>

          {/* On-Board Crew */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Ambulance Medical Staff
            </h4>

            {/* Field Vet */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
              <div>
                <strong className="block text-xs text-slate-900">{mvu.leadVet}</strong>
                <span className="text-[11px] text-emerald-700 font-medium">Veterinary Doctor on Board</span>
              </div>
              <a
                href={`tel:${mvu.leadVetPhone}`}
                className="p-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                title="Call Field Doctor"
              >
                <Phone size={14} />
              </a>
            </div>

            {/* Driver */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <strong className="block text-xs text-slate-900">{mvu.driverName}</strong>
                <span className="text-[11px] text-slate-500">Ambulance Pilot / Driver</span>
              </div>
              <a
                href={`tel:${mvu.driverPhone}`}
                className="p-2.5 rounded-xl bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors shadow-xs"
                title="Call Driver"
              >
                <Phone size={14} />
              </a>
            </div>
          </div>

          {/* Onboard Emergency Life Support */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Activity size={14} className="text-red-500" />
              On-Board Clinical Equipment
            </h4>

            <ul className="space-y-2 text-xs text-slate-600">
              {mvu.equipment.map((eq, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span className="text-[11px] leading-tight">{eq}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
}
