import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SettingsTab, Patient, Caregiver } from '../../types';
import { reminderService, ReminderPermissionStatus } from '../../services/reminderService';
import { PatientProfileModal } from '../modals/PatientProfileModal';
import { CaregiverModal } from '../modals/CaregiverModal';
import { PhoneCallModal } from '../modals/PhoneCallModal';
import { CaregiverChatModal } from '../modals/CaregiverChatModal';
import { AIVoiceAssistantTab } from './AIVoiceAssistantTab';
import { validateIndianMobile } from '../../utils/phoneUtils';
import {
  Users,
  HeartHandshake,
  Volume2,
  Bell,
  ShieldAlert,
  Eye,
  Globe,
  Lock,
  Bluetooth,
  Plus,
  Phone,
  Video,
  MessageSquare,
  Check,
  X,
  Play,
  Square,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Edit,
  Radio,
  RefreshCw,
  Trash2,
  Search,
  Activity,
  Heart,
  Scale,
  Ruler,
  AlertTriangle,
  CheckCircle2,
  Filter,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    activeSettingsTab,
    setActiveSettingsTab,
    patients,
    activePatient,
    setActivePatient,
    addPatient,
    updatePatient,
    deletePatient,
    caregivers,
    addCaregiver,
    updateCaregiver,
    deleteCaregiver,
    caregiverMessages,
    showToast,
    resetDemoData,
    iotDeviceConnected,
    setIotDeviceConnected,
    medications,
    addNotification,
    voiceEnabled,
    currentUserId,
    userName,
    userRole,
    switchUserAccount,
  } = useApp();

  // Notification permission state
  const [notifPermission, setNotifPermission] = useState<ReminderPermissionStatus>(
    reminderService.getPermissionStatus()
  );

  // Full Clinical Patient CRUD & Modal State
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [patientModalMode, setPatientModalMode] = useState<'edit' | 'create'>('edit');
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  // 2FA & Security Modal state
  const [is2faModalOpen, setIs2faModalOpen] = useState(false);
  const [twoFaCode, setTwoFaCode] = useState('');

  // Device diagnostics state
  const [isDeviceDiagOpen, setIsDeviceDiagOpen] = useState(false);

  const handleOpenEditPatient = (pat: Patient = activePatient) => {
    setPatientToEdit(pat);
    setPatientModalMode('edit');
    setPatientModalOpen(true);
  };

  const handleOpenCreatePatient = () => {
    setPatientToEdit(null);
    setPatientModalMode('create');
    setPatientModalOpen(true);
  };

  const handleSavePatientProfile = (patientData: Omit<Patient, 'id'>, id?: string) => {
    if (patientModalMode === 'edit' && id) {
      updatePatient(id, patientData);
    } else {
      addPatient(patientData);
    }
  };

  const handleConfirmDelete = (pat: Patient) => {
    if (patients.length <= 1) {
      showToast('Cannot delete the only remaining patient profile');
      return;
    }
    setPatientToDelete(pat);
  };

  const executeDeletePatient = () => {
    if (!patientToDelete) return;
    deletePatient(patientToDelete.id);
    setPatientToDelete(null);
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    setToggles((prev) => ({ ...prev, twoFa: true }));
    setIs2faModalOpen(false);
    setTwoFaCode('');
    showToast('Two-Factor Authentication (2FA) successfully activated');
  };

  const handleExportFullRecord = () => {
    const data = {
      exportTimestamp: new Date().toISOString(),
      system: 'IntelliMed AI Enterprise Command Center',
      patient: activePatient,
      activeMedications: medications,
      adherenceRate: '94%',
      deviceStatus: 'Smart Pillbox Pro IoT (Connected, 92% Battery)',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IntelliMed_${activePatient.name.replace(/\s+/g, '_')}_Clinical_Record.json`;
    a.click();
    showToast('Exported complete patient EHR record as encrypted JSON');
  };

  const handleRequestPush = async () => {
    const perm = await reminderService.requestPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      showToast('Browser notifications enabled for active tab reminders');
    } else if (perm === 'denied') {
      showToast('Browser notifications blocked in browser settings');
    } else {
      showToast('Browser notification request closed');
    }
  };

  const handleTestReminder = () => {
    const testMed = medications[0] || {
      id: 'test-med',
      name: 'Metformin',
      dosage: '500mg',
      scheduledTime: '01:00 PM',
      timingRule: 'With Food' as const,
      category: 'Afternoon' as const,
      inventory: 30,
      totalStock: 60,
      status: 'pending' as const,
      instructions: 'Take with main afternoon meal',
      patientId: 'pat-1',
    };
    reminderService.testReminder(testMed, {
      enableSound: true,
      enableVoice: voiceEnabled,
      onTrigger: (payload) => {
        addNotification({
          title: `Medication Due: ${payload.medicineName}`,
          message: `${payload.medicineName} ${payload.dosage} is scheduled now (${payload.rule}).`,
          type: 'reminder',
        });
        showToast(`Test Reminder triggered for ${payload.medicineName} (${payload.dosage})`);
      },
    });
  };

  // Caregiver Portal Modals & States
  const [isCaregiverModalOpen, setIsCaregiverModalOpen] = useState(false);
  const [caregiverToEdit, setCaregiverToEdit] = useState<Caregiver | null>(null);
  const [caregiverToDelete, setCaregiverToDelete] = useState<Caregiver | null>(null);
  const [caregiverToCall, setCaregiverToCall] = useState<Caregiver | null>(null);
  const [caregiverToChat, setCaregiverToChat] = useState<Caregiver | null>(null);

  // Search & Filters for Caregiver Portal
  const [caregiverSearch, setCaregiverSearch] = useState('');
  const [caregiverRoleFilter, setCaregiverRoleFilter] = useState<string>('all');

  const [isDeletingCaregiver, setIsDeletingCaregiver] = useState(false);

  const handleOpenAddCaregiver = () => {
    setCaregiverToEdit(null);
    setIsCaregiverModalOpen(true);
  };

  const handleOpenEditCaregiver = (cg: Caregiver) => {
    setCaregiverToEdit(cg);
    setIsCaregiverModalOpen(true);
  };

  const handleSaveCaregiverRecord = async (data: Omit<Caregiver, 'id'>) => {
    if (caregiverToEdit) {
      await updateCaregiver(caregiverToEdit.id, data);
    } else {
      await addCaregiver(data);
    }
  };

  const handleConfirmDeleteCaregiver = async () => {
    if (caregiverToDelete) {
      setIsDeletingCaregiver(true);
      try {
        await deleteCaregiver(caregiverToDelete.id);
        setCaregiverToDelete(null);
      } catch (err: any) {
        showToast(err?.message || 'Failed to delete caregiver record');
      } finally {
        setIsDeletingCaregiver(false);
      }
    }
  };

  // Device scanning state
  const [isScanningBluetooth, setIsScanningBluetooth] = useState(false);

  // Toggles state
  const [toggles, setToggles] = useState({
    medReminders: true,
    emergencyAlerts: true,
    caregiverUpdates: true,
    refillAlerts: true,
    missedMedAlerts: true,
    smartwatchAlerts: true,
    shareLocation: true,
    lockScreenPin: true,
    shareMedReport: true,
    colorBlind: false,
    lowVision: false,
    reducedMotion: false,
    touchAssist: true,
    oneHand: false,
    childSafe: false,
    twoFa: true,
    biometrics: true,
    dataSharing: true,
    autoLogout: true,
  });

  const toggleHandler = (key: keyof typeof toggles) => {
    setToggles((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      showToast(`Setting "${key}" updated`);
      return updated;
    });
  };

  const handleBluetoothScan = () => {
    setIsScanningBluetooth(true);
    setTimeout(() => {
      setIsScanningBluetooth(false);
      setIotDeviceConnected(true);
      showToast('Smart Pillbox Pro IoT Dispenser synchronized');
    }, 2000);
  };



  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'patients', label: 'Patient Profiles', icon: <Users className="w-4 h-4" /> },
    { id: 'caregivers', label: 'Caregiver Portal', icon: <HeartHandshake className="w-4 h-4" /> },
    { id: 'voice', label: 'AI Voice Assistant', icon: <Volume2 className="w-4 h-4" /> },
    { id: 'alerts', label: 'Alerts & Network', icon: <Bell className="w-4 h-4" /> },
    { id: 'emergency', label: 'Emergency Access', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'accessibility', label: 'Accessibility', icon: <Eye className="w-4 h-4" /> },
    { id: 'language', label: 'Language & Region', icon: <Globe className="w-4 h-4" /> },
    { id: 'privacy', label: 'Privacy & Security', icon: <Lock className="w-4 h-4" /> },
    { id: 'devices', label: 'Device Connectivity', icon: <Bluetooth className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Header matching video */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            System Preferences
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise medical settings, full CRUD, and accessibility configuration.
          </p>
        </div>

        <button
          onClick={resetDemoData}
          className="px-4 py-2 bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-300 text-xs font-semibold rounded-xl transition-all cursor-pointer self-start sm:self-auto"
        >
          Reset Demo Data
        </button>
      </div>

      {/* Responsive Horizontal Mobile Tabs Strip (< lg screens) */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeSettingsTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSettingsTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-[#111B2D] border border-[#1E2D4A] text-slate-400 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Container: Left Tabs Sidebar (desktop) / Right Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Vertical Navigation Menu matching video (desktop only) */}
        <div className="hidden lg:block lg:col-span-4 bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-2.5 shadow-xl space-y-1">
          {tabs.map((tab) => {
            const isActive = activeSettingsTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSettingsTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#172338] text-white border border-[#1E2D4A] shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#172338]/40'
                }`}
              >
                <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>
                  {tab.icon}
                </span>
                <span className="flex-1">{tab.label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
              </button>
            );
          })}
        </div>

        {/* Right Active Tab Content (8-9 cols on desktop, full width on mobile) */}
        <div className="w-full lg:col-span-8 bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-6 shadow-xl min-h-[560px]">
          {/* TAB 1: Patient Profiles matching video */}
          {activeSettingsTab === 'patients' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1E2D4A]">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>Patient Profiles</span>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold">
                      {patients.length} Active Records
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage multi-patient EHR records, biometrics, emergency contacts, and allergy tags.
                  </p>
                </div>
                <button
                  onClick={handleOpenCreatePatient}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl shadow-md shadow-cyan-500/20 transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Patient</span>
                </button>
              </div>

              {/* Active Patient Clinical Card */}
              {activePatient && (
                <div className="bg-[#172338] border-2 border-cyan-500/40 rounded-2xl p-6 relative shadow-xl overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600/30 to-cyan-600/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-black text-xl shadow-inner shrink-0">
                        {activePatient.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="text-xl font-extrabold text-white tracking-tight">
                            {activePatient.name}
                          </h4>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-extrabold uppercase tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            ACTIVE RECORD
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
                          <span>Age: {activePatient.age} yrs</span>
                          <span className="text-slate-500">•</span>
                          <span>Gender: {activePatient.gender}</span>
                          <span className="text-slate-500">•</span>
                          <span className="font-bold text-red-300 bg-red-950/60 border border-red-500/30 px-2 py-0.2 rounded-md">
                            Blood {activePatient.bloodGroup}
                          </span>
                        </p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                          <span>Height: {activePatient.heightCm} cm</span>
                          <span className="text-slate-500">•</span>
                          <span>Weight: {activePatient.weightKg} kg</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-cyan-400 font-mono font-semibold">
                            BMI: {(activePatient.weightKg / Math.pow((activePatient.heightCm || 165) / 100, 2)).toFixed(1)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        onClick={() => handleOpenEditPatient(activePatient)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-cyan-600/25 transition-all cursor-pointer"
                        title="Edit clinical details and biometrics"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Full Edit</span>
                      </button>

                      {patients.length > 1 && (
                        <button
                          onClick={() => handleConfirmDelete(activePatient)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                          title="Delete active patient profile"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Subsections: Active Meds, Clinical Allergies & Oversight */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-5 border-t border-[#1E2D4A]">
                    {/* Active Meds Summary */}
                    <div className="p-4 rounded-xl bg-[#080D19] border border-[#1E2D4A] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-cyan-400" />
                          <span>ACTIVE MEDICATIONS</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-300 text-[10px] font-bold">
                          {medications.length} Prescribed
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#172338]">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">
                            {medications[0]?.name || 'Paracetamol'}
                          </span>
                          <span className="text-xs font-mono text-cyan-400 font-semibold">
                            {medications[0]?.dosage || '650mg'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {medications[0]?.timingRule || 'After Food'} • {medications[0]?.category || 'Morning & Night'}
                        </p>
                      </div>

                      <div className="pt-1 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Attending Physician:</span>
                        <span className="font-semibold text-slate-200">{activePatient.doctorName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Emergency Phone:</span>
                        <span className="font-mono text-cyan-400 font-semibold">{activePatient.emergencyContact}</span>
                      </div>
                    </div>

                    {/* Medical Allergies Tag Cloud */}
                    <div className="p-4 rounded-xl bg-[#080D19] border border-[#1E2D4A] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                          <span>MEDICAL ALLERGIES ({activePatient.allergies.length})</span>
                        </span>
                        <button
                          onClick={() => handleOpenEditPatient(activePatient)}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-semibold cursor-pointer"
                        >
                          Manage Tags
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 min-h-[42px] pt-1">
                        {activePatient.allergies.length === 0 ? (
                          <span className="text-xs text-slate-500 italic">None reported</span>
                        ) : (
                          activePatient.allergies.map((allergy, idx) => (
                            <span
                              key={`${allergy}-${idx}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-bold"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                              <span>{allergy}</span>
                            </span>
                          ))
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#1E2D4A] text-[11px] text-slate-400 space-y-0.5">
                        <p>
                          <span className="text-slate-500">Known Conditions:</span>{' '}
                          <span className="text-slate-300">{activePatient.diseases.join(', ') || 'None'}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Patient Directory List with Search & Actions */}
              <div className="space-y-3 pt-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Patient Directory ({patients.length})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Click any patient card to switch active record or edit clinical profile
                    </span>
                  </div>

                  {/* Search Filter */}
                  <div className="relative w-full sm:w-60">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search patient..."
                      value={patientSearchQuery}
                      onChange={(e) => setPatientSearchQuery(e.target.value)}
                      className="w-full bg-[#080D19] border border-[#1E2D4A] focus:border-cyan-400 text-white text-xs rounded-xl pl-8 pr-3 py-1.5 outline-none transition-colors placeholder:text-slate-500"
                    />
                    {patientSearchQuery && (
                      <button
                        onClick={() => setPatientSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {patients
                    .filter(
                      (p) =>
                        p.name.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
                        p.bloodGroup.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
                        p.doctorName.toLowerCase().includes(patientSearchQuery.toLowerCase())
                    )
                    .map((pat) => {
                      const isActive = activePatient.id === pat.id;
                      return (
                        <div
                          key={pat.id}
                          onClick={() => {
                            setActivePatient(pat);
                            showToast(`Switched active patient to ${pat.name}`);
                          }}
                          className={`p-4 rounded-xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                            isActive
                              ? 'bg-[#172338] border-cyan-400 shadow-lg shadow-cyan-500/10'
                              : 'bg-[#080D19] border-[#1E2D4A] hover:border-slate-500 hover:bg-[#111B2D]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                                  isActive
                                    ? 'bg-cyan-500 text-black shadow-md'
                                    : 'bg-[#172338] text-slate-300 border border-[#1E2D4A]'
                                }`}
                              >
                                {pat.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                              <div>
                                <h5 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                                  {pat.name}
                                </h5>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {pat.age} yrs • {pat.gender} • Blood{' '}
                                  <span className="font-semibold text-red-300">{pat.bloodGroup}</span>
                                </p>
                              </div>
                            </div>

                            {isActive ? (
                              <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-black text-[10px] font-black uppercase tracking-wider">
                                ACTIVE
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-[#172338] text-slate-400 text-[10px] font-semibold border border-[#1E2D4A]">
                                Set Active
                              </span>
                            )}
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-[#1E2D4A] flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2 text-slate-400">
                              <span>Allergies:</span>
                              <span className="text-red-300 font-semibold truncate max-w-[120px]">
                                {pat.allergies.join(', ') || 'None'}
                              </span>
                            </div>

                            {/* Card Quick Action Buttons */}
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleOpenEditPatient(pat)}
                                className="p-1.5 rounded-lg bg-[#111B2D] hover:bg-cyan-950/60 border border-[#1E2D4A] hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                                title={`Full Edit ${pat.name}`}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              {patients.length > 1 && (
                                <button
                                  onClick={() => handleConfirmDelete(pat)}
                                  className="p-1.5 rounded-lg bg-[#111B2D] hover:bg-red-950/60 border border-[#1E2D4A] hover:border-red-500/40 text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
                                  title={`Delete ${pat.name}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {/* Register New Patient Quick Card */}
                  <button
                    onClick={handleOpenCreatePatient}
                    className="p-4 rounded-xl border border-dashed border-[#1E2D4A] hover:border-cyan-500/50 bg-[#080D19]/50 hover:bg-[#111B2D] transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer min-h-[105px]"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-300 group-hover:text-white">
                      + Register Another Patient
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Caregiver Portal matching video & upgraded with Full CRUD + Real Comms */}
          {activeSettingsTab === 'caregivers' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header with Title and Add Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E2D4A]">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">Caregiver Portal</h3>
                    <span className="text-[11px] bg-blue-500/20 text-cyan-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-semibold">
                      {caregivers.length} Verified Contacts
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage assigned medical staff, specialized nurses, attending doctors, and family emergency contacts with verified Indian mobile communication.
                  </p>
                </div>
                <button
                  onClick={handleOpenAddCaregiver}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Caregiver / Nurse</span>
                </button>
              </div>

              {/* Two-Account Clinical Session Switcher Bar */}
              <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                      userRole === 'Patient'
                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                        : 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    }`}
                  >
                    {userName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Current Authenticated Account:</span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          userRole === 'Patient'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}
                      >
                        {userRole}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white">{userName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-slate-400 font-medium">Switch Session:</span>
                  <button
                    type="button"
                    onClick={() => switchUserAccount('patient')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      userRole === 'Patient'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                        : 'bg-[#172338] text-slate-300 hover:text-white hover:bg-[#1E2D4A] border border-[#1E2D4A]'
                    }`}
                  >
                    Patient ({activePatient?.name || 'Rajesh Kumar'})
                  </button>

                  {caregivers.slice(0, 3).map((cg) => {
                    const isSelected = currentUserId === cg.id;
                    return (
                      <button
                        key={cg.id}
                        type="button"
                        onClick={() => switchUserAccount('caregiver', cg.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-bold'
                            : 'bg-[#172338] text-slate-300 hover:text-white hover:bg-[#1E2D4A] border border-[#1E2D4A]'
                        }`}
                      >
                        {cg.name.split(' ')[0]} ({cg.role})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search and Role Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by contact name, phone, role, or clinical notes..."
                    value={caregiverSearch}
                    onChange={(e) => setCaregiverSearch(e.target.value)}
                    className="w-full bg-[#111B2D] border border-[#1E2D4A] focus:border-cyan-400 text-white text-xs rounded-xl pl-9 pr-3 py-2.5 transition-colors focus:outline-none"
                  />
                  {caregiverSearch && (
                    <button
                      onClick={() => setCaregiverSearch('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400 hidden sm:block shrink-0" />
                  <select
                    value={caregiverRoleFilter}
                    onChange={(e) => setCaregiverRoleFilter(e.target.value)}
                    className="bg-[#111B2D] border border-[#1E2D4A] focus:border-cyan-400 text-slate-200 text-xs rounded-xl px-3 py-2.5 transition-colors focus:outline-none"
                  >
                    <option value="all">All Roles & Staff</option>
                    <option value="Caregiver">Caregiver Only</option>
                    <option value="Nurse">Nurses Only</option>
                    <option value="Doctor">Doctors Only</option>
                    <option value="Family Member">Family Members</option>
                  </select>
                </div>
              </div>

              {/* Filtered Caregiver Cards */}
              {(() => {
                const query = caregiverSearch.toLowerCase().trim();
                const filtered = caregivers.filter((cg) => {
                  const matchesSearch =
                    !query ||
                    cg.name.toLowerCase().includes(query) ||
                    cg.phone.toLowerCase().includes(query) ||
                    (cg.role && cg.role.toLowerCase().includes(query)) ||
                    (cg.email && cg.email.toLowerCase().includes(query)) ||
                    (cg.relationship && cg.relationship.toLowerCase().includes(query)) ||
                    (cg.notes && cg.notes.toLowerCase().includes(query));

                  const matchesRole =
                    caregiverRoleFilter === 'all' ||
                    cg.role.toLowerCase() === caregiverRoleFilter.toLowerCase();

                  return matchesSearch && matchesRole;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-8 text-center bg-[#172338]/50 border border-[#1E2D4A] rounded-2xl">
                      <HeartHandshake className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                      <h4 className="text-sm font-bold text-slate-300">No matching contacts found</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        No caregiver or nurse matches your search criteria. Try resetting the filters or add a new record.
                      </p>
                      <button
                        onClick={() => {
                          setCaregiverSearch('');
                          setCaregiverRoleFilter('all');
                        }}
                        className="mt-3 text-xs text-cyan-400 hover:underline"
                      >
                        Reset search & filters
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((cg) => {
                      const phoneVal = validateIndianMobile(cg.phone);
                      const unreadOrRecentCount = caregiverMessages.filter(
                        (m) => m.caregiverId === cg.id
                      ).length;

                      return (
                        <div
                          key={cg.id}
                          className="bg-[#172338] border border-[#1E2D4A] hover:border-slate-600 rounded-2xl p-5 relative shadow-lg transition-all flex flex-col justify-between"
                        >
                          <div>
                            {/* Card Top Row */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 font-bold text-base">
                                  {cg.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-base font-bold text-white truncate">{cg.name}</h4>
                                    {cg.isPrimary && (
                                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-semibold uppercase">
                                        Primary
                                      </span>
                                    )}
                                    <span
                                      className={`w-2 h-2 rounded-full ${
                                        cg.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                                      }`}
                                      title={cg.isOnline ? 'Active on roster' : 'Offline'}
                                    />
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wide">
                                      {cg.role} • {cg.shiftTiming}
                                    </span>
                                    {phoneVal.isValid ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>Verified IN Mobile</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/40 border border-amber-500/30 px-1.5 py-0.5 rounded">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span>Unverified Phone</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Edit & Delete Controls */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditCaregiver(cg)}
                                  className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-[#111B2D] rounded-lg transition-colors cursor-pointer"
                                  title="Edit contact details"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCaregiverToDelete(cg)}
                                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-[#111B2D] rounded-lg transition-colors cursor-pointer"
                                  title="Delete caregiver record"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Contact Details & Metadata */}
                            <div className="mt-4 pt-3 border-t border-[#1E2D4A] space-y-1.5 text-xs">
                              <div className="flex items-center justify-between text-slate-300">
                                <span className="text-slate-500">Phone:</span>
                                <span className="font-mono font-medium text-slate-200">
                                  {phoneVal.formatted || cg.phone}
                                </span>
                              </div>
                              {cg.email && (
                                <div className="flex items-center justify-between text-slate-300">
                                  <span className="text-slate-500">Email:</span>
                                  <span className="truncate max-w-[200px]">{cg.email}</span>
                                </div>
                              )}
                              {cg.relationship && (
                                <div className="flex items-center justify-between text-slate-300">
                                  <span className="text-slate-500">Affiliation:</span>
                                  <span className="text-slate-300 truncate max-w-[200px]">
                                    {cg.relationship}
                                  </span>
                                </div>
                              )}
                              {cg.preferredContact && (
                                <div className="flex items-center justify-between text-slate-300">
                                  <span className="text-slate-500">Preferred Channel:</span>
                                  <span className="text-cyan-300 font-medium">
                                    {cg.preferredContact}
                                  </span>
                                </div>
                              )}
                              {cg.notes && (
                                <div className="pt-1 text-[11px] text-slate-400 italic line-clamp-2">
                                  &quot;{cg.notes}&quot;
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons: Real Call, Telemed Video, Real In-App Chat */}
                          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#1E2D4A]">
                            <button
                              type="button"
                              onClick={() => setCaregiverToCall(cg)}
                              className="flex-1 py-2 bg-[#111B2D] hover:bg-emerald-600 hover:text-white text-emerald-400 border border-[#1E2D4A] hover:border-emerald-500 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                              title={`Direct phone call to ${phoneVal.formatted || cg.phone}`}
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Call</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                showToast(
                                  `Telemedicine secure video room requested for ${cg.name} (${cg.role})`
                                )
                              }
                              className="flex-1 py-2 bg-[#111B2D] hover:bg-cyan-600 hover:text-white text-slate-300 border border-[#1E2D4A] hover:border-cyan-500 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Video</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setCaregiverToChat(cg)}
                              className="flex-1 py-2 bg-[#111B2D] hover:bg-purple-600 hover:text-white text-purple-300 border border-[#1E2D4A] hover:border-purple-500 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm relative"
                              title={`Open persistent chat with ${cg.name}`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Chat</span>
                              {unreadOrRecentCount > 0 && (
                                <span className="text-[10px] bg-purple-500 text-white rounded-full px-1.5 py-0.1 font-bold">
                                  {unreadOrRecentCount}
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 3: Fully Functional AI Voice Assistant */}
          {activeSettingsTab === 'voice' && <AIVoiceAssistantTab />}

          {/* TAB 4: Alerts & Network matching video */}
          {activeSettingsTab === 'alerts' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-[#1E2D4A]">
                <h3 className="text-xl font-bold text-white">Alerts & Network</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Omnichannel escalation rules, notifications, and caregiver dispatch.
                </p>
              </div>

              {/* Integrations row matching video */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#172338] border border-[#1E2D4A]">
                  <h4 className="text-xs font-bold text-white mb-1">WhatsApp Integration</h4>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Receive immediate alerts to your WhatsApp account.
                  </p>
                  <button
                    onClick={() => showToast('WhatsApp integration window initiated')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm"
                  >
                    Link WhatsApp Account
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#172338] border border-[#1E2D4A]">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-bold text-white">Browser & Audio Reminders</h4>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        notifPermission === 'granted'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : notifPermission === 'denied'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {notifPermission === 'granted'
                        ? 'Active'
                        : notifPermission === 'denied'
                        ? 'Blocked'
                        : 'Standby'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Active while browser/tab is open. Desktop notifications + medical sound chime.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRequestPush}
                      className={`px-3 py-2 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        notifPermission === 'granted'
                          ? 'bg-emerald-600 hover:bg-emerald-500'
                          : 'bg-blue-600 hover:bg-blue-500'
                      }`}
                    >
                      {notifPermission === 'granted' ? 'Allowed ✓' : 'Allow Push'}
                    </button>
                    <button
                      onClick={handleTestReminder}
                      className="px-3 py-2 bg-[#111B2D] hover:bg-[#1E2D4A] text-slate-300 text-xs rounded-lg border border-[#1E2D4A] cursor-pointer"
                    >
                      Test Chime & Alert
                    </button>
                  </div>
                </div>
              </div>

              {/* Email config */}
              <div className="p-4 rounded-xl bg-[#172338] border border-[#1E2D4A]">
                <h4 className="text-xs font-bold text-white mb-1">Email Notifications</h4>
                <div className="flex gap-2 mt-2">
                  <input
                    type="email"
                    defaultValue="patient@hospital.com"
                    className="flex-1 bg-[#080D19] border border-[#1E2D4A] text-xs text-white rounded-lg px-3 py-2"
                  />
                  <button
                    onClick={() => showToast('Verification link sent to patient@hospital.com')}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg"
                  >
                    Verify Email
                  </button>
                </div>
              </div>

              {/* Toggles list matching video */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Smart Alert Subscriptions
                </h4>
                {[
                  { key: 'medReminders', title: 'Medicine Reminders', desc: 'Ping a reminder when it is time to take medication.' },
                  { key: 'emergencyAlerts', title: 'Emergency Alerts', desc: 'Notify caregivers instantly during SOS triggers.' },
                  { key: 'caregiverUpdates', title: 'Caregiver Updates', desc: 'Send summary logs to assigned caregivers daily.' },
                  { key: 'refillAlerts', title: 'Refill Alerts', desc: 'Notify when pillbox is running low on tablets.' },
                  { key: 'missedMedAlerts', title: 'Missed Medicine Alerts', desc: 'Escalation alert if medication is missed by 1 hour.' },
                  { key: 'smartwatchAlerts', title: 'Smartwatch Companion Alert', desc: 'Sync notifications directly to Apple Watch / Galaxy Watch.' },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#172338]/60 border border-[#1E2D4A]"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-white">{item.title}</h5>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => toggleHandler(item.key as any)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        toggles[item.key as keyof typeof toggles] ? 'bg-cyan-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          toggles[item.key as keyof typeof toggles]
                            ? 'right-1'
                            : 'left-1'
                        }`}
                      ></span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Emergency Access matching video */}
          {activeSettingsTab === 'emergency' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-[#1E2D4A]">
                <h3 className="text-xl font-bold text-white">Emergency Access</h3>
                <p className="text-xs text-slate-400 mt-1">
                  First responder medical identity, contact routing, and geofencing.
                </p>
              </div>

              {/* Medical ID Card matching video */}
              <div className="bg-[#172338] border-2 border-red-500/30 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                      MEDICAL ID CARD
                    </span>
                    <h4 className="text-lg font-bold text-white">{activePatient.name}</h4>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-mono font-bold">
                    Blood Group: {activePatient.bloodGroup}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1E2D4A] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Severe Allergies:</span>
                    <span className="text-red-300 font-bold ml-2">
                      {activePatient.allergies.join(', ')}
                    </span>
                  </div>
                  <button
                    onClick={() => showToast('Medical ID link copied to clipboard')}
                    className="px-3 py-1.5 bg-[#111B2D] hover:bg-slate-800 text-white text-xs rounded-lg border border-[#1E2D4A]"
                  >
                    Share Medical ID
                  </button>
                </div>
              </div>

              {/* Quick Call Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#172338] border border-[#1E2D4A]">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    PRIMARY CAREGIVER
                  </span>
                  <p className="text-sm font-bold text-white mt-1">Dr. Sarah Jenkins</p>
                  <p className="text-xs text-cyan-400 font-mono mt-0.5">555-0192</p>
                </div>
                <div className="p-4 rounded-xl bg-[#172338] border border-[#1E2D4A]">
                  <span className="text-[10px] text-red-400 font-bold uppercase">
                    AMBULANCE / HOSPITAL
                  </span>
                  <p className="text-sm font-bold text-white mt-1">Local Emergency Services</p>
                  <p className="text-xs text-red-400 font-mono mt-0.5">911 / 108</p>
                </div>
              </div>

              {/* Toggles matching video */}
              <div className="space-y-3 pt-2">
                {[
                  { key: 'shareLocation', title: 'Share Live Location', desc: 'Attach GPS coordinates to SOS alerts.' },
                  { key: 'lockScreenPin', title: 'Lock Screen Emergency PIN', desc: 'Allow paramedics to bypass lock screen with a secure PIN.' },
                  { key: 'shareMedReport', title: 'Share Medical Report', desc: 'Automatically attach recent vital history to emergency emails.' },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#172338]/60 border border-[#1E2D4A]"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-white">{item.title}</h5>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => toggleHandler(item.key as any)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        toggles[item.key as keyof typeof toggles] ? 'bg-cyan-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          toggles[item.key as keyof typeof toggles] ? 'right-1' : 'left-1'
                        }`}
                      ></span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: Accessibility matching video */}
          {activeSettingsTab === 'accessibility' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-[#1E2D4A]">
                <h3 className="text-xl font-bold text-white">Accessibility</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Visual contrast, motor accommodation, and cognitive ease controls.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'colorBlind', title: 'Color Blind Support', desc: 'Adjust color palettes for Protanopia/Deuteranopia.' },
                  { key: 'lowVision', title: 'Low Vision Mode', desc: 'Enforce screen-reader optimized ARIA tags.' },
                  { key: 'reducedMotion', title: 'Reduced Motion', desc: 'Disable animations, parallax, and transitions.' },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[#172338] border border-[#1E2D4A]"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-white">{item.title}</h5>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => toggleHandler(item.key as any)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        toggles[item.key as keyof typeof toggles] ? 'bg-cyan-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          toggles[item.key as keyof typeof toggles] ? 'right-1' : 'left-1'
                        }`}
                      ></span>
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Motor & Interaction Settings
                </h4>
                {[
                  { key: 'touchAssist', title: 'Touch Assistance', desc: 'Ignore accidental repeated taps.' },
                  { key: 'oneHand', title: 'One-Hand Mode', desc: 'Shift interactive elements to the bottom of the screen.' },
                  { key: 'childSafe', title: 'Child Safe Mode', desc: 'Require PIN to change medication dosages.' },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[#172338] border border-[#1E2D4A]"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-white">{item.title}</h5>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => toggleHandler(item.key as any)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        toggles[item.key as keyof typeof toggles] ? 'bg-cyan-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          toggles[item.key as keyof typeof toggles] ? 'right-1' : 'left-1'
                        }`}
                      ></span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: Language & Region matching video */}
          {activeSettingsTab === 'language' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-[#1E2D4A]">
                <h3 className="text-xl font-bold text-white">Language & Region</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Localization, dosage metric formats, and international calendars.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Country / Region
                  </label>
                  <select className="w-full bg-[#172338] border border-[#1E2D4A] text-white rounded-xl p-2.5">
                    <option>India</option>
                    <option>USA</option>
                    <option>UK</option>
                    <option>Japan</option>
                    <option>France</option>
                    <option>Germany</option>
                    <option>Korea</option>
                    <option>UAE</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Timezone
                  </label>
                  <select className="w-full bg-[#172338] border border-[#1E2D4A] text-white rounded-xl p-2.5">
                    <option>(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi</option>
                    <option>(GMT-05:00) Eastern Time (US & Canada)</option>
                    <option>(GMT+00:00) London, Edinburgh</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Display Language
                  </label>
                  <select className="w-full bg-[#172338] border border-[#1E2D4A] text-white rounded-xl p-2.5">
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Kannada</option>
                    <option>Telugu</option>
                    <option>Tamil</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Date Format
                  </label>
                  <select className="w-full bg-[#172338] border border-[#1E2D4A] text-white rounded-xl p-2.5">
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Temperature Unit
                  </label>
                  <select className="w-full bg-[#172338] border border-[#1E2D4A] text-white rounded-xl p-2.5">
                    <option>Celsius (°C)</option>
                    <option>Fahrenheit (°F)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Medicine Format
                  </label>
                  <select className="w-full bg-[#172338] border border-[#1E2D4A] text-white rounded-xl p-2.5">
                    <option>mg / ml</option>
                    <option>g / L</option>
                  </select>
                </div>
              </div>

              {/* Regional Preview Card matching video */}
              <div className="p-4 rounded-xl bg-[#172338] border border-[#1E2D4A] text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Regional Preview
                </span>
                <div className="grid grid-cols-3 gap-2 font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Current Date:</span>
                    <span className="text-white font-bold">19/05/2026</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Current Time:</span>
                    <span className="text-cyan-400 font-bold">05:30 PM (IST)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Sample Med:</span>
                    <span className="text-white font-bold">Paracetamol 650mg</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: Privacy & Security matching video */}
          {activeSettingsTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-[#1E2D4A]">
                <h3 className="text-xl font-bold text-white">Privacy & Security</h3>
                <p className="text-xs text-slate-400 mt-1">
                  HIPAA-compliant cryptographic governance and access logs.
                </p>
              </div>

              {/* Security Score matching video */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#172338] border border-[#1E2D4A]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    SECURITY SCORE
                  </span>
                  <div className="text-3xl font-extrabold text-cyan-400 font-mono mt-1">
                    98/100
                  </div>
                  <p className="text-xs text-slate-300 mt-2">
                    Your account is highly protected with AES-256 encryption.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#172338] border border-[#1E2D4A] text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Recent Login Activity
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-white font-semibold">MacBook Pro - Chrome</span>
                      <span className="text-emerald-400 font-mono text-[10px]">Active Now</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>iPhone 14 Pro - App</span>
                      <span className="font-mono text-[10px]">2 hours ago</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Toggles matching video */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Authentication & Access
                </h4>
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#172338] border border-[#1E2D4A]">
                  <div>
                    <h5 className="text-xs font-bold text-white">Two-Factor Authentication (2FA)</h5>
                    <p className="text-[11px] text-slate-400">Require an SMS code or Authenticator app to log in.</p>
                  </div>
                  <button
                    onClick={() => setIs2faModalOpen(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Configure 2FA
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#172338] border border-[#1E2D4A]">
                  <div>
                    <h5 className="text-xs font-bold text-white">Face ID / Biometric Login</h5>
                    <p className="text-[11px] text-slate-400">Use facial recognition or fingerprint to unlock the app.</p>
                  </div>
                  <button
                    onClick={() => toggleHandler('biometrics')}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      toggles.biometrics ? 'bg-cyan-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        toggles.biometrics ? 'right-1' : 'left-1'
                      }`}
                    ></span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#172338] border border-[#1E2D4A]">
                  <div>
                    <h5 className="text-xs font-bold text-white">Change Password</h5>
                    <p className="text-[11px] text-slate-400">Update your master account password.</p>
                  </div>
                  <button
                    onClick={() => showToast('Password reset link sent to registered email')}
                    className="px-3 py-1.5 bg-[#111B2D] text-slate-300 text-xs font-semibold rounded-lg border border-[#1E2D4A]"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Data Privacy & EHR Backup Card */}
              <div className="p-4 rounded-xl bg-[#172338] border border-[#1E2D4A] space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Data Privacy & Clinical EHR Export
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Download an encrypted export of your clinical history, medications, and vitals.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={handleExportFullRecord}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                  >
                    Export Full Medical Record (JSON)
                  </button>
                  <button
                    onClick={() => showToast('Session cache cleaned and storage optimized')}
                    className="px-3 py-2 bg-[#111B2D] hover:bg-[#1E2D4A] border border-[#1E2D4A] text-slate-300 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Clean Cache
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: Device Connectivity matching video */}
          {activeSettingsTab === 'devices' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-[#1E2D4A]">
                <div>
                  <h3 className="text-xl font-bold text-white">Bluetooth Sync Engine</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Automatically syncs vitals and medication adherence.
                  </p>
                </div>
                <button
                  onClick={handleBluetoothScan}
                  disabled={isScanningBluetooth}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {isScanningBluetooth ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Scanning...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Pair New Device</span>
                    </>
                  )}
                </button>
              </div>

              {/* Connected IoT Dispenser Device Card matching video */}
              <div className="bg-[#172338] border-2 border-cyan-500/30 rounded-2xl p-6 relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                      <Smartphone className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">Smart Pillbox Pro</h4>
                      <span className="text-xs font-mono text-cyan-400 font-semibold uppercase">
                        IoT DISPENSER
                      </span>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                    Connected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-4 border-t border-[#1E2D4A] text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#080D19]">
                    <span className="text-slate-400">Battery Status</span>
                    <span className="font-bold text-emerald-400 font-mono">92%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#080D19]">
                    <span className="text-slate-400">Medicine Load</span>
                    <span className="font-bold text-white">14 Compartments Active</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#1E2D4A] flex items-center justify-between text-xs">
                  <span className="text-slate-400">Firmware: v2.4.1 (Latest)</span>
                  <button
                    onClick={() => setIsDeviceDiagOpen(true)}
                    className="px-3.5 py-1.5 bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Run Diagnostics
                  </button>
                </div>

                <div className="mt-4 text-right text-[11px] text-slate-500 font-mono">
                  Last Sync: Just now
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Caregiver Profile Modal (Full Create & Edit with Validation) */}
      <CaregiverModal
        isOpen={isCaregiverModalOpen}
        onClose={() => setIsCaregiverModalOpen(false)}
        onSave={handleSaveCaregiverRecord}
        caregiverToEdit={caregiverToEdit}
      />

      {/* Real Phone Call Modal with Mobile Dialler & Desktop Guidance */}
      <PhoneCallModal
        isOpen={Boolean(caregiverToCall)}
        onClose={() => setCaregiverToCall(null)}
        caregiver={caregiverToCall}
      />

      {/* Real Authenticated In-App Chat Modal with Delivery State & History */}
      <CaregiverChatModal
        isOpen={Boolean(caregiverToChat)}
        onClose={() => setCaregiverToChat(null)}
        caregiver={caregiverToChat}
        onOpenCallModal={() => {
          const target = caregiverToChat;
          setCaregiverToChat(null);
          setCaregiverToCall(target);
        }}
      />

      {/* Delete Caregiver Confirmation Modal */}
      {caregiverToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#111B2D] border border-red-500/40 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2D4A]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Delete Caregiver Record</h3>
                  <p className="text-xs text-red-300">Confirmation Required</p>
                </div>
              </div>
              <button
                onClick={() => setCaregiverToDelete(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to permanently remove{' '}
                <strong className="text-white">{caregiverToDelete.name}</strong> ({caregiverToDelete.role})
                from your authorized caregivers roster?
              </p>
              <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl text-[11px] text-red-300">
                This will also unlink the contact from automated SOS emergency dispatch triggers and clear their local conversation history.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E2D4A]">
              <button
                onClick={() => setCaregiverToDelete(null)}
                className="px-4 py-2 bg-[#172338] hover:bg-[#1E2D4A] text-slate-300 text-xs font-semibold rounded-xl"
              >
                Keep Record
              </button>
              <button
                onClick={handleConfirmDeleteCaregiver}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/30"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Clinical Patient Profile Editor Modal (Full Edit & Register) */}
      <PatientProfileModal
        isOpen={patientModalOpen}
        onClose={() => setPatientModalOpen(false)}
        patient={patientToEdit}
        mode={patientModalMode}
        onSave={handleSavePatientProfile}
        onDelete={executeDeletePatient}
        canDelete={patients.length > 1}
      />

      {/* Delete Patient Confirmation Modal */}
      {patientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#111B2D] border border-red-500/40 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2D4A]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Delete Patient Record</h3>
                  <p className="text-[11px] text-slate-400">Permanent clinical deletion</p>
                </div>
              </div>
              <button
                onClick={() => setPatientToDelete(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#172338]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-300">
              <p>
                Are you sure you want to remove the medical record for{' '}
                <strong className="text-white font-bold">{patientToDelete.name}</strong>?
              </p>
              <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 text-red-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-red-300">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Clinical Safeguard Notice</span>
                </div>
                <p className="text-[11px] text-red-300/90 leading-relaxed">
                  This patient currently has {patientToDelete.activeMedicationsCount} active medication schedules and {patientToDelete.allergies.length} allergy tags. Deleting will immediately update the active patient directory.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1E2D4A]">
              <button
                type="button"
                onClick={() => setPatientToDelete(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-[#172338]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeletePatient}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                Confirm Delete Patient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {is2faModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2D4A]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Configure Two-Factor Auth</h3>
              </div>
              <button onClick={() => setIs2faModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerify2FA} className="space-y-4 pt-4 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Scan this authenticator barcode with Google Authenticator, 1Password, or Microsoft Authenticator:
              </p>

              {/* Visual QR Code Mock */}
              <div className="w-36 h-36 mx-auto bg-white p-3 rounded-xl flex items-center justify-center shadow-lg">
                <div className="grid grid-cols-6 gap-1 w-full h-full">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-xs ${
                        (i % 2 === 0 || i % 7 === 0) && i % 5 !== 0 ? 'bg-black' : 'bg-transparent'
                      }`}
                    ></div>
                  ))}
                </div>
              </div>

              <div className="p-2.5 bg-[#080D19] border border-[#1E2D4A] rounded-xl text-center">
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Secret Key</span>
                <span className="font-mono text-cyan-400 font-bold text-xs">INTL-7489-MEDA-2026</span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Enter 6-Digit Authenticator Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={twoFaCode}
                  onChange={(e) => setTwoFaCode(e.target.value)}
                  className="w-full bg-[#080D19] border border-[#1E2D4A] text-white text-center text-sm font-mono tracking-widest rounded-xl p-2.5 focus:border-cyan-400"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#1E2D4A]">
                <button
                  type="button"
                  onClick={() => setIs2faModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  Confirm & Enable 2FA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Device Diagnostics Modal */}
      {isDeviceDiagOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#111B2D] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2D4A]">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Smart Pillbox Pro Diagnostics</h3>
              </div>
              <button onClick={() => setIsDeviceDiagOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 pt-4 text-xs">
              <div className="p-3 rounded-xl bg-[#172338] border border-[#1E2D4A] flex justify-between items-center">
                <span className="text-slate-400">Bluetooth RSSI Signal:</span>
                <span className="font-mono text-emerald-400 font-bold">-54 dBm (Strong)</span>
              </div>
              <div className="p-3 rounded-xl bg-[#172338] border border-[#1E2D4A] flex justify-between items-center">
                <span className="text-slate-400">Battery Health:</span>
                <span className="font-mono text-emerald-400 font-bold">98% (Normal Cycle)</span>
              </div>
              <div className="p-3 rounded-xl bg-[#172338] border border-[#1E2D4A] flex justify-between items-center">
                <span className="text-slate-400">Lid Micro-Switch Sensors:</span>
                <span className="font-mono text-cyan-400 font-bold">14 / 14 Calibrated</span>
              </div>
              <div className="p-3 rounded-xl bg-[#172338] border border-[#1E2D4A] flex justify-between items-center">
                <span className="text-slate-400">Firmware Build:</span>
                <span className="font-mono text-white font-bold">v2.4.1-OTA-STABLE</span>
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-[#1E2D4A] flex justify-end">
              <button
                onClick={() => {
                  showToast('Diagnostic telemetry passed with 0 errors');
                  setIsDeviceDiagOpen(false);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl"
              >
                Close Diagnostic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
