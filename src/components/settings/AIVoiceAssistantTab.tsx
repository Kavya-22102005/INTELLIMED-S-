import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Square,
  RotateCcw,
  Sparkles,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Bot,
  Copy,
  Check,
  Languages,
  Sliders,
  RefreshCw,
  HelpCircle,
  Activity,
  Pill,
} from 'lucide-react';
import {
  VoiceAssistantMessage,
  VoiceSettings,
  speakText,
  stopSpeaking,
  queryVoiceAssistant,
} from '../../services/voiceAssistantService';

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
      isFinal: boolean;
      length: number;
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

export const AIVoiceAssistantTab: React.FC = () => {
  const { medications, vitals, activePatient, caregivers, showToast } = useApp();

  // Voice Synthesis Configuration
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    const saved = localStorage.getItem('intellimed_voice_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      language: 'English',
      persona: 'Female',
      speed: 'Normal',
      autoSpeak: true,
    };
  });

  // Assistant Interaction States
  // 'idle' | 'listening' | 'processing' | 'speaking' | 'error'
  const [assistantState, setAssistantState] = useState<
    'idle' | 'listening' | 'processing' | 'speaking' | 'error'
  >('idle');

  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null);

  // Conversation history
  const [conversation, setConversation] = useState<VoiceAssistantMessage[]>(() => {
    const saved = localStorage.getItem('intellimed_voice_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [
      {
        id: 'msg-welcome',
        sender: 'assistant',
        text: `Hello ${activePatient?.name || 'there'}! I am your IntelliMed AI Voice Assistant. You can click the microphone button below or type a query to ask about your medication schedule, adherence, dosages, stock, or health advice.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'delivered',
      },
    ];
  });

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('intellimed_voice_history', JSON.stringify(conversation));
  }, [conversation]);

  // Save voice settings to localStorage
  useEffect(() => {
    localStorage.setItem('intellimed_voice_settings', JSON.stringify(voiceSettings));
  }, [voiceSettings]);

  // Soundwave animation simulation
  const [waveHeights, setWaveHeights] = useState<number[]>([
    25, 45, 75, 60, 30, 85, 65, 40, 90, 35, 95, 50, 30, 75, 50, 65, 35, 80, 55, 40, 70, 45, 60, 30,
  ]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (assistantState === 'listening' || assistantState === 'speaking' || assistantState === 'processing') {
      interval = setInterval(() => {
        setWaveHeights((prev) =>
          prev.map(() => {
            if (assistantState === 'speaking') {
              return Math.floor(Math.random() * 80) + 20;
            }
            if (assistantState === 'listening') {
              return Math.floor(Math.random() * 60) + 30;
            }
            // Processing: subtle pulsing
            return Math.floor(Math.random() * 30) + 15;
          })
        );
      }, 120);
    } else {
      setWaveHeights([
        15, 20, 25, 20, 15, 20, 25, 20, 15, 20, 25, 20, 15, 20, 25, 20, 15, 20, 25, 20, 15, 20, 25, 15,
      ]);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [assistantState]);

  // Speech Recognition Reference
  const recognitionRef = useRef<any>(null);
  const isRecognizingRef = useRef(false);
  const isManualStopRef = useRef(false);
  const lastProcessedTranscriptRef = useRef<string>('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, interimTranscript, assistantState]);

  // Clean up speech recognition & speech synthesis on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Quick prompt suggestions
  const quickPrompts = [
    'What medicines do I need to take today?',
    'What is my adherence rate?',
    'Check my medication stock and refills',
    'Who is my primary caregiver?',
    'How do I use the YOLO pill scanner?',
  ];

  // Send message to Gemini Voice Assistant
  const handleSendMessage = async (textToSend: string) => {
    const cleanText = textToSend.trim();
    if (!cleanText) return;

    // Prevent duplicate submission of identical utterance
    if (lastProcessedTranscriptRef.current === cleanText && assistantState === 'processing') {
      return;
    }
    lastProcessedTranscriptRef.current = cleanText;

    const userMsgId = `usr-${Date.now()}`;
    const userMsg: VoiceAssistantMessage = {
      id: userMsgId,
      sender: 'user',
      text: cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };

    setConversation((prev) => [...prev, userMsg]);
    setTextInput('');
    setTranscript('');
    setInterimTranscript('');
    setErrorMessage(null);
    setAssistantState('processing');

    try {
      const patientContext = {
        name: activePatient?.name || 'Patient',
        age: activePatient?.age || 64,
        condition: activePatient?.diseases?.join(', ') || 'Hypertension, Type 2 Diabetes',
        allergies: activePatient?.allergies?.join(', ') || 'None reported',
        medications: medications.map((m) => ({
          name: m.name,
          dosage: m.dosage,
          scheduledTime: m.scheduledTime,
          status: m.status,
          inventory: m.inventory,
          reorderThreshold: m.reorderThreshold,
          instructions: m.instructions,
        })),
        vitals: {
          heartRate: vitals?.heartRate,
          bloodPressure: vitals ? `${vitals.bpSystolic}/${vitals.bpDiastolic}` : '120/80',
          adherencePercentage: vitals?.adherencePercentage,
          missedDoses: vitals?.missedDoses,
          aiHealthScore: vitals?.aiHealthScore,
          waterIntake: vitals?.hydrationLiters,
        },
        caregivers: caregivers.map((c) => ({
          name: c.name,
          role: c.role,
          phone: c.phone,
          email: c.email,
        })),
      };

      const aiReply = await queryVoiceAssistant(cleanText, conversation, patientContext);

      const aiMsgId = `ai-${Date.now()}`;
      const aiMsg: VoiceAssistantMessage = {
        id: aiMsgId,
        sender: 'assistant',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'delivered',
      };

      setConversation((prev) => [...prev, aiMsg]);

      // Speak reply if voice enabled and autoSpeak is true
      if (voiceSettings.autoSpeak) {
        speakResponse(aiReply, aiMsgId);
      } else {
        setAssistantState('idle');
      }
    } catch (err: any) {
      console.error('Voice Assistant Query Error:', err);
      const errText = err?.message || 'Unable to connect to AI Voice service. Please try again.';
      setErrorMessage(errText);
      setAssistantState('error');

      const errorMsg: VoiceAssistantMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `Error: ${errText}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'error',
        errorMessage: errText,
      };

      setConversation((prev) => [...prev, errorMsg]);
      showToast(`Assistant Error: ${errText}`);
    }
  };

  // Speak AI Response
  const speakResponse = (text: string, messageId: string) => {
    setActiveSpeakingId(messageId);
    setAssistantState('speaking');

    speakText(
      text,
      voiceSettings,
      () => {
        setAssistantState('speaking');
      },
      () => {
        setAssistantState('idle');
        setActiveSpeakingId(null);
      },
      (err) => {
        console.warn('Speech synthesis ended with error:', err);
        setAssistantState('idle');
        setActiveSpeakingId(null);
      }
    );
  };

  // Stop currently speaking audio
  const handleStopSpeaking = () => {
    stopSpeaking();
    setAssistantState('idle');
    setActiveSpeakingId(null);
    showToast('Voice playback stopped');
  };

  // Start Speech Recognition
  const handleStartListening = async () => {
    // If currently speaking, stop it first
    if (assistantState === 'speaking') {
      handleStopSpeaking();
    }

    // Check if browser supports speech recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage(
        'Speech recognition is not supported in this browser. Please use Chrome, Edge, or enter your question using text.'
      );
      setAssistantState('error');
      showToast('Speech recognition not supported in this browser');
      return;
    }

    try {
      // Explicitly request microphone access
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (permErr: any) {
          console.warn('Microphone permission request error:', permErr);
          setErrorMessage(
            'Microphone access was denied or is blocked. Please allow microphone permissions in your browser settings to speak to the assistant.'
          );
          setAssistantState('error');
          showToast('Microphone permission denied');
          return;
        }
      }

      // Stop existing recognition if active
      if (recognitionRef.current && isRecognizingRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      // Map language
      const langMap: Record<string, string> = {
        English: 'en-US',
        Hindi: 'hi-IN',
        Tamil: 'ta-IN',
        Telugu: 'te-IN',
        Kannada: 'kn-IN',
        Malayalam: 'ml-IN',
      };
      recognition.lang = langMap[voiceSettings.language] || 'en-US';

      isManualStopRef.current = false;

      recognition.onstart = () => {
        isRecognizingRef.current = true;
        setAssistantState('listening');
        setTranscript('');
        setInterimTranscript('');
        setErrorMessage(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
        }

        if (final.trim()) {
          setTranscript(final.trim());
          setInterimTranscript('');
          // Final transcript captured; send to AI
          handleSendMessage(final.trim());
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn('SpeechRecognition error:', event.error, event.message);
        isRecognizingRef.current = false;

        if (event.error === 'no-speech') {
          // If no speech heard, return to idle without breaking
          setErrorMessage('No speech detected. Please try clicking the microphone and speaking again.');
          setAssistantState('idle');
          return;
        }

        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setErrorMessage(
            'Microphone permission was denied. Please allow microphone access in your browser address bar.'
          );
          setAssistantState('error');
          return;
        }

        if (event.error === 'network') {
          setErrorMessage('Network connection error during speech recognition. You can also type your query.');
          setAssistantState('error');
          return;
        }

        setErrorMessage(`Recognition error: ${event.error}`);
        setAssistantState('error');
      };

      recognition.onend = () => {
        isRecognizingRef.current = false;
        // If it stopped and we are still in listening state without final text, revert to idle
        if (assistantState === 'listening') {
          setAssistantState('idle');
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setErrorMessage(`Failed to start speech recognition: ${err?.message || 'Unknown error'}`);
      setAssistantState('error');
    }
  };

  // Stop listening manually
  const handleStopListening = () => {
    isManualStopRef.current = true;
    if (recognitionRef.current && isRecognizingRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    isRecognizingRef.current = false;
    setAssistantState('idle');

    if (interimTranscript.trim()) {
      handleSendMessage(interimTranscript.trim());
    }
  };

  // Copy message text helper
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('Message copied to clipboard');
  };

  // Clear conversation history
  const handleClearHistory = () => {
    const welcome: VoiceAssistantMessage = {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `Conversation cleared. I am ready to answer your questions regarding your medication regimen and vitals.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'delivered',
    };
    setConversation([welcome]);
    handleStopSpeaking();
    showToast('Conversation history reset');
  };

  // Preview voice test with current settings
  const handleTestVoiceAudio = () => {
    const testSample =
      voiceSettings.language === 'Hindi'
        ? 'नमस्ते, मैं आपकी इंटेलिजेंट मेडिकेशन सहायक हूँ। आपकी दवा समय पर लेने के लिए तैयार है।'
        : voiceSettings.language === 'Tamil'
        ? 'வணக்கம், நான் உங்கள் மருந்தியல் உதவியாளர். மருந்துகளை உரிய நேரத்தில் உட்கொள்ளுங்கள்.'
        : `Hello! I am your IntelliMed AI Voice Assistant configured in ${voiceSettings.language} with a ${voiceSettings.persona} persona at ${voiceSettings.speed} speed.`;

    setActiveSpeakingId('test-audio');
    setAssistantState('speaking');
    speakText(
      testSample,
      voiceSettings,
      () => setAssistantState('speaking'),
      () => {
        setAssistantState('idle');
        setActiveSpeakingId(null);
      },
      () => {
        setAssistantState('idle');
        setActiveSpeakingId(null);
      }
    );
    showToast(`Testing voice synthesis in ${voiceSettings.language}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header with Title and Mode status */}
      <div className="pb-4 border-b border-[#1E2D4A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-cyan-600/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">AI Voice Assistant</h3>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Gemini 3.8 Flash
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time conversational healthcare voice companion grounded in your actual medications, doses, and adherence.
          </p>
        </div>

        {/* Status Badge & Global Controls */}
        <div className="flex items-center gap-2">
          {/* Status badge */}
          {assistantState === 'listening' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>Listening... Speak Now</span>
            </div>
          )}

          {assistantState === 'processing' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Thinking with Gemini...</span>
            </div>
          )}

          {assistantState === 'speaking' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 animate-pulse">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Speaking Response...</span>
            </div>
          )}

          {assistantState === 'idle' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Ready</span>
            </div>
          )}

          {assistantState === 'error' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Needs Attention</span>
            </div>
          )}

          {/* Stop audio button if speaking */}
          {assistantState === 'speaking' && (
            <button
              onClick={handleStopSpeaking}
              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
              title="Stop speaking"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop</span>
            </button>
          )}

          {/* Reset chat button */}
          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-lg bg-[#172338] hover:bg-[#1E2D4A] border border-[#1E2D4A] text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Clear conversation history"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error notification banner if any */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{errorMessage}</p>
            <p className="text-[11px] text-rose-300/80 mt-0.5">
              You can grant microphone permission, retry speaking, or type your question below.
            </p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-200 text-xs font-bold underline cursor-pointer ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Interactive Stage: Soundwave & Dynamic Microphone */}
      <div className="bg-[#172338] border border-[#1E2D4A] rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-xl">
        {/* Ambient background glow depending on state */}
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
            assistantState === 'listening'
              ? 'opacity-30 bg-gradient-to-b from-cyan-500/20 via-transparent to-transparent'
              : assistantState === 'speaking'
              ? 'opacity-30 bg-gradient-to-b from-pink-500/20 via-transparent to-transparent'
              : assistantState === 'processing'
              ? 'opacity-25 bg-gradient-to-b from-purple-500/20 via-transparent to-transparent'
              : 'opacity-10 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent'
          }`}
        />

        {/* Central Dynamic Mic / Speaker Orb */}
        <div className="relative mb-5">
          {/* Animated concentric ripples when listening or speaking */}
          {(assistantState === 'listening' || assistantState === 'speaking') && (
            <>
              <div
                className={`absolute -inset-3 rounded-full animate-ping opacity-25 ${
                  assistantState === 'listening' ? 'bg-cyan-400' : 'bg-pink-400'
                }`}
              />
              <div
                className={`absolute -inset-6 rounded-full opacity-15 animate-pulse ${
                  assistantState === 'listening' ? 'bg-cyan-500' : 'bg-pink-500'
                }`}
              />
            </>
          )}

          <button
            onClick={() => {
              if (assistantState === 'listening') {
                handleStopListening();
              } else if (assistantState === 'speaking') {
                handleStopSpeaking();
              } else {
                handleStartListening();
              }
            }}
            disabled={assistantState === 'processing'}
            className={`w-24 h-24 rounded-full border-2 flex items-center justify-center transition-all duration-300 cursor-pointer shadow-2xl relative z-10 ${
              assistantState === 'listening'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 scale-110 shadow-cyan-500/40'
                : assistantState === 'speaking'
                ? 'bg-pink-500/20 border-pink-400 text-pink-300 scale-105 shadow-pink-500/40 hover:bg-pink-500/30'
                : assistantState === 'processing'
                ? 'bg-purple-500/20 border-purple-400 text-purple-300 animate-pulse cursor-wait'
                : 'bg-[#111B2D] border-[#1E2D4A] text-slate-300 hover:border-cyan-400 hover:text-cyan-400 hover:scale-105'
            }`}
            title={
              assistantState === 'listening'
                ? 'Click to stop listening'
                : assistantState === 'speaking'
                ? 'Click to stop speaking'
                : 'Click to speak to the Assistant'
            }
          >
            {assistantState === 'listening' ? (
              <Mic className="w-10 h-10 animate-pulse text-cyan-300" />
            ) : assistantState === 'speaking' ? (
              <Square className="w-9 h-9 fill-current text-pink-400" />
            ) : assistantState === 'processing' ? (
              <RefreshCw className="w-9 h-9 animate-spin text-purple-400" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
          </button>
        </div>

        {/* Dynamic Soundwave Bars */}
        <div className="flex items-center justify-center gap-1 sm:gap-1.5 my-3 h-10 w-full max-w-md px-4">
          {waveHeights.map((h, i) => (
            <div
              key={i}
              style={{ height: `${Math.max(12, h)}%` }}
              className={`flex-1 rounded-full transition-all duration-150 ${
                assistantState === 'listening'
                  ? 'bg-gradient-to-t from-cyan-600 to-blue-400 shadow-sm shadow-cyan-400/30'
                  : assistantState === 'speaking'
                  ? 'bg-gradient-to-t from-pink-600 to-amber-400 shadow-sm shadow-pink-400/30'
                  : assistantState === 'processing'
                  ? 'bg-gradient-to-t from-purple-600 to-indigo-400'
                  : 'bg-slate-700/60'
              }`}
            />
          ))}
        </div>

        {/* State Label & Guidance */}
        <div className="mt-2 space-y-1">
          <p className="text-sm font-bold text-white">
            {assistantState === 'listening'
              ? 'Listening to your voice...'
              : assistantState === 'processing'
              ? 'Formulating response from your health records...'
              : assistantState === 'speaking'
              ? 'Speaking response aloud (click center button to stop)'
              : 'Click microphone to converse in natural language'}
          </p>

          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {assistantState === 'listening'
              ? 'Say your query clearly into the microphone. We will automatically transcribe and answer.'
              : 'Ask: "What medicines do I need to take today?", "Is my adherence score good?", or "Check refills".'}
          </p>
        </div>

        {/* Interim Speech Transcription Box */}
        {(assistantState === 'listening' || interimTranscript || transcript) && (
          <div className="mt-4 w-full max-w-lg p-3 rounded-xl bg-[#111B2D]/80 border border-cyan-500/30 text-left animate-in fade-in">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                <Mic className="w-3 h-3" /> Live Transcript
              </span>
              {assistantState === 'listening' && (
                <span className="text-[10px] text-slate-400 animate-pulse">Capturing voice audio...</span>
              )}
            </div>
            <p className="text-xs text-slate-200 italic">
              "{interimTranscript || transcript || 'Listening for speech...'}"
            </p>
          </div>
        )}
      </div>

      {/* Voice Controls & Personalization Settings Row */}
      <div className="p-4 rounded-xl bg-[#172338] border border-[#1E2D4A] space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#1E2D4A]/60">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Voice Synthesis & Persona Settings
            </h4>
          </div>
          <button
            onClick={handleTestVoiceAudio}
            disabled={assistantState === 'speaking'}
            className="px-3 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Test Voice Audio</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Language Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Assistant Language
            </label>
            <select
              value={voiceSettings.language}
              onChange={(e) =>
                setVoiceSettings((prev) => ({ ...prev, language: e.target.value }))
              }
              className="w-full bg-[#111B2D] border border-[#1E2D4A] text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400"
            >
              <option value="English">English (en-US / en-IN)</option>
              <option value="Hindi">Hindi (हिन्दी - hi-IN)</option>
              <option value="Tamil">Tamil (தமிழ் - ta-IN)</option>
              <option value="Telugu">Telugu (తెలుగు - te-IN)</option>
              <option value="Kannada">Kannada (ಕನ್ನಡ - kn-IN)</option>
              <option value="Malayalam">Malayalam (മലയാളം - ml-IN)</option>
            </select>
          </div>

          {/* Voice Persona */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Voice Persona
            </label>
            <select
              value={voiceSettings.persona}
              onChange={(e) =>
                setVoiceSettings((prev) => ({
                  ...prev,
                  persona: e.target.value as 'Female' | 'Male',
                }))
              }
              className="w-full bg-[#111B2D] border border-[#1E2D4A] text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400"
            >
              <option value="Female">Female Persona</option>
              <option value="Male">Male Persona</option>
            </select>
          </div>

          {/* Speech Velocity */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Speech Velocity
            </label>
            <select
              value={voiceSettings.speed}
              onChange={(e) =>
                setVoiceSettings((prev) => ({
                  ...prev,
                  speed: e.target.value as 'Slow' | 'Normal' | 'Fast',
                }))
              }
              className="w-full bg-[#111B2D] border border-[#1E2D4A] text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400"
            >
              <option value="Slow">Slow (0.85x pacing)</option>
              <option value="Normal">Normal (1.0x)</option>
              <option value="Fast">Fast (1.25x)</option>
            </select>
          </div>

          {/* Auto Read-aloud Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Auto Read-Aloud
            </label>
            <button
              onClick={() =>
                setVoiceSettings((prev) => ({ ...prev, autoSpeak: !prev.autoSpeak }))
              }
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                voiceSettings.autoSpeak
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-[#111B2D] border-[#1E2D4A] text-slate-400'
              }`}
            >
              <span>{voiceSettings.autoSpeak ? 'Enabled' : 'Muted'}</span>
              {voiceSettings.autoSpeak ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          Frequently Spoken Queries
        </span>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={assistantState === 'processing'}
              className="px-3 py-1.5 rounded-xl bg-[#172338] hover:bg-[#1E2D4A] border border-[#1E2D4A] hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs transition-all cursor-pointer text-left shadow-sm"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>

      {/* Conversation History Thread */}
      <div className="bg-[#172338] border border-[#1E2D4A] rounded-2xl p-4 sm:p-5 flex flex-col h-[380px]">
        <div className="flex items-center justify-between pb-3 border-b border-[#1E2D4A] mb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Voice Conversation Log
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {conversation.length} interactions
            </span>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Grounded in patient records</span>
          </div>
        </div>

        {/* Scrollable messages container */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 custom-scrollbar">
          {conversation.map((msg) => {
            const isUser = msg.sender === 'user';
            const isSpeakingThis = activeSpeakingId === msg.id && assistantState === 'speaking';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-sm shadow-md'
                      : msg.status === 'error'
                      ? 'bg-rose-950/60 border border-rose-800/60 text-rose-200 rounded-tl-sm'
                      : 'bg-[#111B2D] border border-[#1E2D4A] text-slate-200 rounded-tl-sm shadow-md'
                  }`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-75">
                    <span className="font-bold flex items-center gap-1">
                      {isUser ? (
                        <>
                          <User className="w-2.5 h-2.5" />
                          <span>You (Spoken / Typed)</span>
                        </>
                      ) : (
                        <>
                          <Bot className="w-2.5 h-2.5 text-cyan-400" />
                          <span>IntelliMed Clinical Voice</span>
                        </>
                      )}
                    </span>
                    <span className="font-mono">{msg.timestamp}</span>
                  </div>

                  {/* Message Body */}
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                  {/* Assistant Actions: Replay voice, copy, stop */}
                  {!isUser && msg.status !== 'error' && (
                    <div className="mt-2.5 pt-2 border-t border-[#1E2D4A]/50 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (isSpeakingThis) {
                              handleStopSpeaking();
                            } else {
                              speakResponse(msg.text, msg.id);
                            }
                          }}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                            isSpeakingThis
                              ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                          }`}
                        >
                          {isSpeakingThis ? (
                            <>
                              <Square className="w-3 h-3 fill-current" />
                              <span>Stop Speech</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 fill-current" />
                              <span>Replay Audio</span>
                            </>
                          )}
                        </button>
                      </div>

                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Pending AI Generation Indicator */}
          {assistantState === 'processing' && (
            <div className="flex gap-3 text-xs justify-start animate-in fade-in">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-2xl rounded-tl-sm p-3.5 text-slate-300 flex items-center gap-2.5 shadow-md">
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span className="text-xs">Formulating voice response with Gemini AI...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Text Input Fallback Bar */}
        <div className="mt-3 pt-3 border-t border-[#1E2D4A]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (textInput.trim()) {
                handleSendMessage(textInput.trim());
              }
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={() => {
                if (assistantState === 'listening') {
                  handleStopListening();
                } else {
                  handleStartListening();
                }
              }}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                assistantState === 'listening'
                  ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
                  : 'bg-[#111B2D] border-[#1E2D4A] text-cyan-400 hover:border-cyan-400 hover:bg-cyan-500/10'
              }`}
              title={assistantState === 'listening' ? 'Stop listening' : 'Start microphone'}
            >
              <Mic className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Or type what you want to ask your AI voice assistant..."
              disabled={assistantState === 'processing'}
              className="flex-1 bg-[#111B2D] border border-[#1E2D4A] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />

            <button
              type="submit"
              disabled={!textInput.trim() || assistantState === 'processing'}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-cyan-600/30"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
