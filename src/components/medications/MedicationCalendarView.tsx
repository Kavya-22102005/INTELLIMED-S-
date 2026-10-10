import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Medication } from '../../types';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Pill,
  Sparkles,
  AlertCircle,
  Plus,
} from 'lucide-react';

interface Props {
  onAddMedicine: () => void;
}

export const MedicationCalendarView: React.FC<Props> = ({ onAddMedicine }) => {
  const { medications, markDoseTaken, snoozeDose, showToast } = useApp();

  // Calendar month state (defaults to current date, e.g., October 2026)
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 9, 9)); // Oct 9, 2026
  const [selectedDay, setSelectedDay] = useState<number>(9);
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Morning' | 'Afternoon' | 'Night'>('All');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Days in month calculation
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 for Sun, 1 for Mon...
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(1);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(1);
  };

  const jumpToToday = () => {
    const today = new Date(2026, 9, 9);
    setCurrentDate(today);
    setSelectedDay(9);
    showToast('Jumped to current date: October 9, 2026');
  };

  // Filtered medications by category
  const activeMeds = medications.filter((m) => {
    if (categoryFilter === 'All') return true;
    return m.category === categoryFilter;
  });

  // Calculate monthly metrics
  const totalDosesInMonth = daysInMonth * activeMeds.length;
  const morningCount = medications.filter((m) => m.category === 'Morning').length * daysInMonth;
  const afternoonCount = medications.filter((m) => m.category === 'Afternoon').length * daysInMonth;
  const nightCount = medications.filter((m) => m.category === 'Night').length * daysInMonth;

  // Selected date formatted
  const selectedDateObj = new Date(year, month, selectedDay);
  const formattedSelectedDate = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const isToday = (dayNum: number) => {
    return year === 2026 && month === 9 && dayNum === 9;
  };

  const isPast = (dayNum: number) => {
    if (year < 2026) return true;
    if (year === 2026 && month < 9) return true;
    if (year === 2026 && month === 9 && dayNum < 9) return true;
    return false;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Month Navigation & Stats Header */}
      <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Navigation controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#080D19] border border-[#1E2D4A] p-1 rounded-xl">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#172338] transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={jumpToToday}
              className="px-3 py-1 rounded-lg text-xs font-semibold text-cyan-400 hover:bg-[#172338] transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#172338] transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div>
            <h2 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-cyan-400" />
              {monthNames[month]} {year}
            </h2>
            <p className="text-xs text-slate-400">
              Interactive monthly medication adherence and dosage planner
            </p>
          </div>
        </div>

        {/* Quick category filters & dose summaries */}
        <div className="flex flex-wrap items-center gap-2">
          {(['All', 'Morning', 'Afternoon', 'Night'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-[#172338] border border-[#1E2D4A] text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}

          <button
            onClick={onAddMedicine}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer ml-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Dose</span>
          </button>
        </div>
      </div>

      {/* Monthly Dose Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-[#111B2D] border border-[#1E2D4A] flex items-center justify-between">
          <span className="text-slate-400">Month Scheduled</span>
          <span className="font-bold text-white font-mono text-sm">{totalDosesInMonth} doses</span>
        </div>
        <div className="p-3 rounded-xl bg-[#111B2D] border border-[#1E2D4A] flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            Morning
          </span>
          <span className="font-bold text-white font-mono text-sm">{morningCount}</span>
        </div>
        <div className="p-3 rounded-xl bg-[#111B2D] border border-[#1E2D4A] flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            Afternoon
          </span>
          <span className="font-bold text-white font-mono text-sm">{afternoonCount}</span>
        </div>
        <div className="p-3 rounded-xl bg-[#111B2D] border border-[#1E2D4A] flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-purple-400">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            Night
          </span>
          <span className="font-bold text-white font-mono text-sm">{nightCount}</span>
        </div>
      </div>

      {/* Main Grid: Full-Month Calendar View */}
      <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-4 lg:p-6 shadow-xl overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
          <div className="py-2 text-red-400">Sun</div>
          <div className="py-2">Mon</div>
          <div className="py-2">Tue</div>
          <div className="py-2">Wed</div>
          <div className="py-2">Thu</div>
          <div className="py-2">Fri</div>
          <div className="py-2 text-slate-300">Sat</div>
        </div>

        {/* Calendar days cells */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {/* Previous month trailing days */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => {
            const prevDayNum = daysInPrevMonth - firstDayOfWeek + i + 1;
            return (
              <div
                key={`prev-${i}`}
                className="min-h-[90px] sm:min-h-[115px] p-2 rounded-xl bg-[#080D19]/40 border border-[#1E2D4A]/30 opacity-30 select-none"
              >
                <span className="text-xs font-mono text-slate-600">{prevDayNum}</span>
              </div>
            );
          })}

          {/* Current month days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const isCurrentToday = isToday(dayNum);
            const isDaySelected = selectedDay === dayNum;
            const past = isPast(dayNum);

            return (
              <div
                key={`day-${dayNum}`}
                onClick={() => {
                  setSelectedDay(dayNum);
                  showToast(`Selected October ${dayNum}, 2026 schedule`);
                }}
                className={`min-h-[95px] sm:min-h-[120px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                  isDaySelected
                    ? 'bg-[#172338] border-cyan-400 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/50'
                    : isCurrentToday
                    ? 'bg-[#172338]/80 border-cyan-500/40 hover:border-cyan-400'
                    : 'bg-[#0B1220]/70 border-[#1E2D4A] hover:bg-[#172338]/50 hover:border-slate-500'
                }`}
              >
                {/* Cell Header: Day Number + Dose Count Badge */}
                <div className="flex items-center justify-between">
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                      isCurrentToday
                        ? 'bg-cyan-500 text-[#080D19] shadow-sm shadow-cyan-400'
                        : isDaySelected
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {isCurrentToday && (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 hidden sm:inline-block">
                      Today
                    </span>
                  )}
                </div>

                {/* Doses Pills Preview inside cell */}
                <div className="space-y-1 mt-1.5 flex-1">
                  {activeMeds.slice(0, 3).map((med) => {
                    const isMorning = med.category === 'Morning';
                    const isAfternoon = med.category === 'Afternoon';
                    const isNight = med.category === 'Night';

                    const dotColor = isMorning
                      ? 'bg-cyan-400'
                      : isAfternoon
                      ? 'bg-blue-400'
                      : isNight
                      ? 'bg-purple-400'
                      : 'bg-amber-400';

                    return (
                      <div
                        key={med.id}
                        className={`px-1.5 py-0.5 rounded text-[10px] truncate flex items-center gap-1 ${
                          past
                            ? 'bg-emerald-950/20 text-emerald-300 border border-emerald-900/30'
                            : isCurrentToday && med.status === 'taken'
                            ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                            : 'bg-[#172338] text-slate-200 border border-[#1E2D4A]'
                        }`}
                        title={`${med.scheduledTime}: ${med.name} ${med.dosage}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`}></span>
                        <span className="truncate hidden sm:inline">{med.name}</span>
                        <span className="truncate sm:hidden">{med.name.slice(0, 3)}</span>
                      </div>
                    );
                  })}

                  {activeMeds.length > 3 && (
                    <span className="text-[9px] text-slate-400 font-semibold block px-1">
                      +{activeMeds.length - 3} more
                    </span>
                  )}
                </div>

                {/* Bottom status dot */}
                <div className="text-[9px] text-slate-500 font-mono mt-1 text-right">
                  {past ? (
                    <span className="text-emerald-400">✓ Completed</span>
                  ) : isCurrentToday ? (
                    <span className="text-cyan-400">● Due Today</span>
                  ) : (
                    <span>{activeMeds.length} planned</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Inspector Panel */}
      <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1E2D4A]">
          <div>
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">
              SCHEDULED DOSES FOR SELECTED DATE
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              {formattedSelectedDate}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-bold font-mono">
              {activeMeds.length} Prescribed Medications
            </span>
          </div>
        </div>

        {/* Detailed doses grid for selected day */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeMeds.map((med) => {
            const isTaken = isPast(selectedDay) || (isToday(selectedDay) && med.status === 'taken');

            return (
              <div
                key={med.id}
                className="bg-[#172338] border border-[#1E2D4A] rounded-xl p-4 flex flex-col justify-between hover:border-slate-500 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-cyan-400 flex items-center justify-center">
                        <Pill className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{med.name}</h4>
                        <span className="text-xs text-slate-400 font-medium">{med.dosage}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        med.category === 'Morning'
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : med.category === 'Afternoon'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-purple-500/20 text-purple-400'
                      }`}
                    >
                      {med.category}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#1E2D4A] space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        Time:
                      </span>
                      <span className="font-bold text-white font-mono">{med.scheduledTime}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500">Condition:</span>
                      <span>{med.timingRule}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 italic pt-1">
                      {med.instructions}
                    </p>
                  </div>
                </div>

                {/* Day Action Buttons */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#1E2D4A]">
                  {isTaken ? (
                    <div className="w-full py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Dose Completed</span>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => markDoseTaken(med.id)}
                        className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                      >
                        Mark Taken
                      </button>
                      <button
                        onClick={() => snoozeDose(med.id, 15)}
                        className="px-3 py-1.5 bg-[#111B2D] hover:bg-[#1E2D4A] text-slate-300 text-xs rounded-lg border border-[#1E2D4A] transition-colors cursor-pointer"
                      >
                        Snooze
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
