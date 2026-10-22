import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle, Sparkles, Check } from 'lucide-react';
import api from '../services/api';

export default function VoiceRecorder({ onSymptomsDetected, onNotesAppended, currentLanguage = 'en' }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceLang, setVoiceLang] = useState('hi-IN'); // default to Hindi/English for Indian farmers
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
      transcriptRef.current = currentTranscript;
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (transcriptRef.current && transcriptRef.current.trim().length > 0) {
        handleParseTranscript(transcriptRef.current);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [voiceLang]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      if (transcript) {
        handleParseTranscript(transcript);
      }
    } else {
      setTranscript('');
      recognitionRef.current.lang = voiceLang;
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Recognition start failed:', e);
      }
    }
  };

  const handleParseTranscript = async (text) => {
    if (!text || text.trim().length === 0) return;
    setIsProcessing(true);
    try {
      const res = await api.post('/voice/parse', {
        transcript: text,
        language: voiceLang
      });

      if (res.data.detectedSymptoms && res.data.detectedSymptoms.length > 0) {
        onSymptomsDetected(res.data.detectedSymptoms);
      }
      if (onNotesAppended) {
        onNotesAppended(text);
      }
    } catch (e) {
      console.error('Failed to parse voice symptoms on backend:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <Sparkles size={14} className="text-amber-500" />
            AI Voice Symptom Dictation
          </span>
          <span className="text-[11px] text-slate-500">
            (Speech-to-Text)
          </span>
        </div>

        {/* Voice Recognition Language Selector */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-500">Voice Language:</span>
          <select
            value={voiceLang}
            onChange={(e) => setVoiceLang(e.target.value)}
            disabled={isListening}
            className="bg-white border border-slate-200 rounded-md px-2 py-0.5 text-xs text-slate-700 font-medium focus:outline-none"
          >
            <option value="hi-IN">हिन्दी (Hindi)</option>
            <option value="pa-IN">ਪੰਜਾਬੀ (Punjabi)</option>
            <option value="en-IN">English (India)</option>
          </select>
        </div>
      </div>

      {!speechSupported ? (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 text-amber-800 text-xs border border-amber-200">
          <AlertCircle size={16} className="shrink-0 text-amber-600" />
          <span>
            Browser speech recognition is not supported in this browser. You can type keywords like "bukhar", "khansi", or "salivation" in notes below.
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleListening}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs ${
              isListening
                ? 'bg-red-600 text-white animate-pulse shadow-red-200 shadow-md ring-2 ring-red-400'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isListening ? (
              <>
                <MicOff size={16} />
                <span>Stop Listening</span>
              </>
            ) : (
              <>
                <Mic size={16} />
                <span>Start Speaking Symptoms</span>
              </>
            )}
          </button>

          {isListening && (
            <div className="flex items-center gap-2 text-xs text-red-600 font-medium animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
              <span>Listening in {voiceLang.split('-')[0].toUpperCase()}... (e.g. "gai ko bukhar hai aur laar tapak rahi hai")</span>
            </div>
          )}

          {isProcessing && (
            <span className="text-xs text-slate-500 italic">Analyzing voice keywords...</span>
          )}
        </div>
      )}

      {transcript && (
        <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700">
          <span className="font-semibold text-slate-900">Transcribed: </span>
          <span className="italic">"{transcript}"</span>
          {!isListening && (
            <button
              type="button"
              onClick={() => handleParseTranscript(transcript)}
              className="ml-3 text-[11px] text-emerald-700 font-semibold underline hover:text-emerald-900"
            >
              Parse Symptoms Again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
