import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AddMedicationModal } from '../modals/AddMedicationModal';
import { MedicationCalendarView } from './MedicationCalendarView';
import { MedicineInventoryView } from './MedicineInventoryView';
import { DrugInteractionMatrix } from './DrugInteractionMatrix';
import { MedicineCategory, Medication } from '../../types';
import {
  Plus,
  Clock,
  Package,
  CheckCircle2,
  AlertTriangle,
  MoreVertical,
  Trash2,
  Edit2,
  Pill,
  Search,
  LayoutGrid,
  Calendar,
  Boxes,
} from 'lucide-react';

export const MedicationsView: React.FC = () => {
  const {
    medications,
    markDoseTaken,
    deleteMedication,
    showToast,
  } = useApp();

  const [viewMode, setViewMode] = useState<'cards' | 'calendar' | 'inventory'>('cards');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<MedicineCategory | 'All'>('All');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filterTabs: (MedicineCategory | 'All')[] = [
    'All',
    'Morning',
    'Afternoon',
    'Night',
    'Emergency',
    'Low Stock',
  ];

  const filteredMeds = medications.filter((m) => {
    // Search query filter
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.dosage.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    // Category filter
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Low Stock') return m.inventory <= 10;
    return m.category === activeFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Header matching video */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Medicine Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track inventory, adjust schedules, and monitor adherence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
          {/* Segmented View Switcher: Cards vs Month Calendar vs Stock & Refills */}
          <div className="flex items-center bg-[#111B2D] border border-[#1E2D4A] p-1 rounded-xl overflow-x-auto scrollbar-none">
            <button
              onClick={() => {
                setViewMode('cards');
                showToast('Switched to Card View');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => {
                setViewMode('calendar');
                showToast('Switched to Full-Month Calendar View');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Month Calendar</span>
            </button>
            <button
              onClick={() => {
                setViewMode('inventory');
                showToast('Switched to Stock & Refill Tracker');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'inventory'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Stock & Refills</span>
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* Conditionally render Full-Month Calendar, Stock & Refills, or Cards View */}
      {viewMode === 'inventory' ? (
        <MedicineInventoryView />
      ) : viewMode === 'calendar' ? (
        <MedicationCalendarView onAddMedicine={() => setIsAddModalOpen(true)} />
      ) : (
        <>
          {/* Filter Pills row matching video */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {filterTabs.map((tab) => {
                const isActive = activeFilter === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveFilter(tab)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-cyan-400 text-[#080D19] shadow-md shadow-cyan-400/20'
                        : 'bg-[#111B2D] border border-[#1E2D4A] text-slate-300 hover:text-white hover:bg-[#172338]'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Quick Search inside medications */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search medicine..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111B2D] border border-[#1E2D4A] text-xs text-white rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
              />
            </div>
          </div>

      {/* Medication Cards Grid */}
      {filteredMeds.length === 0 ? (
        <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-12 text-center">
          <Pill className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">
            No medications found for this category
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try choosing a different filter above or click "Add Medicine" to create a new prescription entry.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMeds.map((med) => {
            const isLowStock = med.inventory <= 10;
            const isTaken = med.status === 'taken';

            return (
              <div
                key={med.id}
                className="bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-5 relative shadow-lg hover:border-slate-500 transition-all group"
              >
                {/* Top header of card */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-cyan-400 flex items-center justify-center">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {med.name}
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">
                        {med.dosage}
                      </span>
                    </div>
                  </div>

                  {/* 3-dots menu button */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setActiveMenuId(activeMenuId === med.id ? null : med.id)
                      }
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuId === med.id && (
                      <div className="absolute right-0 mt-1 w-32 bg-[#172338] border border-[#1E2D4A] rounded-xl shadow-2xl p-1 z-30">
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            setIsAddModalOpen(true);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-[#1E2D4A] rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            deleteMedication(med.id);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-950/40 rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Schedule and Inventory grid */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#1E2D4A]">
                  <div>
                    <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-400" />
                      Schedule
                    </span>
                    <p className="text-xs font-bold text-white mt-1">
                      {med.scheduledTime}
                    </p>
                    <span className="text-[10px] text-slate-400">{med.timingRule}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase flex items-center gap-1">
                      <Package className="w-3 h-3 text-cyan-400" />
                      Inventory
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className={`text-xs font-bold ${
                          isLowStock ? 'text-red-400' : 'text-white'
                        }`}
                      >
                        {med.inventory} pills left
                      </span>
                    </div>
                    {isLowStock && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-950/60 border border-red-500/40 text-[10px] text-red-300 font-semibold mt-0.5">
                        <AlertTriangle className="w-3 h-3" />
                        Low Stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Action buttons matching video */}
                <div className="flex items-center gap-2.5 mt-5">
                  <button
                    onClick={() => {
                      showToast(`Editing ${med.name}`);
                      setIsAddModalOpen(true);
                    }}
                    className="flex-1 py-2 px-3 bg-[#172338] hover:bg-[#1E2D4A] border border-[#1E2D4A] text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer text-center"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => markDoseTaken(med.id)}
                    className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isTaken
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30'
                    }`}
                  >
                    {isTaken ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Taken</span>
                      </>
                    ) : (
                      <span>Mark as Taken</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>
      )}

      {/* Clinical Drug & Food Interaction Matrix */}
      <DrugInteractionMatrix />

      {/* Modal for adding medicine */}
      <AddMedicationModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
};
