import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, PhoneCall, AlertTriangle, ShieldCheck, MapPin, Radio } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { activeCaregiver, activePatient, showToast } = useApp();
  const [countdown, setCountdown] = useState(5);
  const [calling, setCalling] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      setCalling(false);
      return;
    }

    if (countdown > 0 && !calling) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !calling) {
      setCalling(true);
    }
  }, [isOpen, countdown, calling]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#111B2D] border-2 border-red-500/50 rounded-2xl shadow-2xl overflow-y-auto max-h-[92vh] animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 bg-gradient-to-r from-red-950/80 to-red-900/40 border-b border-red-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500 flex items-center justify-center text-red-400 animate-pulse">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white tracking-wide">
                EMERGENCY SOS ALERT
              </h3>
              <p className="text-xs text-red-300">Priority Clinical Dispatch Active</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-[#080D19] border border-red-500/30 rounded-xl p-4 text-center">
            {!calling ? (
              <>
                <p className="text-xs text-slate-300 mb-2">
                  Broadcasting urgent dispatch alert to designated emergency contacts in:
                </p>
                <div className="text-4xl font-extrabold text-red-400 font-mono my-2 animate-bounce">
                  00:0{countdown}
                </div>
                <p className="text-[11px] text-slate-500">
                  Click Cancel below if this was an accidental trigger.
                </p>
              </>
            ) : (
              <div className="py-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold mb-2 animate-pulse">
                  <Radio className="w-4 h-4" />
                  Connecting Live Channel...
                </div>
                <p className="text-sm font-bold text-white">
                  Calling {activeCaregiver.name} ({activeCaregiver.role})
                </p>
                <p className="text-xs text-cyan-400 font-mono mt-1">
                  TEL: {activeCaregiver.phone}
                </p>
              </div>
            )}
          </div>

          <div className="bg-[#172338] border border-[#1E2D4A] rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Target Patient:</span>
              <span className="font-semibold text-white">{activePatient.name}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Blood Group:</span>
              <span className="font-semibold text-cyan-400">{activePatient.bloodGroup}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Severe Allergies:</span>
              <span className="font-semibold text-red-400">
                {activePatient.allergies.join(', ') || 'None'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-[#1E2D4A]">
              <span className="flex items-center gap-1 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                Live GPS Location:
              </span>
              <span className="text-slate-300 font-mono">12.9716° N, 77.5946° E</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={() => {
                showToast('Emergency SOS cancelled');
                onClose();
              }}
              className="flex-1 py-2.5 px-4 bg-[#172338] hover:bg-[#1E2D4A] border border-[#1E2D4A] text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all"
            >
              Cancel Alert
            </button>
            <a
              href={`tel:${activeCaregiver.phone}`}
              onClick={() => {
                showToast(`Calling emergency line: ${activeCaregiver.phone}`);
                onClose();
              }}
              className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/40 flex items-center justify-center gap-2 transition-all"
            >
              <PhoneCall className="w-4 h-4" />
              Call Now
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
