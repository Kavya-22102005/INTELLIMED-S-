import React, { useState } from 'react';
import { Caregiver } from '../../types';
import { Phone, Copy, Check, ExternalLink, X, Smartphone, AlertCircle } from 'lucide-react';
import { isMobileDevice, validateIndianMobile } from '../../utils/phoneUtils';

interface PhoneCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  caregiver: Caregiver | null;
}

export const PhoneCallModal: React.FC<PhoneCallModalProps> = ({
  isOpen,
  onClose,
  caregiver,
}) => {
  const [copied, setCopied] = useState(false);
  const [diallerTriggered, setDiallerTriggered] = useState(false);

  if (!isOpen || !caregiver) return null;

  const phoneRes = validateIndianMobile(caregiver.phone);
  const isMobile = isMobileDevice();

  const handleCopy = () => {
    navigator.clipboard.writeText(phoneRes.formatted || caregiver.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTriggerCall = () => {
    setDiallerTriggered(true);
    // Directly invoke standard tel: scheme
    window.location.href = `tel:${phoneRes.e164 || caregiver.phone}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#111B2D] border border-[#1E2D4A] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-emerald-950/60 to-blue-950/50 border-b border-[#1E2D4A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Phone className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Direct Phone Call</h3>
              <p className="text-xs text-slate-400">{caregiver.name} ({caregiver.role})</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E2D4A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="text-center p-4 bg-[#080D19] border border-[#1E2D4A] rounded-xl">
            <span className="text-xs text-slate-400 block mb-1">Registered Indian Mobile Line</span>
            <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-400 tracking-wider">
              {phoneRes.formatted || caregiver.phone}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Validated Indian Telecom Network (+91)</span>
            </div>
          </div>

          {/* Device Context Notice */}
          {isMobile ? (
            <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-start gap-2.5 text-xs text-emerald-300">
              <Smartphone className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Mobile Device Detected</p>
                <p className="text-[11px] text-emerald-300/80 mt-0.5">
                  Tapping &quot;Launch Phone Dialler&quot; will directly open your device&apos;s phone app with {phoneRes.formatted}.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-blue-950/30 border border-blue-500/30 rounded-xl flex items-start gap-2.5 text-xs text-blue-300">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Desktop / Browser Environment Notice</p>
                <p className="text-[11px] text-blue-300/80 mt-0.5">
                  Direct calling requires a telephony client (FaceTime, Skype, Google Voice, or linked Android/iOS phone) on this workstation. You can also copy the validated number to dial from your handset.
                </p>
              </div>
            </div>
          )}

          {diallerTriggered && (
            <div className="p-2.5 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-xs text-cyan-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>
                System dialler prompt requested. Note: Call connection depends on device carrier and user confirmation.
              </span>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={handleTriggerCall}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>Launch Phone Dialler</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>
            <button
              onClick={handleCopy}
              className="py-2.5 px-4 bg-[#080D19] hover:bg-[#1E2D4A] border border-[#1E2D4A] text-slate-300 hover:text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Copy Number</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
