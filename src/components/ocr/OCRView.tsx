import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Upload,
  CheckCircle2,
  Sparkles,
  Zap,
  Clock,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Plus,
} from 'lucide-react';

export const OCRView: React.FC = () => {
  const { addMedication, activePatient, showToast } = useApp();

  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    name: string;
    dosage: string;
    frequency: string;
    expiryDate: string;
    batchNumber: string;
    storageInfo: string;
    warnings: string;
    category: 'Morning' | 'Afternoon' | 'Night' | 'Emergency';
    accuracy: string;
  } | null>(null);

  const sampleLabels = [
    {
      title: 'Amoxicillin 500mg Label',
      name: 'Amoxicillin Trihydrate',
      dosage: '500mg',
      frequency: 'TDS (Every 8 hours)',
      expiryDate: '12/2026',
      batchNumber: 'BT-88942-X',
      storageInfo: 'Store below 25°C in a dry place',
      warnings: 'Complete full course even if symptoms subside',
      category: 'Morning' as const,
      accuracy: '98.4%',
    },
    {
      title: 'Metformin 500mg Rx',
      name: 'Metformin Hydrochloride',
      dosage: '500mg',
      frequency: 'Once Daily (With Meals)',
      expiryDate: '08/2027',
      batchNumber: 'MF-33109',
      storageInfo: 'Keep tightly closed in moisture-resistant container',
      warnings: 'Do not crush or chew prolonged release tablets',
      category: 'Afternoon' as const,
      accuracy: '99.1%',
    },
  ];

  const handleProcess = (sample?: (typeof sampleLabels)[0]) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const data = sample || sampleLabels[0];
      setExtractedData(data);
      showToast(`OCR successfully extracted 8 fields (${data.accuracy} confidence)`);
    }, 1800);
  };

  const handleAddToMedications = () => {
    if (!extractedData) return;
    addMedication({
      name: extractedData.name,
      dosage: extractedData.dosage,
      scheduledTime: '08:00 AM',
      timingRule: 'After Food',
      category: extractedData.category,
      inventory: 30,
      totalStock: 30,
      status: 'pending',
      instructions: `${extractedData.frequency}. ${extractedData.warnings}`,
      patientId: activePatient.id,
    });
    showToast(`Added ${extractedData.name} to active prescriptions`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
          <FileText className="w-7 h-7 text-cyan-400" />
          Prescription & Label OCR
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Extract clinical packaging data, expiration timestamps, and dosage regimens with high-fidelity computer vision.
        </p>
      </div>

      {/* Main 2-column workspace matching reference video */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left Box: Upload Prescription Label */}
        <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-2">Upload Prescription Label</h3>
            <p className="text-xs text-slate-400 mb-5">
              Drag & drop an image of a medicine bottle, blister pack, or prescription document.
            </p>

            {/* Dropzone container matching video */}
            <div
              onClick={() => handleProcess()}
              className="border-2 border-dashed border-[#1E2D4A] hover:border-cyan-500/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-[#080D19]/60 hover:bg-[#080D19] group"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8" />
              </div>
              <button
                type="button"
                className="px-5 py-2 rounded-xl bg-[#172338] group-hover:bg-blue-600 group-hover:text-white border border-[#1E2D4A] text-xs font-semibold text-slate-200 transition-all cursor-pointer"
              >
                Browse Files
              </button>
              <p className="text-[11px] text-slate-500 mt-3">
                Supported: JPG, PNG, PDF, WEBP — Max 10MB
              </p>
            </div>

            {/* Quick Demo Pre-set Labels */}
            <div className="mt-4 pt-4 border-t border-[#1E2D4A]">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                Quick Demonstration Samples:
              </span>
              <div className="flex flex-wrap gap-2">
                {sampleLabels.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleProcess(sample)}
                    className="px-3 py-1.5 rounded-lg bg-[#172338] hover:bg-[#1E2D4A] border border-[#1E2D4A] text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    Load {sample.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* WHAT GETS EXTRACTED section matching video */}
          <div className="mt-6 pt-5 border-t border-[#1E2D4A]">
            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              What Gets Extracted
            </h5>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                Medicine Name
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                Dosage & Strength
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                Expiry Date
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                Frequency & Timing
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                Batch Number
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                Storage Info
              </span>
            </div>
          </div>
        </div>

        {/* Right Box: Extraction Results or Placeholder matching video */}
        <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          {isProcessing ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
              <RefreshCw className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
              <h4 className="text-base font-bold text-white">Running Optical Character Recognition</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Scanning typography glyphs, bounding boxes, and FDA barcode registries...
              </p>
            </div>
          ) : !extractedData ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center my-auto">
              <div className="w-16 h-16 rounded-2xl bg-[#172338] border border-[#1E2D4A] flex items-center justify-center text-slate-500 mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white">No Label Scanned Yet</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Upload a prescription label or medicine packaging to extract all clinical details automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-[#1E2D4A]">
                <div>
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                    Extraction Completed
                  </span>
                  <h3 className="text-lg font-bold text-white">{extractedData.name}</h3>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                  {extractedData.accuracy} Match
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#172338] border border-[#1E2D4A]">
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                    Dosage & Strength
                  </span>
                  <span className="font-bold text-white text-sm mt-0.5 block">
                    {extractedData.dosage}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#172338] border border-[#1E2D4A]">
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                    Expiry Date
                  </span>
                  <span className="font-bold text-cyan-400 text-sm mt-0.5 block font-mono">
                    {extractedData.expiryDate}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#172338] border border-[#1E2D4A]">
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                    Batch Number
                  </span>
                  <span className="font-mono text-white text-xs mt-0.5 block">
                    {extractedData.batchNumber}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#172338] border border-[#1E2D4A]">
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                    Prescribed Cadence
                  </span>
                  <span className="font-semibold text-white text-xs mt-0.5 block">
                    {extractedData.frequency}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#172338] border border-[#1E2D4A] text-xs">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                  Storage & Preservation Instructions
                </span>
                <p className="text-slate-200 mt-1">{extractedData.storageInfo}</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs">
                <span className="text-amber-400 block text-[10px] font-semibold uppercase flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Clinical Advisory & Warnings
                </span>
                <p className="text-amber-200 mt-1">{extractedData.warnings}</p>
              </div>

              <button
                onClick={handleAddToMedications}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Directly to My Medications</span>
              </button>
            </div>
          )}

          {/* Three Metric Pills matching bottom of video */}
          <div className="grid grid-cols-3 gap-3 pt-5 border-t border-[#1E2D4A] text-center">
            <div className="p-3 rounded-xl bg-[#080D19] border border-[#1E2D4A]">
              <div className="text-lg font-bold text-white font-mono">97%</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Accuracy</div>
            </div>
            <div className="p-3 rounded-xl bg-[#080D19] border border-[#1E2D4A]">
              <div className="text-lg font-bold text-cyan-400 font-mono">&lt;3s</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Scan Time</div>
            </div>
            <div className="p-3 rounded-xl bg-[#080D19] border border-[#1E2D4A]">
              <div className="text-lg font-bold text-emerald-400 font-mono">8+</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Fields</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
