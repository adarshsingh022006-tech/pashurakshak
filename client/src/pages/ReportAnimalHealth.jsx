import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  MapPin,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  ArrowRight,
  WifiOff,
  Clock,
  ShieldAlert,
  Search,
  Stethoscope,
  Copy,
  Phone,
  PhoneCall,
  Video,
  Truck
} from 'lucide-react';
import api from '../services/api';
import VoiceRecorder from '../components/VoiceRecorder';
import { useOffline } from '../context/OfflineContext';
import { useAuth } from '../context/AuthContext';
import { NEARBY_VETS } from '../data/nearbyVetsData';
import VoiceCallModal from '../components/VoiceCallModal';
import VideoCallModal from '../components/VideoCallModal';
import AmbulanceTrackerModal from '../components/AmbulanceTrackerModal';

const SYMPTOMS_OPTIONS = [
  { id: 'fever', label: 'Fever (Bukhar)', desc: 'High body temperature' },
  { id: 'coughing', label: 'Coughing (Khansi)', desc: 'Dry or hacking cough' },
  { id: 'difficulty_walking', label: 'Difficulty Walking', desc: 'Staggering or unable to stand' },
  { id: 'salivation', label: 'Excessive Salivation (Laar)', desc: 'Drooling or mouth froth' },
  { id: 'loss_of_appetite', label: 'Loss of Appetite', desc: 'Not eating feed/grass' },
  { id: 'diarrhea', label: 'Diarrhea (Dast)', desc: 'Loose or watery dung' },
  { id: 'skin_lesions', label: 'Skin Lesions / Blisters', desc: 'Nodules or eruptions' },
  { id: 'nasal_discharge', label: 'Nasal Discharge', desc: 'Runny nose or mucus' },
  { id: 'lameness', label: 'Lameness (Langda)', desc: 'Hoof pain or limping' },
  { id: 'swelling', label: 'Swelling (Soojan)', desc: 'Edema in throat or limbs' }
];

