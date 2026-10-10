import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  PieChart,
  BarChart3,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { medicationLogs, showToast, activePatient } = useApp();

  const [timeRange, setTimeRange] = useState<'7 Days' | '30 Days' | '3 Months' | '6 Months'>('6 Months');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedFilter, setSelectedMedFilter] = useState('All Medicines');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All Status');
  const [currentPage, setCurrentPage] = useState(1);

  // Dynamic metrics depending on time range
  const metricsMap = {
    '7 Days': { total: 35, rate: '94%', missed: 2, onTime: 33, alerts: 4, critical: 1 },
    '30 Days': { total: 150, rate: '91%', missed: 14, onTime: 136, alerts: 18, critical: 5 },
    '3 Months': { total: 450, rate: '86%', missed: 63, onTime: 387, alerts: 68, critical: 24 },
    '6 Months': { total: 900, rate: '83%', missed: 157, onTime: 743, alerts: 157, critical: 52 },
  };

  const currentMetrics = metricsMap[timeRange];

  const handleExportCSV = () => {
    let csv = 'Date,Medicine,Scheduled Time,Status,Notes\n';
    medicationLogs.forEach((row) => {
      csv += `"${row.date}","${row.medicineName}","${row.scheduledTime}","${row.status}","${row.notes}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `IntelliMed_Report_${timeRange.replace(' ', '_')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${medicationLogs.length} medication log records as CSV`);
  };

  // Filter logs
  const filteredLogs = medicationLogs.filter((log) => {
    const matchesSearch =
      log.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.notes.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedMedFilter !== 'All Medicines' && log.medicineName !== selectedMedFilter) {
      return false;
    }
    if (selectedStatusFilter !== 'All Status' && log.status !== selectedStatusFilter) {
      return false;
    }
    return true;
  });

  const pageSize = 7;
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const medicinePerformance = [
    { name: 'Paracetamol', taken: 82, missed: 18 },
    { name: 'Metformin', taken: 74, missed: 26 },
    { name: 'Amlodipine', taken: 95, missed: 5 },
    { name: 'Atorvastatin', taken: 90, missed: 10 },
    { name: 'Aspirin', taken: 85, missed: 15 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Header matching video */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-cyan-400" />
            Reports & Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Medication adherence monitoring • Last updated: 19/5/2026, 2:51:39 pm
          </p>
        </div>

        {/* Filters and Export Button matching video */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-[#111B2D] border border-[#1E2D4A] p-1 rounded-xl flex items-center gap-1">
            {(['7 Days', '30 Days', '3 Months', '6 Months'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  timeRange === r
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-[#080D19] text-xs font-extrabold rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Top 6 KPI Cards Row matching reference video */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-xl p-4">
          <div className="text-2xl lg:text-3xl font-extrabold text-white font-mono">
            {currentMetrics.total}
          </div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase mt-1">
            Total Tracked
          </div>
        </div>

        <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-xl p-4">
          <div className="text-2xl lg:text-3xl font-extrabold text-cyan-400 font-mono">
            {currentMetrics.rate}
          </div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase mt-1">
            Adherence Rate
          </div>
        </div>

        <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-xl p-4">
          <div className="text-2xl lg:text-3xl font-extrabold text-red-400 font-mono">
            {currentMetrics.missed}
          </div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase mt-1">
            Missed Doses
          </div>
        </div>

        <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-xl p-4">
          <div className="text-2xl lg:text-3xl font-extrabold text-emerald-400 font-mono">
            {currentMetrics.onTime}
          </div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase mt-1">
            On-Time Doses
          </div>
        </div>

        <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-xl p-4">
          <div className="text-2xl lg:text-3xl font-extrabold text-amber-400 font-mono">
            {currentMetrics.alerts}
          </div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase mt-1">
            Alerts Triggered
          </div>
        </div>

        <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-xl p-4">
          <div className="text-2xl lg:text-3xl font-extrabold text-coral-400 text-red-500 font-mono">
            {currentMetrics.critical}
          </div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase mt-1">
            Critical Warnings
          </div>
        </div>
      </div>

      {/* Row 1 Charts: Adherence Trend & Missed Dose Distribution matching video */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Adherence Trend Chart (8 cols) */}
        <div className="lg:col-span-8 bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Adherence Trend</h3>
              <p className="text-[11px] text-slate-400">
                Medication compliance rate over selected period
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
              Avg: {currentMetrics.rate}
            </span>
          </div>

          <div className="h-52 w-full relative">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 600 160"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="adherenceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#080D19" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="30" x2="600" y2="30" stroke="#1E2D4A" strokeDasharray="3 3" />
              <line x1="0" y1="70" x2="600" y2="70" stroke="#1E2D4A" strokeDasharray="3 3" />
              <line x1="0" y1="110" x2="600" y2="110" stroke="#1E2D4A" strokeDasharray="3 3" />

              {/* Area */}
              <path
                d="M 0,90 Q 75,50 150,75 T 300,60 T 450,95 T 600,65 L 600,160 L 0,160 Z"
                fill="url(#adherenceGrad)"
              />
              {/* Line */}
              <path
                d="M 0,90 Q 75,50 150,75 T 300,60 T 450,95 T 600,65"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Glowing Points */}
              {[
                { cx: 75, cy: 50 },
                { cx: 150, cy: 75 },
                { cx: 225, cy: 65 },
                { cx: 300, cy: 60 },
                { cx: 375, cy: 75 },
                { cx: 450, cy: 95 },
                { cx: 525, cy: 70 },
                { cx: 600, cy: 65 },
              ].map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.cx}
                  cy={pt.cy}
                  r="4.5"
                  fill="#0B1220"
                  stroke="#38BDF8"
                  strokeWidth="2.5"
                />
              ))}
            </svg>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-2 pt-2 border-t border-[#1E2D4A]">
            <span>Day 1</span>
            <span>Day 30</span>
            <span>Day 60</span>
            <span>Day 90</span>
            <span>Day 120</span>
            <span>Day 150</span>
            <span>Day 180</span>
          </div>
        </div>

        {/* Missed Dose Distribution Donut Chart (4 cols) matching video */}
        <div className="lg:col-span-4 bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Missed Dose Distribution</h3>
            <p className="text-[11px] text-slate-400">By time of day</p>
          </div>

          {/* Donut Chart representation */}
          <div className="relative my-4 flex items-center justify-center">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="60" fill="none" stroke="#1E2D4A" strokeWidth="24" />
              {/* Afternoon 45% (Cyan) */}
              <circle
                cx="80"
                cy="80"
                r="60"
                fill="none"
                stroke="#22D3EE"
                strokeWidth="24"
                strokeDasharray="170 377"
                strokeDashoffset="0"
              />
              {/* Morning 35% (Purple) */}
              <circle
                cx="80"
                cy="80"
                r="60"
                fill="none"
                stroke="#A78BFA"
                strokeWidth="24"
                strokeDasharray="132 377"
                strokeDashoffset="-170"
              />
              {/* Night 20% (Green) */}
              <circle
                cx="80"
                cy="80"
                r="60"
                fill="none"
                stroke="#34D399"
                strokeWidth="24"
                strokeDasharray="75 377"
                strokeDashoffset="-302"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-extrabold text-white font-mono">157</span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Missed</span>
            </div>
          </div>

          <div className="flex items-center justify-around text-xs pt-3 border-t border-[#1E2D4A]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
              <span className="text-slate-300">Afternoon (45%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block"></span>
              <span className="text-slate-300">Morning (35%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
              <span className="text-slate-300">Night (20%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Medicine-wise Performance Bar Chart matching video */}
      <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Medicine-wise Performance</h3>
            <p className="text-[11px] text-slate-400">Adherence rate by registered medication</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded-sm bg-teal-400 inline-block"></span>
              Taken
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded-sm bg-red-400 inline-block"></span>
              Missed
            </span>
          </div>
        </div>

        <div className="h-44 w-full flex items-end justify-between gap-6 px-4 pt-4">
          {medicinePerformance.map((med) => (
            <div key={med.name} className="flex-1 flex flex-col items-center h-full justify-end">
              <div className="w-full max-w-[48px] flex items-end justify-center gap-1.5 h-32">
                <div
                  style={{ height: `${med.taken}%` }}
                  className="w-1/2 bg-teal-400 rounded-t-sm shadow-md shadow-teal-500/20"
                  title={`Taken: ${med.taken}%`}
                ></div>
                <div
                  style={{ height: `${med.missed * 2}%` }}
                  className="w-1/2 bg-red-400 rounded-t-sm shadow-md shadow-red-500/20"
                  title={`Missed: ${med.missed}%`}
                ></div>
              </div>
              <span className="text-xs font-semibold text-slate-300 mt-2 truncate w-full text-center">
                {med.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Clinical Insights Section (System Generated) matching video */}
      <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1E2D4A]">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            Clinical Insights
          </h3>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
            System Generated
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#172338]/60 border border-[#1E2D4A]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              ADHERENCE PATTERN
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-bold text-emerald-400">Within Range</span>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Adherence is 83% — within the recommended 80% clinical threshold for stable cardiovascular regimen.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#172338]/60 border border-[#1E2D4A]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              MISSED DOSE RISK
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              <span className="text-xs font-bold text-red-400">High Risk</span>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              157 missed doses detected across evaluation window (52 critical, Metformin). Schedule review recommended.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#172338]/60 border border-[#1E2D4A]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              RECOMMENDATIONS
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-xs font-bold text-amber-400">Action Required</span>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Set escalating reminders for morning doses. Review Metformin schedule with caregiver. Consider smart pillbox integration.
            </p>
          </div>
        </div>
      </div>

      {/* Medication Log Table matching video */}
      <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            Medication Log
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search medicine or date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#080D19] border border-[#1E2D4A] text-xs text-white rounded-lg pl-8 pr-2.5 py-1.5 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Filter by Medicine */}
            <select
              value={selectedMedFilter}
              onChange={(e) => setSelectedMedFilter(e.target.value)}
              className="bg-[#080D19] border border-[#1E2D4A] text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="All Medicines">All Medicines</option>
              <option value="Paracetamol">Paracetamol</option>
              <option value="Metformin">Metformin</option>
              <option value="Amlodipine">Amlodipine</option>
              <option value="Atorvastatin">Atorvastatin</option>
              <option value="Aspirin">Aspirin</option>
            </select>

            {/* Filter by Status */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-[#080D19] border border-[#1E2D4A] text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="All Status">All Status</option>
              <option value="Taken">Taken</option>
              <option value="Missed">Missed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1E2D4A] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Medicine</th>
                <th className="py-2.5 px-3">Scheduled Time</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2D4A]/60">
              {paginatedLogs.map((log) => {
                const isTaken = log.status === 'Taken';
                return (
                  <tr key={log.id} className="hover:bg-[#172338]/40 transition-colors">
                    <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">
                      {log.date}
                    </td>
                    <td className="py-3 px-3 font-bold text-white">
                      {log.medicineName}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono">
                      {log.scheduledTime}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isTaken
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {isTaken ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {log.notes}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination matching video */}
        <div className="flex items-center justify-between pt-3 border-t border-[#1E2D4A] text-xs text-slate-400">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length} logs
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg bg-[#080D19] border border-[#1E2D4A] disabled:opacity-40 hover:text-white"
            >
              Prev
            </button>
            <span className="font-mono text-white">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-lg bg-[#080D19] border border-[#1E2D4A] disabled:opacity-40 hover:text-white"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Recent Updates matching bottom of video */}
      <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-5 shadow-lg space-y-3">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          Recent Updates
        </h4>

        <div className="divide-y divide-[#1E2D4A] text-xs">
          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-slate-200 font-medium">Paracetamol dose logged at 08:05 AM</span>
            </div>
            <span className="text-slate-500 font-mono text-[11px]">15 min ago</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              <span className="text-slate-200 font-medium">Metformin (1:00 PM): reminder missed — no confirmation received</span>
            </div>
            <span className="text-slate-500 font-mono text-[11px]">2 hrs ago</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span className="text-slate-200 font-medium">Reminder schedule updated for Amlodipine</span>
            </div>
            <span className="text-slate-500 font-mono text-[11px]">Yesterday</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="text-slate-200 font-medium">Critical: Metformin missed for 3 consecutive days</span>
            </div>
            <span className="text-slate-500 font-mono text-[11px]">2 days ago</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span className="text-slate-200 font-medium">Monthly report generated for April 2026</span>
            </div>
            <span className="text-slate-500 font-mono text-[11px]">5 days ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};
