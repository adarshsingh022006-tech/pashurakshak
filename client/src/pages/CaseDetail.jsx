import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  Calendar,
  Stethoscope,
  MapPin,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldAlert,
  CloudSun,
  User,
  Plus,
  Phone,
  PhoneCall,
  Video,
  Truck
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import CaseLifecycleStepper from '../components/CaseLifecycleStepper';
import { NEARBY_VETS } from '../data/nearbyVetsData';
import VoiceCallModal from '../components/VoiceCallModal';
import VideoCallModal from '../components/VideoCallModal';
import AmbulanceTrackerModal from '../components/AmbulanceTrackerModal';

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Vet action form states
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [activeVoiceVet, setActiveVoiceVet] = useState(null);
  const [activeVideoVet, setActiveVideoVet] = useState(null);
  const [isAmbulanceOpen, setIsAmbulanceOpen] = useState(false);
  const [treatmentForm, setTreatmentForm] = useState({
    diagnosis: '',
    prescribed_medicines: '',
    dosage_instructions: '',
    notes: '',
    follow_up_date: ''
  });
  const [visitForm, setVisitForm] = useState({
    scheduled_date: new Date(Date.now() + 86400 * 1000).toISOString().split('T')[0],
    scheduled_time: '10:00 AM',
    notes: ''
  });
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchCaseDetail = async () => {
    try {
      const res = await api.get(`/reports/${id}`);
      setData(res.data);
    } catch (err) {
      console.error('Case detail error:', err);
      setError('Could not load case details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetail();
  }, [id]);

  const handleEscalate = async () => {
    if (!window.confirm('Are you sure you want to escalate this case to Emergency Priority? All veterinarians in the district will receive immediate alerts.')) {
      return;
    }
    try {
      await api.post(`/reports/${data.report.id}/escalate`);
      setActionSuccess('Emergency escalation dispatched to on-duty veterinary response teams.');
      fetchCaseDetail();
    } catch (e) {
      alert('Failed to escalate case: ' + e.message);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.patch(`/reports/${data.report.id}/status`, { status: newStatus });
      setActionSuccess(`Status updated to ${newStatus}`);
      fetchCaseDetail();
    } catch (e) {
      alert('Failed to update status: ' + e.message);
    }
  };

  const handleAddTreatment = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/reports/${data.report.id}/treatment`, treatmentForm);
      setShowTreatmentModal(false);
      setActionSuccess('Treatment record and prescription added successfully.');
      fetchCaseDetail();
    } catch (e) {
      alert('Failed to add treatment: ' + e.message);
    }
  };

  const handleScheduleVisit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/reports/${data.report.id}/visit`, visitForm);
      setShowVisitModal(false);
      setActionSuccess('Clinical on-site visit scheduled successfully.');
      fetchCaseDetail();
    } catch (e) {
      alert('Failed to schedule visit: ' + e.message);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm animate-pulse">
        Loading case details and clinical records...
      </div>
    );
  }

  if (error || !data || !data.report) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-red-600 font-bold">{error || 'Case not found'}</div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-xl bg-slate-200 text-xs font-semibold"
        >
          Go Back
        </button>
      </div>
    );
  }

  const { report, visits = [], treatments = [] } = data;

  let symptoms = [];
  try {
    symptoms = typeof report.symptoms === 'string' ? JSON.parse(report.symptoms) : (report.symptoms || []);
  } catch (e) {
    symptoms = [];
  }

  const isHighRisk = report.risk_level === 'High';
  const isVet = role === 'vet' || role === 'authority';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Cases</span>
        </button>

        {/* Human-in-the-loop Tag */}
        <span className="inline-flex items-center gap-1 text-xs font-bold text-navy bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
          <Sparkles size={13} className="text-navy-light" />
          AI-assisted, vet-verified
        </span>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-emerald-700 text-xs">Dismiss</button>
        </div>
      )}

      {/* HEADER: COW – Case #0036 recreation */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-navy-dark uppercase tracking-tight">
              {report.species} – {report.report_number}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Registered on {new Date(report.created_at).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short'
              })}
            </p>
          </div>

          {/* Badges: High Risk Pill + Visit Scheduled Pill */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Risk Pill */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                isHighRisk
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : report.risk_level === 'Medium'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-green-100 text-green-800 border border-green-300'
              }`}
            >
              {report.risk_level} Risk
            </span>

            {/* Status Pill */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-black ${
                report.status === 'Visit Scheduled'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : report.status === 'In Treatment'
                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                  : report.status === 'Resolved'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-100 text-slate-800 border border-slate-200'
              }`}
            >
              {report.status}
            </span>
          </div>
        </div>

        {/* RED BANNER: EXACT MATCH */}
        {isHighRisk && (
          <div className="mt-4 p-4 rounded-xl bg-red-600 text-white shadow-xs flex items-start gap-3">
            <AlertTriangle size={20} className="shrink-0 text-white mt-0.5" />
            <div className="text-xs sm:text-sm font-bold leading-relaxed">
              Risk Assessment: High — Urgent veterinary attention is recommended for this case. High-risk case requires priority veterinary action.
            </div>
          </div>
        )}
      </div>

      {/* Case Lifecycle Stepper with Escalate Button */}
      <CaseLifecycleStepper
        currentStatus={report.status}
        isEscalated={report.is_escalated}
        onEscalate={handleEscalate}
        onStatusChange={handleStatusChange}
        isVet={isVet}
      />

      {/* INFO GRID: Exact recreation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Animal details card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Animal Profile
          </div>
          <div className="text-sm font-semibold text-slate-800">
            <span className="capitalize">{report.species}</span>
            {report.age ? `, Age ${Math.round(report.age)} years` : ''}
          </div>
          {report.animal_breed && (
            <div className="text-xs text-slate-500">
              <span className="font-medium text-slate-700">Breed: </span>
              {report.animal_breed}
            </div>
          )}
          {report.animal_tag && (
            <div className="text-xs text-slate-500">
              <span className="font-medium text-slate-700">Herd Tag: </span>
              {report.animal_tag}
            </div>
          )}
          <div>
            <span className="text-xs text-slate-500 font-medium">Vaccination Status: </span>
            <span
              className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${
                report.vaccination_status === 'Vaccinated'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {report.vaccination_status || 'Vaccinated'}
            </span>
          </div>
        </div>

        {/* Symptoms & Duration card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Reported Symptoms
          </div>
          <div className="flex flex-wrap gap-1.5">
            {symptoms.map((sym, sIdx) => (
              <span
                key={sIdx}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold"
              >
                {sym.replace('_', ' ')}
              </span>
            ))}
          </div>
          <div className="text-xs text-slate-500 pt-1">
            <span className="font-medium text-slate-700">Duration: </span>
            {report.duration_days} day{report.duration_days > 1 ? 's' : ''}
          </div>
        </div>

        {/* Location Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <MapPin size={13} className="text-red-500" />
            Location
          </div>
          <div className="text-sm font-semibold text-slate-800">
            {report.village ? `${report.village}, ${report.district || 'Ludhiana'}` : 'Location not available'}
          </div>
          {report.latitude && report.longitude && (
            <div className="text-xs text-slate-400 font-mono">
              GPS: {report.latitude.toFixed(4)}° N, {report.longitude.toFixed(4)}° E
            </div>
          )}
          {report.owner_name && (
            <div className="text-xs text-slate-500 pt-1 border-t border-slate-100 flex items-center gap-1.5">
              <User size={13} className="text-slate-400" />
              <span>Owner: <strong className="text-slate-700">{report.owner_name}</strong> ({report.owner_phone || '+91 98765 43210'})</span>
            </div>
          )}
        </div>

        {/* Weather Context Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <CloudSun size={13} className="text-amber-500" />
            Environmental Weather Context
          </div>
          <div className="text-sm font-semibold text-slate-800 capitalize">
            {report.weather_temp || 33}°C — {report.weather_description || 'Clear Sky'}
          </div>
          <div className="text-xs text-slate-500">
            Humidity: {report.weather_humidity || 62}% | Wind: {report.weather_wind_speed || 12} km/h
          </div>
          <div className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-100">
            Environmental baseline snapshot recorded at time of report.
          </div>
        </div>
      </div>

      {/* AI Clinical Reasoning Details */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Sparkles size={14} className="text-navy" />
          AI Risk Engine Analysis (Random Forest + Clinical Fusion)
        </h3>
        <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
          {report.ai_reason}
        </p>
      </div>

      {/* Emergency Veterinary Tele-Consultation & 1962 Ambulance Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-navy flex items-center gap-2">
              <PhoneCall size={16} className="text-emerald-600" />
              <span>Direct Tele-Consultation with Nearby Doctors (तुरंत डॉक्टर से परामर्श लें)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Need immediate clinical advice for Case {report.report_number}? Connect instantly via voice or video call.
            </p>
          </div>

          {/* 1962 Ambulance Dispatch Button */}
          <button
            type="button"
            onClick={() => setIsAmbulanceOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <Truck size={15} />
            <span>🚑 Track 1962 Pashu Ambulance</span>
          </button>
        </div>

        {/* Nearby Doctors Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {NEARBY_VETS.slice(0, 3).map(vet => (
            <div key={vet.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 flex flex-col justify-between">
              <div className="flex items-center gap-2.5">
                <img src={vet.avatar} alt={vet.name} className="w-10 h-10 rounded-full object-cover border" />
                <div className="min-w-0">
                  <strong className="block text-xs text-navy font-bold truncate">{vet.name}</strong>
                  <span className="text-[11px] text-slate-500 block truncate">{vet.clinic} • {vet.distanceKm} km</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-slate-200/80">
                <span className="text-slate-600 font-medium">Voice: {vet.charges.voiceCall === 0 ? 'FREE' : `₹${vet.charges.voiceCall}`}</span>
                <span className="text-teal-700 font-bold">Video: {vet.charges.videoCall === 0 ? 'FREE' : `₹${vet.charges.videoCall}`}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveVoiceVet(vet)}
                  className="py-1.5 px-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold text-[11px] text-slate-700 flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                >
                  <Phone size={12} className="text-emerald-600" /> Call
                </button>
                <button
                  type="button"
                  onClick={() => setActiveVideoVet(vet)}
                  className="py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                >
                  <Video size={12} /> Video Call
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vet Actions Panel (Visits and Treatments) */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-base font-bold text-navy-dark">
              Veterinary Clinical Interventions & Visits
            </h3>
            <p className="text-xs text-slate-500">
              Official medical record timeline for visits and prescribed medication.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVisitModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Calendar size={14} />
              <span>Schedule Visit</span>
            </button>
            <button
              onClick={() => setShowTreatmentModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Stethoscope size={14} />
              <span>Give Treatment</span>
            </button>
          </div>
        </div>

        {/* Scheduled Visits List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Scheduled Visits ({visits.length})
          </h4>
          {visits.length === 0 ? (
            <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-400 text-center">
              No on-site visits scheduled yet.
            </div>
          ) : (
            visits.map((v) => (
              <div key={v.id} className="p-4 rounded-xl bg-white border border-blue-200/80 shadow-2xs space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <div className="flex items-center gap-1.5 text-blue-700">
                    <Calendar size={14} />
                    <span>Date: {v.scheduled_date} at {v.scheduled_time || '10:00 AM'}</span>
                  </div>
                  <span className="capitalize px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px]">
                    {v.status}
                  </span>
                </div>
                {v.notes && <p className="text-slate-600 mt-1">{v.notes}</p>}
                {v.vet_name && <p className="text-[11px] text-slate-400">Assigned Vet: {v.vet_name}</p>}
              </div>
            ))
          )}
        </div>

        {/* Prescribed Treatments List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Medical Treatments & Diagnoses ({treatments.length})
          </h4>
          {treatments.length === 0 ? (
            <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-400 text-center">
              No clinical treatments logged yet.
            </div>
          ) : (
            treatments.map((tr) => (
              <div key={tr.id} className="p-4 rounded-xl bg-white border border-emerald-200/80 shadow-2xs space-y-2 text-xs">
                <div className="font-bold text-emerald-900 text-sm">
                  Diagnosis: {tr.diagnosis}
                </div>
                {tr.prescribed_medicines && (
                  <div>
                    <span className="font-semibold text-slate-700">Rx Medicines: </span>
                    <span className="text-slate-600">{tr.prescribed_medicines}</span>
                  </div>
                )}
                {tr.dosage_instructions && (
                  <div>
                    <span className="font-semibold text-slate-700">Dosage: </span>
                    <span className="text-slate-600">{tr.dosage_instructions}</span>
                  </div>
                )}
                {tr.notes && (
                  <p className="text-slate-500 italic border-t pt-1 border-slate-100">{tr.notes}</p>
                )}
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Prescribed by: {tr.vet_name || 'Attending Officer'}</span>
                  {tr.follow_up_date && <span>Follow-up: {tr.follow_up_date}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Schedule Visit Modal */}
      {showVisitModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-navy-dark">
              Schedule Veterinary Visit
            </h3>
            <form onSubmit={handleScheduleVisit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={visitForm.scheduled_date}
                  onChange={(e) => setVisitForm({ ...visitForm, scheduled_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Time</label>
                <input
                  type="text"
                  placeholder="e.g. 10:30 AM"
                  value={visitForm.scheduled_time}
                  onChange={(e) => setVisitForm({ ...visitForm, scheduled_time: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Visit Mission / Notes</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Urgent mobile veterinary unit dispatched for vesicular lesions assessment and ring vaccination protocol."
                  value={visitForm.notes}
                  onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowVisitModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 text-white font-bold"
                >
                  Confirm Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Give Treatment Modal */}
      {showTreatmentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-navy-dark">
              Prescribe Veterinary Treatment
            </h3>
            <form onSubmit={handleAddTreatment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Diagnosis *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Foot and Mouth Disease (FMD) with secondary bacterial stomatitis"
                  value={treatmentForm.diagnosis}
                  onChange={(e) => setTreatmentForm({ ...treatmentForm, diagnosis: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Prescribed Medicines</label>
                <input
                  type="text"
                  placeholder="e.g. Boro-glycerine oral paint, Flunixin Meglumine, Enrofloxacin 10%"
                  value={treatmentForm.prescribed_medicines}
                  onChange={(e) => setTreatmentForm({ ...treatmentForm, prescribed_medicines: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Dosage Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Oral paint twice daily after KMNO4 mouth wash; 15ml IM for 3 days"
                  value={treatmentForm.dosage_instructions}
                  onChange={(e) => setTreatmentForm({ ...treatmentForm, dosage_instructions: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Biosecurity / Isolation Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Advise strict herd isolation, sodium carbonate footbath, isolate milk"
                  value={treatmentForm.notes}
                  onChange={(e) => setTreatmentForm({ ...treatmentForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowTreatmentModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 text-white font-bold"
                >
                  Record Treatment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Voice Call Modal */}
      {activeVoiceVet && (
        <VoiceCallModal
          vet={activeVoiceVet}
          caseNumber={report.report_number}
          animalDetails={{ species: report.species, age: report.age }}
          onClose={() => setActiveVoiceVet(null)}
        />
      )}

      {/* Video Call Modal */}
      {activeVideoVet && (
        <VideoCallModal
          vet={activeVideoVet}
          caseNumber={report.report_number}
          animalDetails={{ species: report.species, age: report.age }}
          onClose={() => setActiveVideoVet(null)}
        />
      )}

      {/* Ambulance Tracker Modal */}
      {isAmbulanceOpen && (
        <AmbulanceTrackerModal
          caseNumber={report.report_number}
          village={report.village || 'Samrala'}
          onClose={() => setIsAmbulanceOpen(false)}
        />
      )}
    </div>
  );
}
