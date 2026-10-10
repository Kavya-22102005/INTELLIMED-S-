import React, { useState } from 'react';
import { Medication } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, PackagePlus, Calendar, DollarSign, Building2, Hash, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  medication: Medication | null;
}

export const RefillStockModal: React.FC<Props> = ({ isOpen, onClose, medication }) => {
  const { refillMedicationStock } = useApp();

  const [quantity, setQuantity] = useState<number>(30);
  const [supplier, setSupplier] = useState<string>('Apollo Health Pharmacy');
  const [batchNumber, setBatchNumber] = useState<string>('');
  const [cost, setCost] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('2027-12-31');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen || !medication) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || quantity <= 0) {
      setError('Please specify a valid refill quantity greater than 0');
      return;
    }

    refillMedicationStock(medication.id, Number(quantity), {
      supplierPharmacy: supplier.trim() || undefined,
      batchNumber: batchNumber.trim() || undefined,
      cost: cost.trim() ? (cost.startsWith('$') ? cost : `$${cost}`) : undefined,
      expiryDate: expiryDate || undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  const quickPillOptions = [10, 20, 30, 60, 90];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#111B2D] border border-[#1E2D4A] rounded-2xl shadow-2xl overflow-y-auto max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2D4A] bg-[#172338]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Record Medicine Refill</h3>
              <p className="text-xs text-slate-400">
                Replenishing stock for <strong className="text-cyan-300">{medication.name}</strong> ({medication.dosage})
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

        {/* Current status pill */}
        <div className="px-6 pt-4 pb-2 bg-[#0B1220]/60 border-b border-[#1E2D4A] flex items-center justify-between text-xs">
          <span className="text-slate-400">Current In-Stock:</span>
          <span className="font-bold text-white font-mono">
            {medication.inventory} units / {medication.totalStock} capacity
          </span>
          <span className="text-slate-400">Projected after refill:</span>
          <span className="font-bold text-emerald-400 font-mono">
            {medication.inventory + (Number(quantity) || 0)} units
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quantity Added with quick chips */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Refill Quantity (Units / Pills) *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => {
                  setQuantity(Math.max(1, parseInt(e.target.value, 10) || 0));
                  setError('');
                }}
                className="w-32 bg-[#080D19] border border-[#1E2D4A] text-white text-sm rounded-xl px-3.5 py-2 focus:outline-none focus:border-cyan-400 font-mono font-bold"
                required
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                {quickPillOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setQuantity(opt)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
                      quantity === opt
                        ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                        : 'bg-[#172338] border-[#1E2D4A] text-slate-300 hover:text-white hover:border-slate-500'
                    }`}
                  >
                    +{opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pharmacy & Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Pharmacy / Supplier
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. Apollo Health Pharmacy"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full bg-[#080D19] border border-[#1E2D4A] text-white text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Total Purchase Cost
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. 18.50"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="w-full bg-[#080D19] border border-[#1E2D4A] text-white text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Batch number & Expiry Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Batch / Lot Number
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. MET-8921"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full bg-[#080D19] border border-[#1E2D4A] text-white text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-cyan-400 placeholder:text-slate-600 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Batch Expiry Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full bg-[#080D19] border border-[#1E2D4A] text-white text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-cyan-400 [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          {/* Refill Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Refill Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Prescribed 90-day renewal cycle"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#080D19] border border-[#1E2D4A] text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
            />
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
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-2"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Confirm & Add Stock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
