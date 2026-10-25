import React, { useState, useEffect, useRef } from 'react';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Camera, ShieldCheck, CheckCircle2, Stethoscope, AlertTriangle } from 'lucide-react';

export default function VideoCallModal({ vet, caseNumber, animalDetails, onClose }) {
  const [callState, setCallState] = useState('CONNECTING'); // 'CONNECTING', 'IN_CALL', 'ENDED'
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [hasCameraAccess, setHasCameraAccess] = useState(false);
  const [doctorDiagnosis, setDoctorDiagnosis] = useState('Doctor is inspecting live video stream of animal...');

  const localVideoRef = useRef(null);
  const streamRef = useRef(null);

  // Request browser camera stream for the farmer's live feed
  useEffect(() => {
    let localStream = null;
    navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
      .then(stream => {
        localStream = stream;
        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setHasCameraAccess(true);
      })
      .catch(err => {
        console.warn('Camera permission denied or camera unavailable, using virtual simulator view:', err.message);
        setHasCameraAccess(false);
      });

    // Auto-transition to IN_CALL after 2 seconds
    const timer = setTimeout(() => {
      setCallState('IN_CALL');
      setDoctorDiagnosis(`"Maine video feed me animal ko observe kiya. Muh ke aas-paas salivation aur pair me lameness clearly visible hai. Ye classic acute FMD episode lag raha hai."`);
    }, 2000);

    return () => {
      clearTimeout(timer);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Timer counter
  useEffect(() => {
    if (callState !== 'IN_CALL') return;
    const interval = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callState]);

  // Dynamic doctor diagnosis during call
  useEffect(() => {
    if (callState !== 'IN_CALL') return;

    const notes = [
      `"Camera thoda neeche pair (hoof) ki taraf karein... Haan, interdigital pouch me laal daane aur sujan dikh rahi hai."`,
      `"Main abhi system me emergency prescription generate kar raha hoon: Paracetamol + Meloxicam injection aur B-Complex."`,
      `"Gharelu upchaar ke liye: 200 gm Haldi + Ghee ka lep muh ke chhaalon par lagayein."`,
      `"Ghabrayein nahi, 1962 Mobile Veterinary Unit ko bhi aapke location par dispatch karwa rahe hain."`
    ];

    const noteInterval = setInterval(() => {
      const randomNote = notes[Math.floor(Math.random() * notes.length)];
      setDoctorDiagnosis(randomNote);
    }, 6500);

    return () => clearInterval(noteInterval);
  }, [callState]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setCallState('ENDED');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl h-[92vh] max-h-[750px] bg-slate-900 shadow-2xl rounded-3xl border border-slate-800 flex flex-col overflow-hidden text-white">

        {/* Top Header Bar */}
        <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={vet?.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300'}
                alt={vet?.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border border-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">{vet?.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {vet?.isGovt ? 'Govt. 1962 Specialist' : 'Verified Vet'}
                </span>
              </div>
              <p className="text-xs text-slate-400">{vet?.clinic} • {vet?.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {callState === 'IN_CALL' && (
              <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                LIVE {formatTime(duration)}
              </span>
            )}
            <span className="hidden sm:inline-block text-slate-400 text-xs">
              Fee: <strong className="text-emerald-400">{vet?.charges?.videoCall === 0 ? 'FREE (Govt)' : `₹${vet?.charges?.videoCall || 199}`}</strong>
            </span>
          </div>
        </div>

        {/* Main Video Stage Area */}
        <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
          
          {/* Doctor Video Stream (Main Screen) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Background Simulated Live Clinic / Doctor Video */}
            <img
              src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=80"
              alt="Veterinary Clinic Background"
              className="absolute inset-0 w-full h-full object-cover opacity-25 filter blur-xs"
            />

            {/* Doctor Center Active Presence */}
            <div className="relative z-10 flex flex-col items-center text-center p-6">
              <div className="relative mb-4">
                <img
                  src={vet?.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300'}
                  alt={vet?.name}
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-emerald-500 shadow-2xl"
                />
                <span className="absolute bottom-1 right-2 px-2.5 py-0.5 rounded-full bg-emerald-600 text-[11px] font-bold text-white shadow-md">
                  Dr. Speaking
                </span>
              </div>
              <h4 className="text-lg font-bold text-white">{vet?.name}</h4>
              <p className="text-xs text-emerald-300 font-medium">{vet?.title}</p>
            </div>
          </div>

          {/* Farmer's Picture-in-Picture (PIP) Feed */}
          <div className="absolute bottom-20 right-4 sm:bottom-20 sm:right-6 w-36 h-48 sm:w-48 sm:h-64 rounded-2xl overflow-hidden shadow-2xl border-2 border-emerald-400/80 bg-slate-900 z-20">
            {hasCameraAccess && !isVideoDisabled ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-b from-slate-800 to-slate-900">
                <Camera size={24} className="text-slate-400 mb-2" />
                <span className="text-[10px] text-slate-300 font-medium">Farmer Camera Feed</span>
                <span className="text-[9px] text-emerald-400 mt-1">Live Animal Inspection</span>
              </div>
            )}
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[9px] font-mono text-emerald-300">
              You (Farm Feed)
            </span>
          </div>

          {/* Real-time Subtitles / Doctor Video Advice Box */}
          <div className="absolute bottom-4 left-4 right-44 sm:right-56 z-20">
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md text-xs text-slate-200 shadow-lg">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                <Stethoscope size={14} /> Live Clinical Inspection Diagnosis:
              </span>
              <p className="line-clamp-3 text-[11px] sm:text-xs leading-relaxed text-slate-100">
                {doctorDiagnosis}
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Call Controls Toolbar */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3 z-30">
          <div className="text-xs text-slate-400">
            <span>Case: <strong className="text-white">{caseNumber || '#0036'}</strong></span>
            <span className="ml-2 text-slate-500">|</span>
            <span className="ml-2 capitalize">{animalDetails?.species || 'Cow'} ({animalDetails?.age || 3} yrs)</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Mic Toggle */}
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 rounded-full transition-all ${
                isMuted ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
              title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
            >
              {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Video Toggle */}
            <button
              type="button"
              onClick={() => setIsVideoDisabled(!isVideoDisabled)}
              className={`p-3 rounded-full transition-all ${
                isVideoDisabled ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
              title={isVideoDisabled ? 'Turn Video On' : 'Turn Video Off'}
            >
              {isVideoDisabled ? <VideoOff size={18} /> : <Video size={18} />}
            </button>

            {/* End Call Button */}
            <button
              type="button"
              onClick={handleEndCall}
              className="px-5 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-transform active:scale-95"
            >
              <PhoneOff size={18} />
              <span>End Consultation (कॉल समाप्त करें)</span>
            </button>
          </div>
        </div>

        {/* Call Ended Post-Consultation Overlay */}
        {callState === 'ENDED' && (
          <div className="absolute inset-0 bg-slate-950/95 z-50 flex items-center justify-center p-6 animate-fade-in">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 text-slate-800 shadow-2xl space-y-4">
              <div className="text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-black text-navy">Video Tele-Consultation Completed</h3>
                <p className="text-xs text-slate-500">Duration: {formatTime(duration)} • {vet?.name}</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs space-y-2">
                <span className="font-bold text-emerald-900 block">🩺 Doctor's Digital Tele-Prescription Slip:</span>
                <p className="text-slate-700 leading-relaxed text-[11px]">
                  <strong>Primary Assessment:</strong> Acute Pyrexia with vesicular stomatitis / suspected FMD signs.<br />
                  <strong>Prescribed Action:</strong> Isolate animal in dry shed. Administer prescribed anti-inflammatory and oral spray. Emergency 1962 Mobile Veterinary Unit flagged.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-navy text-white font-bold text-sm hover:bg-navy-dark transition-all"
              >
                Close & Return (वापस जाएं)
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
