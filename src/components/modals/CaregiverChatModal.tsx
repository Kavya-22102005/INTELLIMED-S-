import React, { useState, useRef, useEffect } from 'react';
import { Caregiver } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  Send,
  MessageSquare,
  Check,
  CheckCheck,
  Clock,
  Trash2,
  Phone,
  ShieldCheck,
  Loader2,
  Sparkles,
  ArrowRightLeft,
  UserCheck,
} from 'lucide-react';

interface CaregiverChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  caregiver: Caregiver | null;
  onOpenCallModal?: () => void;
}

export const CaregiverChatModal: React.FC<CaregiverChatModalProps> = ({
  isOpen,
  onClose,
  caregiver,
  onOpenCallModal,
}) => {
  const {
    activePatient,
    userName,
    userRole,
    currentUserId,
    switchUserAccount,
    caregiverMessages,
    sendCaregiverMessage,
    sendCaregiverReply,
    markConversationRead,
    deleteCaregiverMessage,
    clearCaregiverConversation,
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter messages for this caregiver conversation
  const currentConversation = caregiver
    ? caregiverMessages.filter((m) => m.caregiverId === caregiver.id)
    : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && caregiver) {
      scrollToBottom();
      setErrorMessage(null);
      // Mark messages as read by current participant
      markConversationRead(caregiver.id);
    }
  }, [isOpen, caregiver?.id, currentConversation.length]);

  if (!isOpen || !caregiver) return null;

  const isCaregiverSession = userRole !== 'Patient';

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const text = inputText.trim();
    setIsSending(true);
    setErrorMessage(null);

    try {
      let success = false;
      if (isCaregiverSession) {
        success = await sendCaregiverReply(caregiver.id, text);
      } else {
        success = await sendCaregiverMessage(caregiver.id, text);
      }

      if (success) {
        setInputText('');
      } else {
        setErrorMessage('Failed to send message. Please retry.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error transmitting message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleAccount = () => {
    if (isCaregiverSession) {
      switchUserAccount('patient');
    } else {
      switchUserAccount('caregiver', caregiver.id);
    }
  };

  const patientPrompts = [
    'I have taken my morning medicine on schedule.',
    'My blood pressure reading is 122/82 mmHg today.',
    'Could you please review my pharmacy refill request?',
    'I am feeling slightly nauseous after the evening dose.',
  ];

  const caregiverPrompts = [
    'Dose confirmed. Please rest well and stay hydrated.',
    'I reviewed your 14-day vitals. Adherence looks great at 94%!',
    'Refill request approved and sent to Apollo Pharmacy.',
    'Please recheck your blood pressure in 30 minutes.',
  ];

  const activePrompts = isCaregiverSession ? caregiverPrompts : patientPrompts;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#111B2D] border border-[#1E2D4A] rounded-2xl shadow-2xl flex flex-col h-[85vh] sm:h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-blue-950/70 to-[#172338] border-b border-[#1E2D4A] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold text-sm">
                {caregiver.name.charAt(0)}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#111B2D] ${
                  caregiver.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                }`}
                title={caregiver.isOnline ? 'Active on duty' : 'Offline'}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {caregiver.name}
                </h3>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-semibold uppercase">
                  {caregiver.role}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {caregiver.shiftTiming} • {caregiver.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenCallModal && (
              <button
                type="button"
                onClick={onOpenCallModal}
                className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-[#1E2D4A] rounded-xl transition-colors cursor-pointer"
                title="Direct Phone Call"
              >
                <Phone className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-[#1E2D4A] rounded-xl transition-colors cursor-pointer"
              title="Clear conversation history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-[#1E2D4A] rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Clear Conversation Confirmation Banner */}
        {showClearConfirm && (
          <div className="p-3 bg-red-950/60 border-b border-red-500/30 flex items-center justify-between text-xs text-red-200 shrink-0">
            <span>Clear all message history with {caregiver.name}?</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  clearCaregiverConversation(caregiver.id);
                  setShowClearConfirm(false);
                }}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold"
              >
                Clear
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-2.5 py-1 bg-[#111B2D] text-slate-300 hover:text-white rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Active Account Banner with Two-Account Testing Switcher */}
        <div className="px-4 py-2.5 bg-[#080D19]/90 border-b border-[#1E2D4A] flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Current Session:</span>
            </span>
            <span
              className={`font-semibold px-2 py-0.5 rounded-md ${
                isCaregiverSession
                  ? 'bg-purple-950/70 border border-purple-500/40 text-purple-300'
                  : 'bg-blue-950/70 border border-blue-500/40 text-blue-300'
              }`}
            >
              {userName} ({userRole})
            </span>
          </div>

          {/* Instant Account Switch Button for 2-Way Messaging Verification */}
          <button
            type="button"
            onClick={handleToggleAccount}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#172338] hover:bg-[#1E2D4A] border border-[#2A3F64] text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition-all cursor-pointer shadow-sm"
            title="Switch authenticated user to verify two-way message delivery"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {isCaregiverSession
                ? `Switch to Patient (${activePatient?.name || 'Rajesh Kumar'})`
                : `Switch to ${caregiver.name} to Reply`}
            </span>
          </button>
        </div>

        {/* Message Thread Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-[#0A101D]">
          {currentConversation.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-[#111B2D] border border-[#1E2D4A] flex items-center justify-center text-slate-500 mb-3">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-200">No Messages Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Start a clinical conversation with {caregiver.name} ({caregiver.role}). All messages are securely stored in the database and synchronized in real time.
              </p>
            </div>
          ) : (
            currentConversation.map((msg) => {
              // Outgoing message check based on current active user
              const isMine =
                msg.senderId === currentUserId ||
                (userRole === 'Patient' && msg.senderRole === 'patient') ||
                (userRole !== 'Patient' && msg.senderRole === 'caregiver' && msg.caregiverId === caregiver.id);

              const timeFormatted = new Date(msg.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400 px-1">
                    <span className="font-semibold text-slate-300">
                      {isMine
                        ? `You (${userRole === 'Patient' ? 'Patient' : msg.senderName})`
                        : `${msg.senderName} (${msg.senderRole === 'patient' ? 'Patient' : 'Caregiver'})`}
                    </span>
                    <span>•</span>
                    <span>{timeFormatted}</span>
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-md relative ${
                      isMine
                        ? isCaregiverSession
                          ? 'bg-purple-600 text-white rounded-tr-none'
                          : 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-[#172338] border border-[#1E2D4A] text-slate-100 rounded-tl-none'
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                    <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[10px] text-slate-300/80">
                      {isMine && (
                        <>
                          {msg.deliveryStatus === 'read' ? (
                            <span className="flex items-center gap-0.5 text-cyan-300" title="Read by recipient">
                              <CheckCheck className="w-3.5 h-3.5" />
                              <span>Read</span>
                            </span>
                          ) : msg.deliveryStatus === 'delivered' ? (
                            <span className="flex items-center gap-0.5 text-slate-200" title="Delivered to device">
                              <Check className="w-3.5 h-3.5" />
                              <span>Delivered</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5 text-slate-300" title="Sent">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Sent</span>
                            </span>
                          )}
                        </>
                      )}

                      <button
                        onClick={() => deleteCaregiverMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 ml-2 hover:text-red-300 transition-opacity"
                        title="Delete this message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Clinical Prompts */}
        <div className="px-4 py-2 bg-[#0B1220] border-t border-[#1E2D4A] overflow-x-auto whitespace-nowrap flex gap-2 shrink-0 no-scrollbar">
          <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Quick:
          </span>
          {activePrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setInputText(prompt)}
              className="text-[11px] px-2.5 py-1 bg-[#172338] hover:bg-blue-600/30 border border-[#1E2D4A] hover:border-cyan-400/40 text-slate-300 hover:text-cyan-200 rounded-lg shrink-0 transition-colors cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Error message if transmission fails */}
        {errorMessage && (
          <div className="px-4 py-2 bg-red-950/80 border-t border-red-500/40 text-xs text-red-300 flex items-center justify-between shrink-0">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-3 sm:p-4 bg-[#111B2D] border-t border-[#1E2D4A] flex items-center gap-2 sm:gap-3 shrink-0"
        >
          <input
            type="text"
            placeholder={
              isCaregiverSession
                ? `Reply to patient as ${caregiver.name} (${caregiver.role})...`
                : `Message ${caregiver.name} (${caregiver.role})...`
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSending}
            className="flex-1 bg-[#080D19] border border-[#1E2D4A] focus:border-cyan-400 text-white text-xs sm:text-sm rounded-xl px-4 py-2.5 transition-colors focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className={`px-4 py-2.5 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 shadow-lg transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
              isCaregiverSession
                ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
            }`}
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Sending</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">{isCaregiverSession ? 'Reply' : 'Send'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
