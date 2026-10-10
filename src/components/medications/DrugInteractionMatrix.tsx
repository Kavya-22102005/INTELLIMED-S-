import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  Sparkles,
  Coffee,
  Apple,
  Wine,
  Activity,
  ArrowRight,
} from 'lucide-react';

export const DrugInteractionMatrix: React.FC = () => {
  const { medications, showToast } = useApp();
  const [selectedDrugA, setSelectedDrugA] = useState<string>('Amlodipine');
  const [selectedDrugB, setSelectedDrugB] = useState<string>('Grapefruit Juice');

  const drugItems = [
    'Amlodipine',
    'Atorvastatin',
    'Metformin',
    'Lisinopril',
    'Paracetamol',
    'Grapefruit Juice',
    'High Potassium Foods',
    'Alcohol',
    'Caffeine',
  ];

  // Clinical interaction matrix knowledgebase
  const interactionRules: Record<
    string,
    {
      severity: 'Safe' | 'Moderate' | 'Warning';
      badgeText: string;
      title: string;
      mechanism: string;
      recommendation: string;
    }
  > = {
    'Amlodipine+Grapefruit Juice': {
      severity: 'Warning',
      badgeText: 'Severe Bioavailability Spike',
      title: 'CYP3A4 Inhibition by Furanocoumarins',
      mechanism:
        'Grapefruit compounds inhibit intestinal CYP3A4 enzymes, dramatically raising serum Amlodipine concentration.',
      recommendation: 'Avoid consuming grapefruit juice or whole grapefruit while on Amlodipine therapy.',
    },
    'Atorvastatin+Grapefruit Juice': {
      severity: 'Warning',
      badgeText: 'Elevated Statin Level',
      title: 'Increased Risk of Myopathy & Rhabdomyolysis',
      mechanism:
        'Grapefruit inhibits hepatic breakdown of Atorvastatin, increasing circulating statin levels by up to 2.5x.',
      recommendation: 'Limit or avoid grapefruit intake; switch to citrus fruits like oranges or limes.',
    },
    'Lisinopril+High Potassium Foods': {
      severity: 'Moderate',
      badgeText: 'Hyperkalemia Caution',
      title: 'Serum Potassium Accumulation',
      mechanism:
        'ACE inhibitors reduce aldosterone secretion, causing potassium retention in kidneys.',
      recommendation:
        'Avoid excessive consumption of salt substitutes containing potassium chloride and bananas without doctor guidance.',
    },
    'Metformin+Alcohol': {
      severity: 'Warning',
      badgeText: 'Lactic Acidosis Risk',
      title: 'Hepatic Lactate Metabolism Delay',
      mechanism:
        'Acute or chronic alcohol consumption potentiates the risk of Metformin-associated lactic acidosis (MALA).',
      recommendation: 'Avoid binge drinking and excessive alcohol intake while on oral biguanide therapy.',
    },
    'Amlodipine+Atorvastatin': {
      severity: 'Safe',
      badgeText: 'Synergistic Combination',
      title: 'Cardiovascular Risk Reduction',
      mechanism:
        'Amlodipine lowers vascular resistance while Atorvastatin stabilizes coronary plaque without adverse pharmacokinetic overlap.',
      recommendation: 'Standard dual therapy recommended for hypertension and hyperlipidemia co-management.',
    },
    'Metformin+Amlodipine': {
      severity: 'Safe',
      badgeText: 'No Direct Interaction',
      title: 'Parallel Glycemic & Pressure Control',
      mechanism: 'Metformin and Amlodipine utilize different clearance pathways (renal vs hepatic).',
      recommendation: 'Safe to take together; maintain standard meal timings.',
    },
    'Paracetamol+Alcohol': {
      severity: 'Moderate',
      badgeText: 'Hepatotoxicity Risk',
      title: 'Glutathione Depletion',
      mechanism:
        'Alcohol induces CYP2E1, accelerating production of toxic metabolite NAPQI which taxes liver reserves.',
      recommendation: 'Do not consume alcohol when taking regular or acute doses of acetaminophen/paracetamol.',
    },
  };

  const currentKey = `${selectedDrugA}+${selectedDrugB}`;
  const reverseKey = `${selectedDrugB}+${selectedDrugA}`;
  const result =
    interactionRules[currentKey] ||
    interactionRules[reverseKey] || {
      severity: 'Safe' as const,
      badgeText: 'No Significant Interaction',
      title: 'Compatible Therapeutic Window',
      mechanism:
        'No major adverse metabolic antagonism or enzyme competition found for this specific pairing.',
      recommendation: 'Proceed with normal prescribed schedule and hydration.',
    };

  return (
    <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2D4A]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Clinical Drug & Food Interaction Radar
            </h3>
            <p className="text-xs text-slate-400">
              Interactive pharmacovigilance matrix checking synergy, food precautions, and hepatic pathways.
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold font-mono self-start sm:self-auto">
          Live Clinical KB
        </span>
      </div>

      {/* Selectors Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Select Primary Agent / Medicine
          </label>
          <select
            value={selectedDrugA}
            onChange={(e) => setSelectedDrugA(e.target.value)}
            className="w-full bg-[#172338] border border-[#1E2D4A] text-white text-xs rounded-xl p-3 focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            {drugItems.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Compare Against Medicine or Dietary Factor
          </label>
          <select
            value={selectedDrugB}
            onChange={(e) => setSelectedDrugB(e.target.value)}
            className="w-full bg-[#172338] border border-[#1E2D4A] text-white text-xs rounded-xl p-3 focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            {drugItems.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Interactive Safety Card Output */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          result.severity === 'Warning'
            ? 'bg-red-950/20 border-red-500/40 text-red-200'
            : result.severity === 'Moderate'
            ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
            : 'bg-[#172338] border-emerald-500/40 text-emerald-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2D4A]/60">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                result.severity === 'Warning'
                  ? 'bg-red-500/20 text-red-400'
                  : result.severity === 'Moderate'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {result.severity === 'Warning' ? (
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              ) : result.severity === 'Moderate' ? (
                <Info className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <h4 className="text-base font-bold text-white">{result.title}</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                {selectedDrugA} ⟷ {selectedDrugB}
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold font-mono self-start sm:self-auto ${
              result.severity === 'Warning'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : result.severity === 'Moderate'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {result.badgeText}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Biological Mechanism
            </span>
            <p className="text-slate-200 leading-relaxed">{result.mechanism}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Physician Recommendation
            </span>
            <p className="text-slate-200 leading-relaxed">{result.recommendation}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