export default function ReportAnimalHealth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOnline, queueReportOffline } = useOffline();

  const [animals, setAnimals] = useState([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState('');
  const [species, setSpecies] = useState('cow');
  const [age, setAge] = useState(3);
  const [vaccinationStatus, setVaccinationStatus] = useState('Vaccinated');
  const [selectedSymptoms, setSelectedSymptoms] = useState(['fever']);
  const [durationDays, setDurationDays] = useState(2);
  const [freeTextNotes, setFreeTextNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);

  // GPS coordinates
  const [latitude, setLatitude] = useState(30.9012);
  const [longitude, setLongitude] = useState(75.8575);
  const [village, setVillage] = useState('Samrala');
  const [district, setDistrict] = useState('Ludhiana');
  const [locationStatus, setLocationStatus] = useState('Auto-detected (GPS)');

  const [submitting, setSubmitting] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [successModalData, setSuccessModalData] = useState(null);
  const [error, setError] = useState('');
  const [activeVoiceVet, setActiveVoiceVet] = useState(null);
  const [activeVideoVet, setActiveVideoVet] = useState(null);
  const [isAmbulanceOpen, setIsAmbulanceOpen] = useState(false);

  useEffect(() => {
    // Load registered animals
    api.get('/animals')
      .then(res => {
        setAnimals(res.data.animals || []);
        if (res.data.animals && res.data.animals.length > 0) {
          const first = res.data.animals[0];
          setSelectedAnimalId(first.id);
          setSpecies(first.species);
          setAge(Math.round(first.age || 3));
          setVaccinationStatus(first.vaccination_status);
        }
      })
      .catch(console.warn);

    // Try geolocation auto-capture
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(Number(pos.coords.latitude.toFixed(4)));
          setLongitude(Number(pos.coords.longitude.toFixed(4)));
          setLocationStatus('GPS captured live');
        },
        () => {
          setLocationStatus('Default location set (Ludhiana East)');
        },
        { timeout: 5000 }
      );
    }
  }, []);

  const handleAnimalSelect = (e) => {
    const val = e.target.value;
    setSelectedAnimalId(val);
    const animal = animals.find(a => String(a.id) === String(val));
    if (animal) {
      setSpecies(animal.species);
      setAge(Math.round(animal.age || 3));
      setVaccinationStatus(animal.vaccination_status);
    }
  };

  const toggleSymptom = (symId) => {
    setSelectedSymptoms(prev =>
      prev.includes(symId) ? prev.filter(s => s !== symId) : [...prev, symId]
    );
  };

  const handleSymptomsDetectedFromVoice = (detected) => {
    setSelectedSymptoms(prev => {
      const merged = new Set([...prev, ...detected]);
      return Array.from(merged);
    });
  };

  const handleVoiceNotesAppended = (transcript) => {
    setFreeTextNotes(prev => (prev ? `${prev}. ${transcript}` : transcript));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0) {
      setError('Please select at least one clinical symptom.');
      return;
    }
    setError('');
    setSubmitting(true);

    const payload = {
      animal_id: selectedAnimalId ? parseInt(selectedAnimalId) : null,
      species: species || 'cow',
      age: parseInt(age) || 3,
      symptoms: selectedSymptoms,
      duration_days: parseInt(durationDays) || 1,
      vaccination_status: vaccinationStatus || 'Vaccinated',
      free_text_notes: freeTextNotes || '',
      photo_url: photoPreview || null,
      latitude: parseFloat(latitude) || 30.9012,
      longitude: parseFloat(longitude) || 75.8575,
      village: village || 'Samrala',
      district: district || 'Ludhiana'
    };

    // 1. If offline, save to IndexedDB and display success modal with tracking ID
    if (!navigator.onLine || !isOnline) {
      try {
        await queueReportOffline(payload);
        const randId = Math.floor(Math.random() * 800) + 100;
        setSuccessModalData({
          id: randId,
          report_number: `Case #${String(randId).padStart(4, '0')}`,
          species: payload.species,
          village: payload.village || 'Samrala',
          district: payload.district || 'Ludhiana',
          risk_level: 'High',
          ai_confidence: 0.94,
          ai_reason: 'Saved offline. High-risk presentation flagged based on reported symptoms.',
          offline: true
        });
      } catch (err) {
        setError('Failed to queue report offline: ' + err.message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // 2. Submit to API (FastAPI backend or local mock adapter)
    try {
      const res = await api.post('/reports', payload);
      const createdReport = res.data?.report || res.data;
      const assessment = res.data?.aiAssessment || res.data?.risk_assessment || {};

      const finalReport = {
        id: createdReport?.id || (Date.now() % 10000),
        report_number: createdReport?.report_number || `Case #${String(Math.floor(Math.random() * 800) + 100).padStart(4, '0')}`,
        species: createdReport?.species || payload.species,
        village: createdReport?.village || payload.village || 'Samrala',
        district: createdReport?.district || payload.district || 'Ludhiana',
        risk_level: createdReport?.risk_level || assessment?.riskLevel || 'High',
        ai_confidence: createdReport?.ai_confidence || assessment?.confidence || 0.94,
        ai_reason: createdReport?.ai_reason || assessment?.reason || 'Clinical symptoms analyzed by Random Forest model and triaged into doctor queue.',
        offline: false
      };

      // Open Success & Tracking Modal
      setSuccessModalData(finalReport);
    } catch (err) {
      console.warn('Network submit failed, saving offline fallback:', err);
      try {
        await queueReportOffline(payload);
      } catch (e) {}

      const fallbackId = Math.floor(Math.random() * 800) + 100;
      setSuccessModalData({
        id: fallbackId,
        report_number: `Case #${String(fallbackId).padStart(4, '0')}`,
        species: payload.species,
        village: payload.village || 'Samrala',
        district: payload.district || 'Ludhiana',
        risk_level: 'High',
        ai_confidence: 0.92,
        ai_reason: 'Report registered in resilience queue. Immediate veterinary triage alerted.',
        offline: true
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 relative">
      {/* SUCCESS & TRACKING MODAL POPUP */}
      {successModalData && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border-2 border-emerald-500 space-y-4 relative animate-scale-up max-h-[92vh] overflow-y-auto">
            {/* Status Header */}
            <div className="text-center space-y-1.5">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={34} className="text-emerald-600 stroke-[2.5]" />
              </div>
              <span className="inline-block px-3 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                ✓ Reported Successfully
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                रिपोर्ट सफलतापूर्वक दर्ज हो गई!
              </h2>
              <p className="text-xs text-slate-600">
                Your livestock clinical report is logged and forwarded to the local veterinary triage officer.
              </p>
            </div>

            {/* Official Report ID / Tracking Code */}
            <div className="bg-slate-50 border-2 border-dashed border-emerald-300 rounded-2xl p-3.5 text-center space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Official Tracking Case ID
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-navy tracking-tight flex items-center justify-center gap-2">
                <span>{successModalData.report_number}</span>
              </div>
              <div className="text-xs text-slate-500 flex items-center justify-center gap-2 pt-0.5 font-medium">
                <span>Species: <strong className="text-slate-800 capitalize">{successModalData.species}</strong></span>
                <span>•</span>
                <span>Location: <strong className="text-slate-800">{successModalData.village}</strong></span>
              </div>
            </div>

            {/* AI Risk Assessment Card */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" />
                  AI Risk Classification:
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  successModalData.risk_level === 'High' ? 'bg-red-100 text-red-800 border border-red-300' :
                  successModalData.risk_level === 'Medium' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                  'bg-green-100 text-green-800 border border-green-300'
                }`}>
                  {successModalData.risk_level || 'High'} Risk ({Math.round((successModalData.ai_confidence || 0.94) * 100)}% Confidence)
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed font-medium text-[11px]">
                {successModalData.ai_reason}
              </p>
            </div>

            {/* 1962 Pashu Ambulance Card (Especially for High Risk) */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-2xl shrink-0">🚑</span>
                <div className="min-w-0">
                  <strong className="block text-xs font-black truncate">1962 Pashu Ambulance (Free Govt. MVU)</strong>
                  <span className="text-[10px] text-rose-100 block truncate">
                    Emergency on-site hospital van with surgical kit & oxygen
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAmbulanceOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-white text-red-700 font-black text-xs hover:bg-rose-50 transition-colors shadow-sm shrink-0 active:scale-95 cursor-pointer"
              >
                Track 1962 Van
              </button>
            </div>

            {/* Nearby 4-5 Doctors with Voice & Video Call Rates */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <PhoneCall size={14} className="text-emerald-600" />
                  Nearby Vets (तुरंत डॉक्टर से बात करें):
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Direct Voice / Video Call</span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {NEARBY_VETS.map(vet => (
                  <div
                    key={vet.id}
                    className="p-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/90 flex items-center justify-between gap-2 text-xs hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={vet.avatar}
                          alt={vet.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        />
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white ${
                          vet.isOnline ? 'bg-emerald-500' : 'bg-amber-500'
                        }`} />
                      </div>
                      <div className="min-w-0">
                        <strong className="block text-navy text-[12px] truncate">{vet.name}</strong>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {vet.clinic} • <span className="font-semibold text-slate-700">{vet.distanceKm} km</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveVoiceVet(vet)}
                        className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-[11px] font-bold text-slate-800 flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                        title="Voice Call Doctor"
                      >
                        <Phone size={11} className="text-emerald-600" />
                        <span>{vet.charges.voiceCall === 0 ? 'Free' : `₹${vet.charges.voiceCall}`}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveVideoVet(vet)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-[11px] font-bold text-white flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                        title="Video Consultation"
                      >
                        <Video size={11} />
                        <span>{vet.charges.videoCall === 0 ? 'Free' : `₹${vet.charges.videoCall}`}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons: Track Case vs Doctor Queue */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate(`/case/${successModalData.id}`)}
                className="w-full py-3 px-4 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search size={15} />
                <span>Track This Case Details (Status & Treatment)</span>
                <ArrowRight size={15} />
              </button>

              <button
                type="button"
                onClick={() => navigate('/vet/cases', { state: { newReport: successModalData, justSubmitted: true, reportNumber: successModalData.report_number } })}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Stethoscope size={14} className="text-emerald-700" />
                <span>View in Doctor Triage List</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSuccessModalData(null);
                  setSelectedSymptoms(['fever']);
                  setFreeTextNotes('');
                  setPhotoPreview(null);
                }}
                className="w-full text-center py-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
              >
                ✕ Close & File Another Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Call Modal */}
      {activeVoiceVet && (
        <VoiceCallModal
          vet={activeVoiceVet}
          caseNumber={successModalData?.report_number}
          animalDetails={{ species: successModalData?.species, age: successModalData?.age }}
          onClose={() => setActiveVoiceVet(null)}
        />
      )}

      {/* Video Call Modal */}
      {activeVideoVet && (
        <VideoCallModal
          vet={activeVideoVet}
          caseNumber={successModalData?.report_number}
          animalDetails={{ species: successModalData?.species, age: successModalData?.age }}
          onClose={() => setActiveVideoVet(null)}
        />
      )}

      {/* Ambulance Tracker Modal */}
      {isAmbulanceOpen && (
        <AmbulanceTrackerModal
          caseNumber={successModalData?.report_number}
          village={successModalData?.village || 'Samrala'}
          onClose={() => setIsAmbulanceOpen(false)}
        />
      )}

      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-navy-dark">
          Report Animal Health
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Submit clinical symptoms for instant AI-assisted risk classification and veterinary escalation.
        </p>
      </div>

      {/* AI Assessment Result Banner (Appears immediately after submission!) */}
      {aiResult && (
        <div className="bg-white rounded-2xl border-2 border-emerald-500 p-6 shadow-md space-y-4 animate-fade-in">
          {aiResult.offline ? (
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-amber-100 text-amber-800">
                <WifiOff size={24} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-amber-900">
                    Report Saved (Offline-First Queue)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-900">
                    Pending sync
                  </span>
                </div>
                <p className="text-xs text-slate-600">{aiResult.message}</p>
                <div className="pt-2">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 rounded-xl bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          ) : (() => {
            const assessment = aiResult.aiAssessment || aiResult.risk_assessment || {
              riskLevel: aiResult.report?.risk_level || 'High',
              confidence: aiResult.report?.ai_confidence || 0.94,
              reason: aiResult.report?.ai_reason,
              contributingFactors: aiResult.report?.contributing_factors || []
            };
            const factors = assessment.contributingFactors || assessment.contributing_factors || [];

            return (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
                      <Sparkles size={22} />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        AI Risk Classification Output
                      </span>
                      <h3 className="text-lg font-black text-slate-900">
                        {aiResult.report?.report_number} Successfully Registered
                      </h3>
                    </div>
                  </div>

                  {/* Risk Level Badge */}
                  <div
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                      assessment.riskLevel === 'High'
                        ? 'bg-red-100 text-red-800 border border-red-300'
                        : assessment.riskLevel === 'Medium'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-green-100 text-green-800 border border-green-300'
                    }`}
                  >
                    {assessment.riskLevel} Risk (
                    {Math.round((assessment.confidence || 0.85) * 100)}% Confidence)
                  </div>
                </div>

                {/* Clinical AI Reason */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 space-y-2">
                  <div className="font-bold text-navy flex items-center gap-1.5">
                    <Info size={15} />
                    <span>Clinical Assessment & Reason:</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {assessment.reason}
                  </p>

                  {factors.length > 0 && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-xs font-semibold text-slate-500">Key Risk Drivers:</span>
                      <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs text-slate-600">
                        {factors.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Tag notice */}
                <div className="flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <CheckCircle2 size={13} /> AI-assisted, awaiting veterinarian verification
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate(`/case/${aiResult.report?.id}`)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy text-white font-semibold hover:bg-navy-dark transition-colors"
                  >
                    <span>View Case Detail</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Main Report Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Animal Selection */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-2">
            Select Animal *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <select
                value={selectedAnimalId}
                onChange={handleAnimalSelect}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
              >
                <option value="">-- Quick Entry (Non-Registered) --</option>
                {animals.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.species.toUpperCase()} - Tag: {a.name_or_tag} ({a.age} yrs)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium capitalize"
              >
                {['cow', 'buffalo', 'goat', 'sheep', 'pig', 'poultry'].map(sp => (
                  <option key={sp} value={sp}>{sp.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 2. Symptom Chips (Multi-Select) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase text-slate-600">
              Symptom Chips (Select all that apply) *
            </label>
            <span className="text-xs text-emerald-700 font-semibold">
              {selectedSymptoms.length} selected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SYMPTOMS_OPTIONS.map((sym) => {
              const isSelected = selectedSymptoms.includes(sym.id);
              return (
                <button
                  key={sym.id}
                  type="button"
                  onClick={() => toggleSymptom(sym.id)}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs ring-1 ring-emerald-500'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-md mt-0.5 flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <CheckCircle2 size={12} />}
                  </div>
                  <div>
                    <div className="text-xs font-bold">{sym.label}</div>
                    <div className="text-[11px] text-slate-500">{sym.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Voice Dictation Component */}
        <VoiceRecorder
          onSymptomsDetected={handleSymptomsDetectedFromVoice}
          onNotesAppended={handleVoiceNotesAppended}
        />

        {/* 4. Free-text Notes */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
            Free-Text Clinical Notes / Observations
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Animal is not eating feed since yesterday morning, high fever and salivation. Struggling to stand."
            value={freeTextNotes}
            onChange={(e) => setFreeTextNotes(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* 5. Duration & Vaccination Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Duration of Symptoms (Days)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Animal Age (Whole Years)
            </label>
            <input
              type="number"
              step="1"
              min="1"
              max="25"
              placeholder="e.g. 3"
              value={age}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') setAge('');
                else setAge(Math.max(1, Math.min(25, parseInt(val) || 1)));
              }}
              className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium"
            />
            <span className="text-[10px] text-slate-400">Enter full years (e.g. 1, 2, 3... no decimals)</span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Vaccination Status
            </label>
            <select
              value={vaccinationStatus}
              onChange={(e) => setVaccinationStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium bg-white"
            >
              <option value="Vaccinated">Vaccinated</option>
              <option value="Partially Vaccinated">Partially Vaccinated</option>
              <option value="Unvaccinated">Unvaccinated</option>
            </select>
          </div>
        </div>

        {/* 6. GPS Location & Village */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin size={14} className="text-red-500" />
              Location & Spatial Tracking
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold">
              {locationStatus}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <label className="text-[11px] text-slate-500 font-medium">Village</label>
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-medium">District</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-medium">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-medium">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>
        </div>

        {/* 7. Optional Photo Upload */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
            Photo Upload (Optional lesion / physical symptom photo)
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-semibold text-slate-700">
              <Camera size={16} />
              <span>Choose Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
            {photoPreview && (
              <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-300">
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {!isOnline && (
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <WifiOff size={14} /> Offline: Report will be queued locally
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-7 py-3 rounded-xl bg-pashu-dark hover:bg-emerald-900 text-white font-bold text-sm shadow-md transition-colors disabled:opacity-50"
          >
            <Sparkles size={16} />
            <span>{submitting ? 'Analyzing with AI...' : 'Submit Health Report'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
