import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AddMedicationModal } from '../modals/AddMedicationModal';
import { LogVitalsModal } from '../modals/LogVitalsModal';
import { EmergencyModal } from '../modals/EmergencyModal';
import { PatientProfileModal } from '../modals/PatientProfileModal';
import { SmartPillboxVisualizer } from './SmartPillboxVisualizer';
import {
  Camera,
  Mic,
  Activity,
  Droplets,
  Stethoscope,
  AlertOctagon,
  Heart,
  TrendingUp,
  Download,
  Plus,
  Clock,
  CheckCircle2,
  Bell,
  Sparkles,
  Edit2,
  Calendar,
  Zap,
  User,
  Package,
  AlertTriangle,
  HeartHandshake,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    setActivePage,
    setActiveSettingsTab,
    medications,
    markDoseTaken,
    snoozeDose,
    vitals,
    updateVitals,
    showToast,
    userName,
    activePatient,
    patients,
    setActivePatient,
    updatePatient,
    deletePatient,
  } = useApp();

  const [isAddMedOpen, setIsAddMedOpen] = useState(false);
  const [isLogVitalsOpen, setIsLogVitalsOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isEditPatientOpen, setIsEditPatientOpen] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  // Today's schedule items from medications
  const todaySchedule = medications.slice(0, 3);

  const handleExport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Patient,Metric,Value,Status,Timestamp\n' +
      `${activePatient.name},Heart Rate,${vitals.heartRate} bpm,Normal,Today\n` +
      `${activePatient.name},Blood Pressure,${vitals.bpSystolic}/${vitals.bpDiastolic} mmHg,Optimal,Today\n` +
      `${activePatient.name},Adherence,${vitals.adherencePercentage}%,High,Today\n` +
      `${activePatient.name},Hydration,${vitals.hydrationLiters}L,Under Goal,Today\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IntelliMed_Health_Summary_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Health summary report downloaded');
  };

  const handleQuickWater = () => {
    const newLiters = Number((vitals.hydrationLiters + 0.25).toFixed(2));
    updateVitals({ hydrationLiters: newLiters });
    showToast(`Logged +250ml water! Today's total: ${newLiters}L`);
  };

  const weeklyData = [
    { day: 'Mon', adherence: 100, isMissed: false },
    { day: 'Tue', adherence: 100, isMissed: false },
    { day: 'Wed', adherence: 100, isMissed: false },
    { day: 'Thu', adherence: 100, isMissed: false },
    { day: 'Fri', adherence: 100, isMissed: false },
    { day: 'Sat', adherence: 100, isMissed: false },
    { day: 'Sun', adherence: 45, isMissed: true },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Top Header & Greeting Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          {/* Top Status Badges matching reference video */}
          <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111B2D] border border-cyan-500/40 text-cyan-400 text-xs font-semibold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>System Online</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/40 text-blue-300 text-xs font-semibold">
              <span>{userName}</span>
            </div>
            {patients.length > 1 ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#172338] border border-cyan-500/40 text-cyan-300 text-xs font-semibold shadow-sm">
                <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-slate-400">Patient:</span>
                <select
                  value={activePatient.id}
                  onChange={(e) => {
                    const pat = patients.find((p) => p.id === e.target.value);
                    if (pat) {
                      setActivePatient(pat);
                      showToast(`Switched active clinical patient to ${pat.name}`);
                    }
                  }}
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer pr-1"
                  aria-label="Switch active patient"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#111B2D] text-white">
                      {p.name} ({p.bloodGroup})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setIsEditPatientOpen(true)}
                  className="text-[10px] bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black px-1.5 py-0.5 rounded font-bold uppercase transition-colors ml-1 cursor-pointer"
                  title="Full clinical edit"
                >
                  Edit
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditPatientOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#172338] hover:bg-cyan-950/60 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-xs font-semibold transition-all cursor-pointer group shadow-sm"
                title="Click to full edit patient clinical profile"
              >
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  Patient: <strong className="text-white group-hover:text-cyan-200">{activePatient.name}</strong> ({activePatient.bloodGroup})
                </span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-bold uppercase ml-1 group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                  Full Edit
                </span>
              </button>
            )}
          </div>

          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
            Health Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Your personalized AI-driven medical command center. Monitor vitals, track medication
            adherence, and review predictive health insights.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#111B2D] hover:bg-[#172338] border border-[#1E2D4A] hover:border-slate-400 text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export Report</span>
          </button>
          <button
            onClick={() => setIsAddMedOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* Quick Action Navigation Bar matching video (6 cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setActivePage('scanner')}
          className="flex flex-col items-center justify-center p-3.5 bg-[#111B2D] hover:bg-[#172338] border border-[#1E2D4A] hover:border-cyan-500/50 rounded-xl group transition-all cursor-pointer text-center"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
            <Camera className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold tracking-wider text-slate-200 uppercase">
            AI Pill Scanner
          </span>
        </button>

        <button
          onClick={() => {
            setActiveSettingsTab('voice');
            setActivePage('settings');
          }}
          className="flex flex-col items-center justify-center p-3.5 bg-[#111B2D] hover:bg-[#172338] border border-[#1E2D4A] hover:border-pink-500/50 rounded-xl group transition-all cursor-pointer text-center"
        >
          <div className="w-9 h-9 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
            <Mic className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold tracking-wider text-slate-200 uppercase">
            Voice Assistant
          </span>
        </button>

        <button
          onClick={() => setIsLogVitalsOpen(true)}
          className="flex flex-col items-center justify-center p-3.5 bg-[#111B2D] hover:bg-[#172338] border border-[#1E2D4A] hover:border-teal-500/50 rounded-xl group transition-all cursor-pointer text-center"
        >
          <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
            <Activity className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold tracking-wider text-slate-200 uppercase">
            Log Vitals
          </span>
        </button>

        <button
          onClick={handleQuickWater}
          className="flex flex-col items-center justify-center p-3.5 bg-[#111B2D] hover:bg-[#172338] border border-[#1E2D4A] hover:border-blue-500/50 rounded-xl group transition-all cursor-pointer text-center"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
            <Droplets className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold tracking-wider text-slate-200 uppercase">
            Water Intake
          </span>
        </button>

        <button
          onClick={() => {
            setActiveSettingsTab('caregivers');
            setActivePage('settings');
          }}
          className="flex flex-col items-center justify-center p-3.5 bg-[#111B2D] hover:bg-[#172338] border border-[#1E2D4A] hover:border-purple-500/50 rounded-xl group transition-all cursor-pointer text-center"
        >
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold tracking-wider text-slate-200 uppercase">
            Caregiver Portal
          </span>
        </button>

        <button
          onClick={() => setIsEmergencyOpen(true)}
          className="flex flex-col items-center justify-center p-3.5 bg-red-950/20 hover:bg-red-950/40 border border-red-500/40 hover:border-red-500 rounded-xl group transition-all cursor-pointer text-center"
        >
          <div className="w-9 h-9 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center group-hover:scale-110 transition-transform mb-2 animate-pulse">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold tracking-wider text-red-400 uppercase">
            Emergency SOS
          </span>
        </button>
      </div>

      {/* 8 Vital Metric Cards matching reference video */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Card 1: Heart Rate */}
        <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Heart className="w-3.5 h-3.5 text-pink-400" />
              HEART RATE
            </span>
            <span className="text-emerald-400 font-semibold text-[11px]">+2% normal</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-extrabold text-white font-mono">
              {vitals.heartRate}
            </span>
            <span className="text-xs text-slate-400">bpm</span>
          </div>
        </div>

        {/* Card 2: Blood Pressure */}
        <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">BLOOD PRESSURE</span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-semibold text-[10px]">
              Optimal
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-extrabold text-white font-mono">
              {vitals.bpSystolic}/{vitals.bpDiastolic}
            </span>
            <span className="text-xs text-slate-400">mmHg</span>
          </div>
        </div>

        {/* Card 3: Adherence */}
        <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">ADHERENCE</span>
            <span className="text-emerald-400 font-semibold text-[11px]">+5% this week</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-extrabold text-white font-mono">
              {vitals.adherencePercentage}%
            </span>
          </div>
        </div>

        {/* Card 4: Missed Doses */}
        <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">MISSED DOSES</span>
            <span className="text-emerald-400 font-semibold text-[11px]">-2 vs last week</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-extrabold text-white font-mono">
              {vitals.missedDoses}
            </span>
            <span className="text-xs text-slate-400">dose</span>
          </div>
        </div>

        {/* Card 5: AI Health Score */}
        <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">AI HEALTH SCORE</span>
            <span className="text-cyan-400 font-semibold text-[11px]">Excellent</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-extrabold text-cyan-400 font-mono">
              {vitals.aiHealthScore}
            </span>
          </div>
        </div>

        {/* Card 6: Active Meds */}
        <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">ACTIVE MEDS</span>
            <span className="text-slate-400 font-semibold text-[11px]">Stable</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-extrabold text-white font-mono">
              {vitals.activeMeds}
            </span>
          </div>
        </div>

        {/* Card 7: Hydration */}
        <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-blue-400" />
              HYDRATION
            </span>
            <span className="text-amber-400 font-semibold text-[10px]">0.8L under goal</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-extrabold text-white font-mono">
              {vitals.hydrationLiters}
            </span>
            <span className="text-xs text-slate-400">L</span>
          </div>
        </div>

        {/* Card 8: Sleep */}
        <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">SLEEP</span>
            <span className="text-emerald-400 font-semibold text-[11px]">+1.2h vs avg</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-extrabold text-white font-mono">
              {vitals.sleepHours}
            </span>
            <span className="text-xs text-slate-400">hrs</span>
          </div>
        </div>
      </div>

      {/* Two Main Charts Row matching video */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vitals Timeline Area Chart */}
        <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">Vitals Timeline</h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span>
              <span>Diurnal Wave</span>
            </div>
          </div>

          {/* Glowing SVG Waveform Chart */}
          <div className="h-48 w-full relative flex items-center justify-center">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 500 160"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.45" />
                  <stop offset="70%" stopColor="#3B82F6" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#080D19" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22D3EE" />
                  <stop offset="50%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#34D399" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1="0" y1="40" x2="500" y2="40" stroke="#1E2D4A" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="#1E2D4A" strokeDasharray="3 3" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="#1E2D4A" strokeDasharray="3 3" />

              {/* Area path */}
              <path
                d="M 0,100 C 60,140 100,50 160,80 C 220,110 270,145 330,90 C 390,40 440,75 500,55 L 500,160 L 0,160 Z"
                fill="url(#waveGradient)"
              />

              {/* Stroke path */}
              <path
                d="M 0,100 C 60,140 100,50 160,80 C 220,110 270,145 330,90 C 390,40 440,75 500,55"
                fill="none"
                stroke="url(#lineGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Glowing anchor dots */}
              <circle cx="160" cy="80" r="5" fill="#22D3EE" className="animate-ping opacity-75" />
              <circle cx="160" cy="80" r="4" fill="#FFFFFF" stroke="#22D3EE" strokeWidth="2" />

              <circle cx="330" cy="90" r="4" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="2" />
              <circle cx="500" cy="55" r="4" fill="#34D399" stroke="#FFFFFF" strokeWidth="1" />
            </svg>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-2 pt-2 border-t border-[#1E2D4A]">
            <span>00:00</span>
            <span>04:00</span>
            <span>08:00 (Meds)</span>
            <span>12:00</span>
            <span>16:00</span>
            <span>20:00</span>
            <span>23:59</span>
          </div>
        </div>

        {/* Weekly Adherence Bar Chart */}
        <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">Weekly Adherence</h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block"></span>
                Taken (100%)
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block"></span>
                Missed
              </span>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="h-48 w-full flex items-end justify-between gap-3 px-2 pt-4">
            {weeklyData.map((d, i) => {
              const isSelected = selectedDayIndex === i;
              const barHeight = d.isMissed ? '45%' : '94%';
              return (
                <div
                  key={d.day}
                  onClick={() => {
                    setSelectedDayIndex(i);
                    showToast(`${d.day}: ${d.adherence}% adherence`);
                  }}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                >
                  <div className="relative w-full flex items-end justify-center h-36">
                    <div
                      style={{ height: barHeight }}
                      className={`w-full max-w-[28px] rounded-t-md transition-all duration-300 group-hover:brightness-125 ${
                        d.isMissed
                          ? 'bg-gradient-to-t from-red-600 to-red-400 shadow-md shadow-red-500/20'
                          : 'bg-gradient-to-t from-blue-700 to-cyan-400 shadow-md shadow-blue-500/20'
                      } ${isSelected ? 'ring-2 ring-white' : ''}`}
                    ></div>
                  </div>
                  <span
                    className={`text-[11px] font-semibold mt-2 ${
                      d.isMissed ? 'text-red-400' : 'text-slate-400'
                    }`}
                  >
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-2 pt-2 border-t border-[#1E2D4A]">
            <span>Average: 94%</span>
            <span className="text-emerald-400 font-semibold">6 Days Consecutive 100%</span>
          </div>
        </div>
      </div>

      {/* Smart Pillbox Pro 14-Compartment Live Hardware Visualizer */}
      <SmartPillboxVisualizer />

      {/* Bottom Section: Schedule on Left, Insights & Recent Activity on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Today's Medication Schedule (7 cols) */}
        <div className="lg:col-span-7 bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <h3 className="text-base font-bold text-white">Today's Medication Schedule</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
              3 Tasks
            </span>
          </div>

          <div className="space-y-3">
            {todaySchedule.map((med) => {
              const isTaken = med.status === 'taken';
              return (
                <div
                  key={med.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isTaken
                      ? 'bg-[#172338]/40 border-emerald-500/30'
                      : 'bg-[#172338] border-[#1E2D4A] hover:border-slate-500'
                  } flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        isTaken
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{med.name}</h4>
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 font-semibold">
                          {med.dosage}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>{med.scheduledTime}</span>
                        <span>•</span>
                        <span className="text-slate-300">{med.timingRule}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {isTaken ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verified</span>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => markDoseTaken(med.id)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                        >
                          Mark Taken
                        </button>
                        <button
                          onClick={() => snoozeDose(med.id, 15)}
                          className="px-3 py-1.5 bg-[#111B2D] hover:bg-[#1E2D4A] border border-[#1E2D4A] text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                        >
                          Snooze
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => setIsAddMedOpen(true)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/40 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: AI Health Insights & Recent Activity (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* AI Health Insights Box */}
          <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-3.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">AI Health Insights</h3>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#172338]/60 border border-[#1E2D4A]">
                <h5 className="text-xs font-bold text-amber-400">Pattern Detected</h5>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  You frequently miss evening doses on weekends.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#172338]/60 border border-[#1E2D4A]">
                <h5 className="text-xs font-bold text-emerald-400">Vitals Improving</h5>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Your average blood pressure has stabilized over 14 days.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#172338]/60 border border-[#1E2D4A]">
                <h5 className="text-xs font-bold text-blue-400">Hydration Low</h5>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  You are 0.8L behind your daily water goal.
                </p>
              </div>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-3.5">
              <Bell className="w-4 h-4 text-pink-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">Recent Activity</h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-[#172338]/40 border border-[#1E2D4A] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Heart className="w-4 h-4 text-pink-400 shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Morning BP recorded: 118/78</p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">2h ago</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#172338]/40 border border-[#1E2D4A] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Amlodipine marked as taken</p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">4h ago</span>
              </div>
            </div>
          </div>

          {/* Compact Stock & Refill Summary Card */}
          <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">Stock & Refill Status</h3>
              </div>
              <button
                onClick={() => setActivePage('medications')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold transition-colors cursor-pointer"
              >
                View Tracker →
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#172338]/40 border border-[#1E2D4A] flex items-center justify-between">
                <span className="text-slate-300">Monitored Prescriptions</span>
                <span className="font-bold text-white font-mono">{medications.length} meds</span>
              </div>

              {medications.some((m) => m.inventory <= (m.reorderThreshold ?? 8)) ? (
                <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-amber-200 font-semibold">
                      {medications.filter((m) => m.inventory <= (m.reorderThreshold ?? 8)).length} Low Stock Alert
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-bold uppercase bg-amber-500/20 px-2 py-0.5 rounded">
                    Refill Advised
                  </span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-emerald-200 font-semibold">Stock Levels Optimal</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase bg-emerald-500/20 px-2 py-0.5 rounded">
                    All Good
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddMedicationModal isOpen={isAddMedOpen} onClose={() => setIsAddMedOpen(false)} />
      <LogVitalsModal isOpen={isLogVitalsOpen} onClose={() => setIsLogVitalsOpen(false)} />
      <EmergencyModal isOpen={isEmergencyOpen} onClose={() => setIsEmergencyOpen(false)} />
      <PatientProfileModal
        isOpen={isEditPatientOpen}
        onClose={() => setIsEditPatientOpen(false)}
        patient={activePatient}
        mode="edit"
        onSave={(data, id) => {
          if (id) updatePatient(id, data);
        }}
        onDelete={(id) => deletePatient(id)}
        canDelete={patients.length > 1}
      />
    </div>
  );
};
