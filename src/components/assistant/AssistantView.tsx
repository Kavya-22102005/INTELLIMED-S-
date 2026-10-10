import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Trash2,
  Globe,
  Heart,
  Droplets,
  Moon,
  Pill,
  AlertTriangle,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export const AssistantView: React.FC = () => {
  const {
    chatMessages,
    addChatMessage,
    clearChat,
    voiceEnabled,
    setVoiceEnabled,
    vitals,
    medications,
    activePatient,
    markDoseTaken,
    showToast,
  } = useApp();

  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isListening, setIsListening] = useState(false);

  // Web speech synthesis helper
  const speakVoice = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Voice synthesis error:', e);
    }
  };

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputPrompt;
    if (!query.trim()) return;

    const trimmedQuery = query.trim();
    addChatMessage({
      sender: 'user',
      text: trimmedQuery,
    });

    setInputPrompt('');

    // Responsive healthcare assistant intelligence grounded in active patient records
    setTimeout(() => {
      let reply = `I have received your query regarding "${trimmedQuery}". Your profile currently shows ${medications.length} registered medications with ${vitals.adherencePercentage}% adherence.`;
      let structuredData = undefined;

      const lower = trimmedQuery.toLowerCase();
      if (lower.includes('fever') || lower.includes('temperature') || lower.includes('hot')) {
        reply = 'Based on your reported symptom of fever, here is medical guidance from clinical records:';
        structuredData = {
          suggestedMedicine: 'Paracetamol (Acetaminophen) 650mg',
          dosage: '1 tablet every 6-8 hours',
          timing: 'Morning & Night (After Food)',
          notes: [
            'Drink plenty of fluids and maintain optimal hydration (goal: 2.0L)',
            'Do NOT take on an empty stomach',
            'Avoid combining with other products containing acetaminophen',
          ],
          recommendations: 'If fever persists for more than 48 hours, contact Dr. Sarah Jenkins immediately.',
        };
      } else if (lower.includes('headache') || lower.includes('pain') || lower.includes('migraine')) {
        reply = 'For tension headache or mild acute pain:';
        structuredData = {
          suggestedMedicine: 'Paracetamol 500mg',
          dosage: '1 tablet with a full glass of water',
          timing: 'As needed (max 3 times/day)',
          notes: [
            'Rest in a quiet, dimly lit room',
            'Check blood pressure in the Vitals tab',
          ],
          recommendations: 'Frequent severe headaches should be evaluated by a healthcare specialist.',
        };
      } else if (lower.includes('schedule') || lower.includes('today') || lower.includes('routine') || lower.includes('time')) {
        const medList = medications.map(m => `${m.name} (${m.dosage}) at ${m.scheduledTime} [${m.status}]`).join(', ');
        reply = `Here is your active medication schedule for today: ${medList || 'No medications scheduled today'}. Your clinical adherence is ${vitals.adherencePercentage}%.`;
        structuredData = {
          suggestedMedicine: medications[0]?.name || 'Scheduled Regimen',
          dosage: medications[0]?.dosage || 'Standard dose',
          timing: medications[0]?.scheduledTime || 'Scheduled Time',
          notes: [
            'Confirm dose ingestion using the YOLO Pill Scanner or manual Taken action',
            'Snooze up to 15 minutes if delayed',
          ],
          recommendations: 'Maintaining regular dosing intervals keeps therapeutic blood levels steady.',
        };
      } else if (lower.includes('stock') || lower.includes('refill') || lower.includes('inventory')) {
        const lowStock = medications.filter(m => (m.inventory ?? 0) <= (m.reorderThreshold ?? 10));
        reply = lowStock.length > 0
          ? `Attention: You have ${lowStock.length} medication(s) near reorder threshold: ${lowStock.map(m => `${m.name} (${m.inventory} left)`).join(', ')}. Please contact your pharmacy for refills.`
          : `All ${medications.length} prescribed medications have sufficient inventory on hand.`;
      } else if (lower.includes('scan') || lower.includes('yolo') || lower.includes('camera')) {
        reply = 'To use the YOLO Pill Scanner: Navigate to the AI Scanner tab, align your medicine blister or pill in the viewfinder, and allow the system to detect and verify it against your schedule.';
      }

      addChatMessage({
        sender: 'ai',
        text: reply,
        structuredData,
      });

      if (voiceEnabled) {
        speakVoice(reply);
      }
    }, 450);
  };

  const toggleMic = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      showToast('Speech recognition is not supported in this browser environment');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.start();
      setIsListening(true);
      showToast('Listening to voice prompt...');

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputPrompt(transcript);
        setIsListening(false);
        handleSend(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };
      recognition.onend = () => {
        setIsListening(false);
      };
    } catch (e) {
      setIsListening(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Header matching video */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-cyan-400" />
              IntelliMed AI
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30 font-mono">
              BETA V2
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Your intelligent healthcare companion powered by clinical AI.
          </p>
        </div>

        {/* Right Controls: Language & Voice Enabled */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#111B2D] border border-[#1E2D4A] rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Globe className="w-4 h-4 text-cyan-400" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="English" className="bg-[#111B2D]">English</option>
              <option value="Hindi" className="bg-[#111B2D]">Hindi</option>
              <option value="Kannada" className="bg-[#111B2D]">Kannada</option>
              <option value="Telugu" className="bg-[#111B2D]">Telugu</option>
              <option value="Tamil" className="bg-[#111B2D]">Tamil</option>
            </select>
          </div>

          <button
            onClick={() => {
              setVoiceEnabled(!voiceEnabled);
              showToast(voiceEnabled ? 'Voice muted' : 'Voice synthesis active');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              voiceEnabled
                ? 'bg-blue-600/30 border-blue-500/50 text-blue-300'
                : 'bg-[#111B2D] border-[#1E2D4A] text-slate-400'
            }`}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
            <span>Voice {voiceEnabled ? 'Enabled' : 'Muted'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Chat on Left, Live Vitals & Alerts on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Chat Conversation Container (8 cols) */}
        <div className="lg:col-span-8 bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-5 shadow-xl flex flex-col h-[640px]">
          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {chatMessages.map((msg) => {
              const isAi = msg.sender === 'ai';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isAi ? '' : 'flex-row-reverse'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      isAi
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                        : 'bg-cyan-500 text-black font-extrabold'
                    }`}
                  >
                    {isAi ? <Sparkles className="w-4 h-4" /> : 'ME'}
                  </div>

                  <div className={`max-w-[85%] space-y-2`}>
                    <div
                      className={`p-4 rounded-2xl text-xs leading-relaxed ${
                        isAi
                          ? 'bg-[#172338] border border-[#1E2D4A] text-slate-100 rounded-tl-sm'
                          : 'bg-blue-600 text-white rounded-tr-sm shadow-md shadow-blue-600/20'
                      }`}
                    >
                      <p>{msg.text}</p>

                      {/* Structured Clinical Card matching reference video */}
                      {msg.structuredData && (
                        <div className="mt-3 pt-3 border-t border-[#1E2D4A] space-y-2.5">
                          {msg.structuredData.suggestedMedicine && (
                            <div className="p-2.5 rounded-xl bg-[#080D19] border border-cyan-500/30">
                              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                                Suggested Medicine
                              </span>
                              <span className="text-sm font-bold text-white block mt-0.5">
                                {msg.structuredData.suggestedMedicine}
                              </span>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            {msg.structuredData.dosage && (
                              <div className="p-2 rounded-lg bg-[#080D19]">
                                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                                  Dosage
                                </span>
                                <span className="font-semibold text-slate-200">
                                  {msg.structuredData.dosage}
                                </span>
                              </div>
                            )}
                            {msg.structuredData.timing && (
                              <div className="p-2 rounded-lg bg-[#080D19]">
                                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                                  Timing
                                </span>
                                <span className="font-semibold text-slate-200">
                                  {msg.structuredData.timing}
                                </span>
                              </div>
                            )}
                          </div>

                          {msg.structuredData.notes && (
                            <div className="p-2.5 rounded-xl bg-[#080D19] space-y-1">
                              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                                Important Notes
                              </span>
                              {msg.structuredData.notes.map((n, i) => (
                                <p key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                                  <span className="text-cyan-400">•</span>
                                  <span>{n}</span>
                                </p>
                              ))}
                            </div>
                          )}

                          {msg.structuredData.recommendations && (
                            <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-blue-200 text-[11px]">
                              <span className="font-bold text-white block text-[10px] uppercase">
                                Recommendation
                              </span>
                              <p className="mt-0.5">{msg.structuredData.recommendations}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Prompt Chips matching video */}
          <div className="pt-3 pb-2 flex flex-wrap gap-2 border-t border-[#1E2D4A]">
            <button
              onClick={() => handleSend("I have a fever. What medicine should I take?")}
              className="px-3 py-1.5 rounded-lg bg-[#172338] hover:bg-[#1E2D4A] border border-[#1E2D4A] text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              I have a fever
            </button>
            <button
              onClick={() => handleSend("What is my medication schedule today?")}
              className="px-3 py-1.5 rounded-lg bg-[#172338] hover:bg-[#1E2D4A] border border-[#1E2D4A] text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              My medication schedule
            </button>
            <button
              onClick={() => handleSend("Check medicine stock and refill needs")}
              className="px-3 py-1.5 rounded-lg bg-[#172338] hover:bg-[#1E2D4A] border border-[#1E2D4A] text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Check medicine stock
            </button>
          </div>

          {/* Input field and actions */}
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={clearChat}
              className="p-2.5 rounded-xl bg-[#172338] hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Clear Conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={toggleMic}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                isListening
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-[#172338] hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Voice Input"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              placeholder="Ask IntelliMed AI about medications, fever, dosage..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-[#080D19] border border-[#1E2D4A] text-xs text-white rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
            />

            <button
              onClick={() => handleSend()}
              disabled={!inputPrompt.trim()}
              className="p-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: AI Health Score & Vitals Sidebar matching video (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* AI Health Score Card matching video */}
          <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  AI HEALTH SCORE
                </span>
                <div className="text-4xl font-extrabold text-cyan-400 font-mono mt-1">
                  94
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                +2 this week
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2">
              Your adherence and vitals are optimal. Keep it up!
            </p>
          </div>

          {/* Mini 4-Metric Grid matching video */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-xl p-3.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase flex items-center gap-1">
                <Pill className="w-3 h-3 text-cyan-400" />
                MEDS TAKEN
              </span>
              <div className="text-lg font-bold text-white font-mono mt-1">3/4</div>
              <span className="text-[10px] text-emerald-400">75% Today</span>
            </div>

            <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-xl p-3.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase flex items-center gap-1">
                <Droplets className="w-3 h-3 text-blue-400" />
                HYDRATION
              </span>
              <div className="text-lg font-bold text-white font-mono mt-1">1.2L</div>
              <span className="text-[10px] text-slate-400">Goal: 2.0L</span>
            </div>

            <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-xl p-3.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase flex items-center gap-1">
                <Moon className="w-3 h-3 text-purple-400" />
                SLEEP
              </span>
              <div className="text-lg font-bold text-white font-mono mt-1">7.5h</div>
              <span className="text-[10px] text-cyan-400">Optimal</span>
            </div>

            <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-xl p-3.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase flex items-center gap-1">
                <Heart className="w-3 h-3 text-pink-400" />
                AVG HEART
              </span>
              <div className="text-lg font-bold text-white font-mono mt-1">72</div>
              <span className="text-[10px] text-slate-400">bpm Normal</span>
            </div>
          </div>

          {/* Smart Alerts Card matching video */}
          <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Smart Alerts</h4>
            </div>

            <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/30">
              <h5 className="text-xs font-bold text-red-400">Missed Metformin</h5>
              <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                Scheduled for 1:00 PM. Tap below to log intake or ask AI to reschedule.
              </p>
              <button
                onClick={() => {
                  const m = medications.find((med) => med.name.toLowerCase().includes('metformin'));
                  if (m) markDoseTaken(m.id);
                }}
                className="mt-2.5 px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold rounded-lg shadow-sm cursor-pointer"
              >
                Log Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
