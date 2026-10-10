import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Smartphone,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Battery,
  Wifi,
  Radio,
  Pill,
} from 'lucide-react';

export const SmartPillboxVisualizer: React.FC = () => {
  const { medications, markDoseTaken, showToast, iotDeviceConnected } = useApp();
  const [activeCompartment, setActiveCompartment] = useState<number | null>(4); // Default to Friday morning (index 4)

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // 14 compartments: 7 Morning, 7 Night
  const compartments = days.flatMap((day, dayIndex) => [
    {
      id: dayIndex * 2,
      day,
      timeOfDay: 'Morning' as const,
      timeStr: '08:00 AM',
      meds: ['Lisinopril 10mg', 'Amlodipine 5mg'],
      isTaken: dayIndex < 4, // Mon-Thu taken
      isToday: dayIndex === 4, // Fri is today
      isDue: dayIndex === 4,
    },
    {
      id: dayIndex * 2 + 1,
      day,
      timeOfDay: 'Night' as const,
      timeStr: '09:00 PM',
      meds: ['Atorvastatin 20mg'],
      isTaken: dayIndex < 4,
      isToday: dayIndex === 4,
      isDue: false,
    },
  ]);

  const selectedData = activeCompartment !== null ? compartments[activeCompartment] : null;

  const handleDispense = (id: number) => {
    setActiveCompartment(id);
    const comp = compartments[id];
    showToast(`IoT Dispenser Compartment #${id + 1} (${comp.day} ${comp.timeOfDay}) lid unlocked`);
  };

  return (
    <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header with IoT live status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2D4A]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
            <Smartphone className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                Smart Pillbox Pro™ Live Dispenser
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                IoT Sync Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              14-Compartment interactive LED grid with real-time biometric lid sensors.
            </p>
          </div>
        </div>

        {/* Telemetry pill */}
        <div className="flex items-center gap-3 text-xs bg-[#080D19] border border-[#1E2D4A] px-3 py-1.5 rounded-xl self-start sm:self-auto font-mono">
          <span className="flex items-center gap-1 text-emerald-400">
            <Battery className="w-3.5 h-3.5" />
            92%
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1 text-cyan-400">
            <Wifi className="w-3.5 h-3.5" />
            BLE 5.2
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">14 Active</span>
        </div>
      </div>

      {/* 14-Compartment Visualizer Grid with responsive scroll */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
            Morning Compartments (08:00 AM)
          </span>
          <span className="text-[10px] text-slate-500">Tap compartment to inspect</span>
        </div>

        {/* Morning Row (7 compartments) */}
        <div className="overflow-x-auto scrollbar-none pb-1">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 min-w-[440px] sm:min-w-0">
            {compartments
              .filter((c) => c.timeOfDay === 'Morning')
              .map((c) => {
                const isSelected = activeCompartment === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleDispense(c.id)}
                    className={`p-2 sm:p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[78px] sm:min-h-[92px] group relative ${
                      c.isTaken
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                        : c.isDue
                        ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-500/20 animate-pulse'
                        : 'bg-[#172338] border-[#1E2D4A] text-slate-300 hover:border-slate-400'
                    } ${isSelected ? 'scale-[1.03] z-10' : ''}`}
                  >
                    <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400">
                      {c.day}
                    </span>

                    {/* LED Indicator dot */}
                    <div
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center my-1 ${
                        c.isTaken
                          ? 'bg-emerald-400 shadow-md shadow-emerald-400/50'
                          : c.isDue
                          ? 'bg-cyan-400 shadow-lg shadow-cyan-400/80 animate-ping'
                          : 'bg-slate-700'
                      }`}
                    ></div>

                    <span className="text-[9px] font-mono leading-none">
                      {c.isTaken ? '✓ Taken' : c.isDue ? '● Due Now' : 'Pending'}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
            Night Compartments (09:00 PM)
          </span>
        </div>

        {/* Night Row (7 compartments) */}
        <div className="overflow-x-auto scrollbar-none pb-1">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 min-w-[440px] sm:min-w-0">
            {compartments
              .filter((c) => c.timeOfDay === 'Night')
              .map((c) => {
                const isSelected = activeCompartment === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleDispense(c.id)}
                    className={`p-2 sm:p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[78px] sm:min-h-[92px] group relative ${
                      c.isTaken
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-[#172338] border-[#1E2D4A] text-slate-300 hover:border-slate-400'
                    } ${isSelected ? 'scale-[1.03] z-10 border-purple-400' : ''}`}
                  >
                    <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400">
                      {c.day}
                    </span>

                    {/* LED Indicator dot */}
                    <div
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center my-1 ${
                        c.isTaken
                          ? 'bg-emerald-400 shadow-md shadow-emerald-400/50'
                          : 'bg-purple-900/60 border border-purple-500/40'
                      }`}
                    ></div>

                    <span className="text-[9px] font-mono leading-none">
                      {c.isTaken ? '✓ Taken' : 'Bedtime'}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* Selected Compartment Telemetry Banner */}
      {selectedData && (
        <div className="p-3.5 rounded-xl bg-[#172338] border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white">
                Compartment #{selectedData.id + 1} — {selectedData.day} {selectedData.timeOfDay} ({selectedData.timeStr})
              </p>
              <p className="text-[11px] text-slate-400">
                Pills Loaded: <span className="text-slate-200">{selectedData.meds.join(', ')}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {selectedData.isTaken ? (
              <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Dispensed & Confirmed
              </span>
            ) : (
              <button
                onClick={() => {
                  showToast(`Compartment #${selectedData.id + 1} lid released for patient`);
                  const match = medications[0];
                  if (match) markDoseTaken(match.id);
                }}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-md cursor-pointer"
              >
                Release Lid & Log Intake
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
