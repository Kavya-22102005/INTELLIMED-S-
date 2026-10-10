import React, { useState, useEffect } from 'react';
import { Medication } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Settings2, Sliders, Calendar, Package, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  medication: Medication | null;
}

export const EditStockModal: React.FC<Props> = ({ isOpen, onClose, medication }) => {
  const { updateMedicationStockConfig } = useApp();

  const [currentStock, setCurrentStock] = useState<number>(30);
  const [totalStock, setTotalStock] = useState<number>(60);
  const [unitsPerDose, setUnitsPerDose] = useState<number>(1);
  const [dailyDosesCount, setDailyDosesCount] = useState<number>(1);
  const [reorderThreshold, setReorderThreshold] = useState<number>(8);
  const [expiryDate, setExpiryDate] = useState<string>('2027-12-31');

  useEffect(() => {
    if (medication) {
      setCurrentStock(medication.inventory);
      setTotalStock(medication.totalStock || 30);
      setUnitsPerDose(medication.unitsPerDose || 1);
      setDailyDosesCount(medication.dailyDosesCount || 1);
      setReorderThreshold(medication.reorderThreshold ?? 8);
      setExpiryDate(medication.expiryDate || '2027-12-31');
    }
  }, [medication]);

  if (!isOpen || !medication) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateMedicationStockConfig(medication.id, {
      inventory: Math.max(0, currentStock),
      totalStock: Math.max(currentStock, totalStock),
      unitsPerDose: Math.max(1, unitsPerDose),
      dailyDosesCount: Math.max(1, dailyDosesCount),
      reorderThreshold: Math.max(0, reorderThreshold),
      expiryDate,
    });

    onClose();
  };

  const dailyBurnRate = unitsPerDose * dailyDosesCount;
  const estimatedDays = dailyBurnRate > 0 ? Math.floor(currentStock / dailyBurnRate) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#111B2D] border border-[#1E2D4A] rounded-2xl shadow-2xl overflow-y-auto max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2D4A] bg-[#172338]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Edit Stock & Refill Thresholds</h3>
              <p className="text-xs text-slate-400">
                Inventory rules for <strong className="text-cyan-300">{medication.name}</strong> ({medication.dosage})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Forecast Preview Strip */}
        <div className="px-6 py-3 bg-[#0B1220]/70 border-b border-[#1E2D4A] grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Daily Burn</span>
            <span className="font-bold text-white font-mono">
              {dailyBurnRate} pills/day
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Run-Out Est.</span>
            <span className={`font-bold font-mono ${estimatedDays <= 5 ? 'text-red-400' : 'text-cyan-400'}`}>
              ~{estimatedDays} days left
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Low Alert At</span>
            <span className="font-bold text-amber-400 font-mono">
              ≤ {reorderThreshold} pills
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Stock Counts */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-cyan-400" />
                <span>Current Stock (Pills)</span>
              </label>
              <input
                type="number"
                min="0"
                value={currentStock}
                onChange={(e) => setCurrentStock(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-[#080D19] border border-[#1E2D4A] text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400 font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Total Capacity / Pack Size
              </label>
              <input
                type="number"
                min="1"
                value={totalStock}
                onChange={(e) => setTotalStock(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-[#080D19] border border-[#1E2D4A] text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
          </div>

          {/* Consumption Dynamics: Units per dose & Daily doses */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Units Per Dose (Pills)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={unitsPerDose}
                onChange={(e) => setUnitsPerDose(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-[#080D19] border border-[#1E2D4A] text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Deducted per 'Taken' dose</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Daily Scheduled Doses
              </label>
              <input
                type="number"
                min="1"
                max="8"
                value={dailyDosesCount}
                onChange={(e) => setDailyDosesCount(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-[#080D19] border border-[#1E2D4A] text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Expected times taken/day</span>
            </div>
          </div>

          {/* Reorder Threshold & Expiry Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Reorder Threshold</span>
              </label>
              <input
                type="number"
                min="0"
                value={reorderThreshold}
                onChange={(e) => setReorderThreshold(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-[#080D19] border border-[#1E2D4A] text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400 font-mono font-bold text-amber-300"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Trigger low stock reminder</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Batch Expiry Date</span>
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-[#080D19] border border-[#1E2D4A] text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400 [color-scheme:dark]"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Current packaging expiry</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E2D4A]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center gap-2"
            >
              <Sliders className="w-4 h-4" />
              <span>Save Inventory Rules</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
