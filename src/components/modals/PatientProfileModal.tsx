import React, { useState, useEffect } from 'react';
import { Patient } from '../../types';
import {
  X,
  User,
  Heart,
  Activity,
  Phone,
  ShieldAlert,
  Plus,
  Stethoscope,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Scale,
  Ruler,
} from 'lucide-react';

interface PatientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient | null;
  mode: 'edit' | 'create';
  onSave: (patientData: Omit<Patient, 'id'>, id?: string) => void;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

const COMMON_ALLERGIES = [
  'Penicillin (High)',
  'Sulfa drugs',
  'Aspirin',
  'NSAIDs',
  'Peanuts',
  'Latex',
  'Codeine',
  'Amoxicillin',
  'None reported',
];

const BLOOD_GROUPS = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];

export const PatientProfileModal: React.FC<PatientProfileModalProps> = ({
  isOpen,
  onClose,
  patient,
  mode,
  onSave,
  onDelete,
  canDelete = false,
}) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Female' | 'Male' | 'Other'>('Female');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [diseases, setDiseases] = useState<string[]>([]);
  const [newAllergyInput, setNewAllergyInput] = useState('');
  const [newDiseaseInput, setNewDiseaseInput] = useState('');
  const [activeMedicationsCount, setActiveMedicationsCount] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Prefill when modal opens or patient changes
  useEffect(() => {
    if (!isOpen) return;
    setConfirmDelete(false);
    setErrorMsg('');

    if (mode === 'edit' && patient) {
      setName(patient.name || '');
      setAge(patient.age ? patient.age.toString() : '24');
      setGender(patient.gender || 'Female');
      setBloodGroup(patient.bloodGroup || 'O+');
      setHeightCm(patient.heightCm ? patient.heightCm.toString() : '165');
      setWeightKg(patient.weightKg ? patient.weightKg.toString() : '58');
      setDoctorName(patient.doctorName || 'Dr. Sarah Jenkins');
      setEmergencyContact(patient.emergencyContact || '555-0101');
      setAllergies(Array.isArray(patient.allergies) ? [...patient.allergies] : []);
      setDiseases(Array.isArray(patient.diseases) ? [...patient.diseases] : []);
      setActiveMedicationsCount(patient.activeMedicationsCount || 1);
    } else {
      // Create mode defaults
      setName('');
      setAge('');
      setGender('Female');
      setBloodGroup('O+');
      setHeightCm('165');
      setWeightKg('60');
      setDoctorName('Dr. Sarah Jenkins');
      setEmergencyContact('555-0101');
      setAllergies(['Penicillin (High)']);
      setDiseases(['None']);
      setActiveMedicationsCount(1);
    }
    setNewAllergyInput('');
    setNewDiseaseInput('');
  }, [isOpen, patient, mode]);

  if (!isOpen) return null;

  // Calculate live BMI
  const numHeight = parseFloat(heightCm);
  const numWeight = parseFloat(weightKg);
  let bmiValue: number | null = null;
  let bmiCategory = '';
  let bmiColor = 'text-cyan-400';

  if (numHeight > 50 && numWeight > 10) {
    const heightInMeters = numHeight / 100;
    bmiValue = parseFloat((numWeight / (heightInMeters * heightInMeters)).toFixed(1));
    if (bmiValue < 18.5) {
      bmiCategory = 'Underweight';
      bmiColor = 'text-amber-400';
    } else if (bmiValue < 25) {
      bmiCategory = 'Healthy weight';
      bmiColor = 'text-emerald-400';
    } else if (bmiValue < 30) {
      bmiCategory = 'Overweight';
      bmiColor = 'text-amber-400';
    } else {
      bmiCategory = 'Obese';
      bmiColor = 'text-red-400';
    }
  }

  // Allergy tags handlers
  const handleAddAllergy = (allergyToAdd?: string) => {
    const trimmed = (allergyToAdd || newAllergyInput).trim();
    if (!trimmed) return;

    // Avoid duplicates (case-insensitive)
    const exists = allergies.some((a) => a.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      setAllergies([...allergies, trimmed]);
    }
    setNewAllergyInput('');
  };

  const handleRemoveAllergy = (indexToRemove: number) => {
    setAllergies(allergies.filter((_, idx) => idx !== indexToRemove));
  };

  // Disease tags handlers
  const handleAddDisease = () => {
    const trimmed = newDiseaseInput.trim();
    if (!trimmed) return;
    if (!diseases.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
      setDiseases([...diseases, trimmed]);
    }
    setNewDiseaseInput('');
  };

  const handleRemoveDisease = (indexToRemove: number) => {
    setDiseases(diseases.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Full Name is required');
      return;
    }
    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge <= 0 || parsedAge > 130) {
      setErrorMsg('Please enter a valid age (1 - 130)');
      return;
    }

    const payload: Omit<Patient, 'id'> = {
      name: name.trim(),
      age: parsedAge,
      gender,
      bloodGroup,
      heightCm: parseInt(heightCm, 10) || 165,
      weightKg: parseInt(weightKg, 10) || 60,
      activeMedicationsCount,
      allergies: allergies.length > 0 ? allergies : ['None reported'],
      diseases: diseases.length > 0 ? diseases : ['None'],
      doctorName: doctorName.trim() || 'Dr. Sarah Jenkins',
      emergencyContact: emergencyContact.trim() || '555-0101',
    };

    onSave(payload, patient?.id);
    onClose();
  };

  const handleDeleteClick = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    if (patient && onDelete) {
      onDelete(patient.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-[#111B2D] border border-cyan-500/30 rounded-2xl p-5 sm:p-7 shadow-2xl overflow-y-auto max-h-[92vh] scrollbar-thin text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#1E2D4A] gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-white">
                  {mode === 'edit' ? 'Clinical Profile Editor' : 'Register New Patient'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">
                  {mode === 'edit' ? 'FULL EDIT' : 'NEW EHR RECORD'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {mode === 'edit'
                  ? `Editing live records for ${patient?.name || 'patient'}. Changes update instantly.`
                  : 'Enter patient biometrics, emergency contacts, and medical allergy tags.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#172338] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/60 border border-red-500/50 flex items-center gap-2 text-xs text-red-200 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          {/* SECTION 1: Identity & Demographics */}
          <div>
            <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Identity & Demographics</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Full Name */}
              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="e.g. Kavya TS"
                    className="w-full bg-[#080D19] border border-[#1E2D4A] focus:border-cyan-400 text-white text-xs rounded-xl px-3 py-2.5 outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Age */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Age <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="130"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="24"
                  className="w-full bg-[#080D19] border border-[#1E2D4A] focus:border-cyan-400 text-white text-xs rounded-xl px-3 py-2.5 outline-none transition-colors"
                  required
                />
              </div>

              {/* Gender */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'Female' | 'Male' | 'Other')}
                  className="w-full bg-[#080D19] border border-[#1E2D4A] focus:border-cyan-400 text-white text-xs rounded-xl px-3 py-2.5 outline-none transition-colors cursor-pointer"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: Clinical Biometrics & Blood Group */}
          <div className="p-4 rounded-xl bg-[#080D19] border border-[#1E2D4A]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Clinical Biometrics</span>
              </h4>

              {bmiValue !== null && (
                <div className="flex items-center gap-1.5 text-xs bg-[#111B2D] border border-[#1E2D4A] px-2.5 py-1 rounded-lg">
                  <span className="text-slate-400 text-[10px] font-bold">BMI:</span>
                  <span className={`font-mono font-bold ${bmiColor}`}>{bmiValue}</span>
                  <span className="text-slate-500">•</span>
                  <span className={`text-[10px] font-semibold ${bmiColor}`}>{bmiCategory}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Blood Group */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-400" />
                  <span>Blood Group</span>
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full bg-[#111B2D] border border-[#1E2D4A] focus:border-cyan-400 text-white text-xs rounded-xl px-3 py-2.5 outline-none transition-colors font-bold cursor-pointer"
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              {/* Height */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Ruler className="w-3 h-3 text-cyan-400" />
                  <span>Height (cm)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="40"
                    max="250"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="165"
                    className="w-full bg-[#111B2D] border border-[#1E2D4A] focus:border-cyan-400 text-white text-xs rounded-xl px-3 py-2.5 outline-none transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">
                    cm
                  </span>
                </div>
              </div>

              {/* Weight */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Scale className="w-3 h-3 text-emerald-400" />
                  <span>Weight (kg)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="58"
                    className="w-full bg-[#111B2D] border border-[#1E2D4A] focus:border-cyan-400 text-white text-xs rounded-xl px-3 py-2.5 outline-none transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">
                    kg
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Attending Physician & Emergency Contact */}
          <div>
            <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
              <span>Medical Oversight & Emergency Contacts</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Stethoscope className="w-3 h-3 text-blue-400" />
                  <span>Attending Physician</span>
                </label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="e.g. Dr. Sarah Jenkins"
                  className="w-full bg-[#080D19] border border-[#1E2D4A] focus:border-cyan-400 text-white text-xs rounded-xl px-3 py-2.5 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  <span>Emergency Contact Phone</span>
                </label>
                <input
                  type="tel"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="e.g. 555-0101"
                  className="w-full bg-[#080D19] border border-[#1E2D4A] focus:border-cyan-400 text-white text-xs rounded-xl px-3 py-2.5 outline-none transition-colors font-mono"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: Medical Allergies (Editable List Tags) */}
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span>Medical Allergies (Editable Tags)</span>
              </label>
              <span className="text-[10px] text-red-400/80 font-mono font-semibold">
                {allergies.length} tag{allergies.length === 1 ? '' : 's'} recorded
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Critical for AI drug interaction checks and contraindication safety alerts.
            </p>

            {/* Existing Allergy Tags */}
            <div className="flex flex-wrap gap-2 min-h-[36px] p-2.5 rounded-xl bg-[#080D19] border border-[#1E2D4A] mb-3">
              {allergies.length === 0 ? (
                <span className="text-xs text-slate-500 italic py-0.5">
                  No allergies specified. Use the field below to add tags.
                </span>
              ) : (
                allergies.map((allergy, index) => (
                  <span
                    key={`${allergy}-${index}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-950/70 border border-red-500/50 text-red-200 text-xs font-semibold group animate-in fade-in"
                  >
                    <span>{allergy}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAllergy(index)}
                      className="p-0.5 hover:bg-red-800/60 rounded text-red-400 hover:text-white transition-colors cursor-pointer"
                      title={`Remove ${allergy}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Input to Add Custom Allergy Tag */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newAllergyInput}
                onChange={(e) => setNewAllergyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAllergy();
                  }
                }}
                placeholder="Type allergy name (e.g. Penicillin, Peanuts) & press Enter..."
                className="flex-1 bg-[#080D19] border border-[#1E2D4A] focus:border-red-400 text-white text-xs rounded-xl px-3 py-2 outline-none transition-colors placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => handleAddAllergy()}
                className="flex items-center gap-1 px-3 py-2 bg-red-900/60 hover:bg-red-800 border border-red-500/40 text-red-200 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tag</span>
              </button>
            </div>

            {/* Quick Suggestions Chips */}
            <div className="mt-3 pt-2.5 border-t border-red-900/30">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Quick Add Common Allergens:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_ALLERGIES.map((item) => {
                  const isSelected = allergies.some((a) => a.toLowerCase() === item.toLowerCase());
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setAllergies(allergies.filter((a) => a.toLowerCase() !== item.toLowerCase()));
                        } else {
                          handleAddAllergy(item);
                        }
                      }}
                      className={`text-[10px] px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer ${
                        isSelected
                          ? 'bg-red-500 text-white font-bold shadow-sm'
                          : 'bg-[#111B2D] border border-[#1E2D4A] text-slate-400 hover:text-white hover:border-red-500/40'
                      }`}
                    >
                      {isSelected ? `✓ ${item}` : `+ ${item}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 5: Known Conditions / Diseases (Editable Tags) */}
          <div className="p-3.5 rounded-xl bg-[#080D19] border border-[#1E2D4A]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                <span>Known Diagnoses & Chronic Conditions</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {diseases.length} condition{diseases.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[32px] p-2 rounded-xl bg-[#111B2D] border border-[#1E2D4A] mb-2.5">
              {diseases.length === 0 ? (
                <span className="text-xs text-slate-500 italic py-0.5">None listed</span>
              ) : (
                diseases.map((dis, idx) => (
                  <span
                    key={`${dis}-${idx}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-950/60 border border-blue-500/40 text-blue-200 text-xs font-medium"
                  >
                    <span>{dis}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDisease(idx)}
                      className="p-0.5 hover:bg-blue-800/60 rounded text-blue-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newDiseaseInput}
                onChange={(e) => setNewDiseaseInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddDisease();
                  }
                }}
                placeholder="Add condition (e.g. Hypertension, Type 2 Diabetes, Asthma)..."
                className="flex-1 bg-[#111B2D] border border-[#1E2D4A] focus:border-blue-400 text-white text-xs rounded-xl px-3 py-2 outline-none transition-colors placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={handleAddDisease}
                className="px-3 py-2 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-200 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#1E2D4A]">
            {/* Delete button (only when in edit mode) */}
            <div>
              {mode === 'edit' && patient && onDelete && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    disabled={!canDelete && !confirmDelete}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      confirmDelete
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 animate-pulse'
                        : canDelete
                        ? 'bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30'
                        : 'bg-slate-800/40 text-slate-500 border border-slate-700/30 cursor-not-allowed'
                    }`}
                    title={!canDelete ? 'Cannot delete the only patient in the system' : 'Delete patient'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{confirmDelete ? 'Confirm Delete?' : 'Delete Patient'}</span>
                  </button>
                  {confirmDelete && (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="text-xs text-slate-400 hover:text-white px-2 py-1"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Cancel & Save */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-[#172338] rounded-xl border border-transparent transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{mode === 'edit' ? 'Save Patient Record' : 'Create Patient Profile'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
