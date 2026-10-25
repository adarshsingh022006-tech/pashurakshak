import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function VoiceCallModal({ vet, caseNumber, animalDetails, onClose }) {
  const [callState, setCallState] = useState('CALLING'); // 'CALLING', 'CONNECTED', 'ENDED'
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [activeSpeech, setActiveSpeech] = useState('Connecting to veterinary doctor network...');

  // State transitions: CALLING -> CONNECTED after 2.5s
  useEffect(() => {
    let callTimer;
    let durationInterval;

    if (callState === 'CALLING') {
      callTimer = setTimeout(() => {
        setCallState('CONNECTED');
        setActiveSpeech(`Namaste! Main ${vet?.name || 'Doctor'} bol raha hoon. Aapke case ${caseNumber || '#0036'} ki report maine dekhi. Batayein pashu ki abhi kya sthiti hai?`);
      }, 2500);
    }

    if (callState === 'CONNECTED') {
      durationInterval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      clearTimeout(callTimer);
      clearInterval(durationInterval);
    };
  }, [callState, vet, caseNumber]);

  // Dynamic doctor dialogue snippets over time
  useEffect(() => {
    if (callState !== 'CONNECTED') return;

    const dialogInterval = setInterval(() => {
      const messages = [
        `"Pashu ko turant baaki herd se kam se kam 20 meter door baandh dein (Quarantine)."`,
        `"Muh me jhaag ya lala ke liye 1% potassium permanganate (Lal Dawai) ya Neem ke gungune paani se wash karein."`,
        `"Pashu ko thanda saaf paani dein aur geela chara dein. Sukha chara chabane me dard hoga."`,
        `"Maine aapke case me emergency visit schedule request flag kar di hai."`
      ];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      setActiveSpeech(randomMsg);
    }, 7000);

    return () => clearInterval(dialogInterval);
  }, [callState]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setCallState('ENDED');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-3xl border border-slate-100">
        
        {/* Header Background Wave / Gradient */}
        <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-navy p-6 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="relative z-10 flex flex-col items-center">
            {/* Doctor Photo with Ringing Ripple */}
            <div className="relative my-3">
              {callState === 'CALLING' && (
                <>
                  <span className="absolute -inset-3 rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="absolute -inset-1.5 rounded-full bg-emerald-300 opacity-50 animate-pulse" />
                </>
              )}
              <img
                src={vet?.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300'}
                alt={vet?.name}
                className="relative w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <span className={`absolute bottom-0 right-1 w-5 h-5 rounded-full border-2 border-white ${
                vet?.isOnline ? 'bg-emerald-500' : 'bg-amber-500'
              }`} />
            </div>

            <h3 className="text-xl font-black text-white">{vet?.name}</h3>
            <p className="text-xs text-emerald-100 font-medium">{vet?.title}</p>
            <p className="text-[11px] text-teal-200 mt-0.5">{vet?.clinic}</p>

            {/* Status / Duration Pill */}
            <div className="mt-3 px-3 py-1 rounded-full bg-black/20 text-xs font-mono font-semibold tracking-wide flex items-center gap-1.5">
              {callState === 'CALLING' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Ringing Doctor... (कॉल कनेक्ट हो रही है)</span>
                </>
              )}
              {callState === 'CONNECTED' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-300">Connected • {formatTime(duration)}</span>
                </>
              )}
              {callState === 'ENDED' && (
                <span className="text-rose-300">Call Completed • Duration {formatTime(duration)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Body Section */}
        <div className="p-6 space-y-4">

          {/* Consultation Fee Badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <span className="text-slate-600 font-medium">Consultation Fee:</span>
            <span className="font-bold text-emerald-700">
              {vet?.charges?.voiceCall === 0 ? 'FREE (Govt 1962 Helpline)' : `₹${vet?.charges?.voiceCall || 99} / Consultation`}
            </span>
          </div>

          {/* Active Case Context */}
          {caseNumber && (
            <div className="text-xs text-slate-500 flex items-center justify-between border-b border-slate-100 pb-2">
              <span>Discussing Report: <strong className="text-navy">{caseNumber}</strong></span>
              <span className="capitalize">{animalDetails?.species || 'Cow'} (Age {animalDetails?.age || 3}y)</span>
            </div>
          )}

          {/* Connected State: Audio Waves + Doctor Voice Transcription */}
          {callState === 'CONNECTED' && (
            <div className="space-y-3">
              {/* Visual Audio Wave */}
              <div className="flex items-center justify-center gap-1 h-8">
                {[40, 75, 95, 60, 85, 100, 45, 90, 70, 50, 80, 65, 95, 40].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 bg-emerald-500 rounded-full animate-pulse"
                    style={{
                      height: `${h}%`,
                      animationDuration: `${0.4 + (i % 5) * 0.15}s`
                    }}
                  />
                ))}
              </div>

              {/* Real-time Advice Speech Box */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100/90 text-xs text-slate-700 leading-relaxed shadow-xs">
                <span className="font-bold text-emerald-900 block mb-1">
                  🩺 Doctor's Real-time Clinical Advice:
                </span>
                {activeSpeech}
              </div>
            </div>
          )}

          {/* Ended State: Prescription Summary */}
          {callState === 'ENDED' && (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                <CheckCircle2 size={16} className="text-blue-600" />
                <span>Call Prescription & Tele-Advice Logged</span>
              </div>
              <ul className="text-slate-600 space-y-1 pl-4 list-disc text-[11px]">
                <li>Strict biosecurity quarantine: 20 meters from other livestock.</li>
                <li>Clean water + neem decoction oral rinse prescribed.</li>
                <li>Case status automatically escalated to <strong>"Under Review"</strong> in doctor triage.</li>
              </ul>
            </div>
          )}

          {/* Call Controls Toolbar */}
          <div className="pt-2 flex items-center justify-center gap-4">
            {callState !== 'ENDED' ? (
              <>
                {/* Mute Button */}
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-3.5 rounded-full transition-all ${
                    isMuted
                      ? 'bg-amber-100 text-amber-700 border border-amber-300'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
                >
                  {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>

                {/* End Call Button */}
                <button
                  type="button"
                  onClick={handleEndCall}
                  className="px-6 py-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-transform active:scale-95"
                >
                  <PhoneOff size={20} />
                  <span>End Call (कॉल काटें)</span>
                </button>

                {/* Speaker Button */}
                <button
                  type="button"
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  className={`p-3.5 rounded-full transition-all ${
                    !isSpeakerOn
                      ? 'bg-amber-100 text-amber-700 border border-amber-300'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  title={isSpeakerOn ? 'Speaker On' : 'Speaker Off'}
                >
                  {isSpeakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-navy text-white font-bold text-sm hover:bg-navy-dark transition-all shadow-md"
              >
                Close & Return to Case (बंद करें)
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
