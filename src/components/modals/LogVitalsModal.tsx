import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Activity, Droplets, Moon, Heart } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const LogVitalsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { vitals, updateVitals, showToast } = useApp();

  const [heartRate, setHeartRate] = useState(vitals.heartRate.toString());
  const [bpSystolic, setBpSystolic] = useState(vitals.bpSystolic.toString());
  const [bpDiastolic, setBpDiastolic] = useState(vitals.bpDiastolic.toString());
  const [hydration, setHydration] = useState(vitals.hydrationLiters.toString());
  const [sleep, setSleep] = useState(vitals.sleepHours.toString());

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateVitals({
      heartRate: parseInt(heartRate, 10) || 72,
      bpSystolic: parseInt(bpSystolic, 10) || 120,
      bpDiastolic: parseInt(bpDiastolic, 10) || 80,
      hydrationLiters: parseFloat(hydration) || 1.2,
      sleepHours: parseFloat(sleep) || 7.5,
    });
    showToast('Patient vitals logged successfully');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#111B2D] border border-[#1E2D4A] rounded-2xl shadow-2xl overflow-y-auto max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2D4A] bg-[#172338]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Log Patient Vitals</h3>
              <p className="text-xs text-slate-400">Sync daily biometrics & physiological metrics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-pink-400" />
                Heart Rate (BPM)
              </label>
              <input
                type="number"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                className="w-full bg-[#080D19] border border-[#1E2D4A] text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                Hydration (Liters)
              </label>
              <input
                type="number"
                step="0.1"
                value={hydration}
                onChange={(e) => setHydration(e.target.value)}
                className="w-full bg-[#080D19] border border-[#1E2D4A] text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                BP Systolic (mmHg)
              </label>
              <input
                type="number"
                value={bpSystolic}
                onChange={(e) => setBpSystolic(e.target.value)}
                className="w-full bg-[#080D19] border border-[#1E2D4A] text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                BP Diastolic (mmHg)
              </label>
              <input
                type="number"
                value={bpDiastolic}
                onChange={(e) => setBpDiastolic(e.target.value)}
                className="w-full bg-[#080D19] border border-[#1E2D4A] text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-purple-400" />
              Sleep Duration (Hours)
            </label>
            <input
              type="number"
              step="0.1"
              value={sleep}
              onChange={(e) => setSleep(e.target.value)}
              className="w-full bg-[#080D19] border border-[#1E2D4A] text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E2D4A]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30"
            >
              Save Vitals
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
