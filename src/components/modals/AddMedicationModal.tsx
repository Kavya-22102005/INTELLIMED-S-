import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TimingRule } from '../../types';
import { X, Pill, Clock, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AddMedicationModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { addMedication, activePatient } = useApp();

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [scheduledTime, setScheduledTime] = useState('08:00 AM');
  const [timingRule, setTimingRule] = useState<TimingRule>('After Food');
  const [category, setCategory] = useState<'Morning' | 'Afternoon' | 'Night' | 'Emergency'>('Morning');
  const [stock, setStock] = useState('30');
  const [instructions, setInstructions] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a medicine name');
      return;
    }
    if (!dosage.trim()) {
      setError('Please provide dosage');
      return;
    }

    addMedication({
      name: name.trim(),
      dosage: dosage.trim(),
      scheduledTime,
      timingRule,
      category,
      inventory: parseInt(stock, 10) || 30,
      totalStock: parseInt(stock, 10) || 30,
      status: 'pending',
      instructions: instructions || `Take ${dosage} ${timingRule.toLowerCase()}`,
      patientId: activePatient.id,
    });

    setName('');
    setDosage('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#111B2D] border border-[#1E2D4A] rounded-2xl shadow-2xl overflow-y-auto max-h-[92vh] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2D4A] bg-[#172338]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add New Medicine</h3>
              <p className="text-xs text-slate-400">Configure schedule & dosage regimen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Medicine Name
            </label>
            <input
              type="text"
              placeholder="e.g. Paracetamol"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              className="w-full bg-[#080D19] border border-[#1E2D4A] text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Dosage
              </label>
              <input
                type="text"
                placeholder="e.g. 500mg"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="w-full bg-[#080D19] border border-[#1E2D4A] text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Time
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="08:00 AM"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-[#080D19] border border-[#1E2D4A] text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
                />
                <Clock className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Rule
              </label>
              <select
                value={timingRule}
                onChange={(e) => setTimingRule(e.target.value as TimingRule)}
                className="w-full bg-[#080D19] border border-[#1E2D4A] text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400"
              >
                <option value="After Food">After Food</option>
                <option value="Before Food">Before Food</option>
                <option value="With Food">With Food</option>
                <option value="Empty Stomach">Empty Stomach</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Stock (Pills)
              </label>
              <input
                type="number"
                placeholder="30"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full bg-[#080D19] border border-[#1E2D4A] text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['Morning', 'Afternoon', 'Night', 'Emergency'] as const).map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    category === cat
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                      : 'bg-[#080D19] border-[#1E2D4A] text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E2D4A]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              Save Medicine
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
