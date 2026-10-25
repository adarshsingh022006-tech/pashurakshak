import React, { useState } from 'react';
import { 
  Phone, Video, Stethoscope, Star, MapPin, 
  ShieldCheck, Clock, Search, Filter, Truck, CheckCircle2 
} from 'lucide-react';
import { NEARBY_VETS } from '../data/nearbyVetsData';
import VoiceCallModal from '../components/VoiceCallModal';
import VideoCallModal from '../components/VideoCallModal';
import AmbulanceTrackerModal from '../components/AmbulanceTrackerModal';

export default function NearbyVetsPage() {
  const [vets] = useState(NEARBY_VETS);
  const [filter, setFilter] = useState('ALL'); // 'ALL', 'ONLINE', 'GOVT', 'LOW_FEE'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [activeVoiceVet, setActiveVoiceVet] = useState(null);
  const [activeVideoVet, setActiveVideoVet] = useState(null);
  const [isAmbulanceOpen, setIsAmbulanceOpen] = useState(false);

  const filteredVets = vets.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.clinic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filter === 'ONLINE') return v.isOnline;
    if (filter === 'GOVT') return v.isGovt;
    if (filter === 'LOW_FEE') return v.charges.videoCall <= 150;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">

      {/* Top Banner: Emergency 1962 Pashu Ambulance Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 via-rose-700 to-navy text-white p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner shrink-0">
            🚑
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black uppercase tracking-wider">
                Emergency 24x7
              </span>
              <h2 className="text-xl font-black">1962 Pashu Ambulance (Mobile Veterinary Unit)</h2>
            </div>
            <p className="text-xs text-rose-100 mt-1 max-w-xl">
              Critical or emergency livestock condition? Dispatch the government mobile veterinary clinic equipped with surgical kit, oxygen, and paravet staff directly to your farm.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsAmbulanceOpen(true)}
            className="px-5 py-3 rounded-2xl bg-white text-red-700 hover:bg-rose-50 font-black text-xs shadow-lg transition-transform active:scale-95 flex items-center gap-2"
          >
            <Truck size={16} />
            <span>Track 1962 Ambulance (एम्बुलेंस ट्रैक करें)</span>
          </button>
        </div>
      </div>

      {/* Page Title & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy flex items-center gap-2.5">
            <Stethoscope size={26} className="text-emerald-600" />
            <span>Nearby Verified Veterinarians (निकटतम पशु चिकित्सक)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Connect directly with verified large animal doctors via instant phone call or live video inspection.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search doctor, hospital, symptom..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { key: 'ALL', label: `All Doctors (${vets.length})` },
          { key: 'ONLINE', label: '🟢 Available Now' },
          { key: 'GOVT', label: '🏛️ Free Govt. Helpline (1962)' },
          { key: 'LOW_FEE', label: '💰 Under ₹150 Video' }
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
              filter === tab.key
                ? 'bg-navy text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Doctors Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVets.map(vet => (
          <div
            key={vet.id}
            className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
          >
            {/* Top Doctor Info */}
            <div className="p-5 space-y-3.5">
              <div className="flex items-start gap-3.5">
                <div className="relative shrink-0">
                  <img
                    src={vet.avatar}
                    alt={vet.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-xs"
                  />
                  <span
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                      vet.isOnline ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    title={vet.isOnline ? 'Online Now' : 'Busy'}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-bold text-sm text-navy truncate">{vet.name}</h3>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
                      <Star size={11} className="fill-amber-500 text-amber-500" />
                      {vet.rating}
                    </span>
                  </div>

                  <p className="text-xs text-emerald-700 font-semibold">{vet.title}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                    <MapPin size={11} className="text-slate-400 shrink-0" />
                    <span>{vet.clinic}</span>
                  </p>
                </div>
              </div>

              {/* Status and Distance Badges */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-500 font-medium">
                  Distance: <strong className="text-slate-800">{vet.distanceKm} km away</strong>
                </span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                  vet.isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {vet.statusText}
                </span>
              </div>

              {/* Specialties chips */}
              <div className="flex flex-wrap gap-1">
                {vet.specialties.map((sp, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                  >
                    {sp}
                  </span>
                ))}
              </div>

              {/* Consultation Charges Box */}
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100/90 text-xs space-y-1.5">
                <div className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">
                  Transparent Consultation Fees
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-emerald-100">
                    <span className="text-slate-600 flex items-center gap-1">
                      <Phone size={11} className="text-emerald-600" /> Voice Call
                    </span>
                    <strong className="text-emerald-800">
                      {vet.charges.voiceCall === 0 ? 'FREE' : `₹${vet.charges.voiceCall}`}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-emerald-100">
                    <span className="text-slate-600 flex items-center gap-1">
                      <Video size={11} className="text-teal-600" /> Video Call
                    </span>
                    <strong className="text-teal-800">
                      {vet.charges.videoCall === 0 ? 'FREE' : `₹${vet.charges.videoCall}`}
                    </strong>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 text-center">
                  Farm Visit: {vet.charges.farmVisit === 0 ? 'Govt. Subsidized' : `₹${vet.charges.farmVisit}`}
                </div>
              </div>
            </div>

            {/* Action Buttons: Voice Call & Video Call */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setActiveVoiceVet(vet)}
                className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs active:scale-95"
              >
                <Phone size={14} className="text-emerald-600" />
                <span>Call ({vet.charges.voiceCall === 0 ? 'Free' : `₹${vet.charges.voiceCall}`})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveVideoVet(vet)}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm active:scale-95"
              >
                <Video size={14} />
                <span>Video ({vet.charges.videoCall === 0 ? 'Free' : `₹${vet.charges.videoCall}`})</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {activeVoiceVet && (
        <VoiceCallModal
          vet={activeVoiceVet}
          onClose={() => setActiveVoiceVet(null)}
        />
      )}

      {activeVideoVet && (
        <VideoCallModal
          vet={activeVideoVet}
          onClose={() => setActiveVideoVet(null)}
        />
      )}

      {isAmbulanceOpen && (
        <AmbulanceTrackerModal
          onClose={() => setIsAmbulanceOpen(false)}
        />
      )}

    </div>
  );
}
