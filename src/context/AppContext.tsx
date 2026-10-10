import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  PageId,
  SettingsTab,
  Medication,
  Patient,
  Caregiver,
  CaregiverMessage,
  VitalMetrics,
  GestureLog,
  ScanResult,
  MedicationLogEntry,
  SystemNotification,
  ChatMessage,
  InventoryTransaction,
  InventoryRefillRecord,
} from '../types';
import { caregiverApiService } from '../services/caregiverApiService';
import { medicationApiService } from '../services/medicationApiService';

interface AppContextType {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  activeSettingsTab: SettingsTab;
  setActiveSettingsTab: (tab: SettingsTab) => void;
  isAuthenticated: boolean;
  userRole: string;
  userName: string;
  currentUserId: string;
  login: (options?: { email?: string; role?: string; name?: string; userId?: string }) => void;
  logout: () => void;
  switchUserAccount: (userType: 'patient' | 'caregiver', targetId?: string) => void;
  
  // Patients & Caregivers
  patients: Patient[];
  activePatient: Patient;
  setActivePatient: (patient: Patient) => void;
  addPatient: (patient: Omit<Patient, 'id'>) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  
  caregivers: Caregiver[];
  activeCaregiver: Caregiver;
  addCaregiver: (caregiver: Omit<Caregiver, 'id'>) => Promise<Caregiver>;
  updateCaregiver: (id: string, updates: Partial<Caregiver>) => Promise<Caregiver>;
  deleteCaregiver: (id: string) => Promise<void>;
  caregiverMessages: CaregiverMessage[];
  sendCaregiverMessage: (caregiverId: string, text: string) => Promise<boolean>;
  sendCaregiverReply: (caregiverId: string, text: string) => Promise<boolean>;
  markConversationRead: (caregiverId: string) => Promise<void>;
  deleteCaregiverMessage: (messageId: string) => void;
  clearCaregiverConversation: (caregiverId: string) => void;

  // Medications & Inventory
  medications: Medication[];
  addMedication: (med: Omit<Medication, 'id'>) => void;
  updateMedication: (id: string, updates: Partial<Medication>) => void;
  deleteMedication: (id: string) => void;
  markDoseTaken: (id: string) => Promise<boolean>;
  snoozeDose: (id: string, minutes?: number) => void;
  inventoryTransactions: InventoryTransaction[];
  refillMedicationStock: (
    medId: string,
    quantityAdded: number,
    details?: {
      cost?: string;
      supplierPharmacy?: string;
      batchNumber?: string;
      expiryDate?: string;
      notes?: string;
    }
  ) => void;
  updateMedicationStockConfig: (
    medId: string,
    updates: {
      inventory?: number;
      totalStock?: number;
      unitsPerDose?: number;
      dailyDosesCount?: number;
      reorderThreshold?: number;
      expiryDate?: string;
    }
  ) => void;

  // Vitals & Status
  vitals: VitalMetrics;
  updateVitals: (updates: Partial<VitalMetrics>) => void;
  systemOnline: boolean;
  
  // Gestures
  gestureLogs: GestureLog[];
  addGestureLog: (log: Omit<GestureLog, 'id' | 'timestamp'>) => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;

  // Scans
  scanHistory: ScanResult[];
  addScanResult: (scan: Omit<ScanResult, 'id' | 'timestamp'>) => void;

  // Medication Logs & Analytics
  medicationLogs: MedicationLogEntry[];
  addMedicationLog: (log: Omit<MedicationLogEntry, 'id'>) => void;

  // Notifications
  notifications: SystemNotification[];
  addNotification: (notif: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Chat Assistant
  chatMessages: ChatMessage[];
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;

  // Toasts
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Preferences & IoT
  iotDeviceConnected: boolean;
  setIotDeviceConnected: (connected: boolean) => void;
  resetDemoData: () => void;
}

const initialPatients: Patient[] = [
  {
    id: 'pat-1',
    name: 'Kavya TS',
    age: 24,
    gender: 'Female',
    bloodGroup: 'O+',
    heightCm: 165,
    weightKg: 58,
    activeMedicationsCount: 3,
    allergies: ['Penicillin (High)'],
    diseases: ['None'],
    doctorName: 'Dr. Sarah Jenkins',
    emergencyContact: '555-0101',
  },
  {
    id: 'pat-2',
    name: 'Robert Hayes',
    age: 62,
    gender: 'Male',
    bloodGroup: 'A+',
    heightCm: 178,
    weightKg: 82,
    activeMedicationsCount: 4,
    allergies: ['Sulfa drugs'],
    diseases: ['Hypertension', 'Type 2 Diabetes'],
    doctorName: 'Dr. Sarah Jenkins',
    emergencyContact: '555-0144',
  },
];

const initialCaregivers: Caregiver[] = [
  {
    id: 'cg-1',
    name: 'Dr. Sarah Jenkins',
    role: 'Doctor',
    phone: '+91 98765 43210',
    email: 's.jenkins@apollo.med',
    relationship: 'Consulting Cardiologist (Apollo Hospital)',
    notes: 'Monitoring post-op blood pressure and daily ACE inhibitor adherence.',
    preferredContact: 'Phone',
    shiftTiming: 'Flexible',
    isOnline: true,
    isPrimary: true,
    isVerified: true,
    createdAt: '2026-01-15T08:30:00.000Z',
    updatedAt: '2026-03-20T10:15:00.000Z',
  },
  {
    id: 'cg-2',
    name: 'Nurse Priya Nair',
    role: 'Nurse',
    phone: '+91 98450 12345',
    email: 'priya.n@apollo.med',
    relationship: 'Staff Nurse & Vital Monitor',
    notes: 'Conducts weekly in-person home vitals checks and morning dosage verifications.',
    preferredContact: 'Chat',
    shiftTiming: 'Day Shift',
    isOnline: true,
    isPrimary: false,
    isVerified: true,
    createdAt: '2026-02-01T09:00:00.000Z',
    updatedAt: '2026-03-22T14:40:00.000Z',
  },
  {
    id: 'cg-3',
    name: 'Rahul Sharma',
    role: 'Caregiver',
    phone: '+91 91234 56789',
    email: 'rahul.care@gmail.com',
    relationship: 'Primary Family Caregiver (Son)',
    notes: 'Manages pharmacy refills and emergency escalations for evening doses.',
    preferredContact: 'WhatsApp',
    shiftTiming: 'On Call',
    isOnline: true,
    isPrimary: false,
    isVerified: true,
    createdAt: '2026-02-10T11:00:00.000Z',
    updatedAt: '2026-03-24T09:20:00.000Z',
  },
];

const initialCaregiverMessages: CaregiverMessage[] = [
  {
    id: 'cmsg-1',
    caregiverId: 'cg-2',
    patientId: 'pat-1',
    senderId: 'cg-2',
    senderName: 'Nurse Priya Nair',
    senderRole: 'caregiver',
    recipientId: 'pat-1',
    text: 'Good morning! Please make sure to take Metformin 500mg immediately after your breakfast today.',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    deliveryStatus: 'read',
  },
  {
    id: 'cmsg-2',
    caregiverId: 'cg-2',
    patientId: 'pat-1',
    senderId: 'pat-1',
    senderName: 'Rajesh Kumar',
    senderRole: 'patient',
    recipientId: 'cg-2',
    text: 'Thank you Sister Priya, dose logged successfully. Morning BP was 122/82 mmHg.',
    timestamp: new Date(Date.now() - 3600000 * 3.5).toISOString(),
    deliveryStatus: 'read',
  },
  {
    id: 'cmsg-3',
    caregiverId: 'cg-2',
    patientId: 'pat-1',
    senderId: 'cg-2',
    senderName: 'Nurse Priya Nair',
    senderRole: 'caregiver',
    recipientId: 'pat-1',
    text: 'Excellent numbers. Keep well hydrated in the afternoon.',
    timestamp: new Date(Date.now() - 3600000 * 2.8).toISOString(),
    deliveryStatus: 'delivered',
  },
  {
    id: 'cmsg-4',
    caregiverId: 'cg-1',
    patientId: 'pat-1',
    senderId: 'cg-1',
    senderName: 'Dr. Sarah Jenkins',
    senderRole: 'caregiver',
    recipientId: 'pat-1',
    text: 'Hello Rajesh, I reviewed your 14-day adherence graph. 94% compliance is solid. Let me know if you experience any mild dizziness from the evening Amlodipine.',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    deliveryStatus: 'read',
  },
];

const initialMedications: Medication[] = [
  {
    id: 'med-1',
    name: 'Metformin',
    dosage: '500mg',
    scheduledTime: '01:00 PM',
    timingRule: 'With Food',
    category: 'Afternoon',
    inventory: 30,
    totalStock: 60,
    unitsPerDose: 1,
    dailyDosesCount: 2,
    reorderThreshold: 10,
    expiryDate: '2026-11-30',
    lastRefillDate: '10 May 2026',
    status: 'pending',
    instructions: 'Take with main afternoon meal with full glass of water.',
    patientId: 'pat-1',
    purchaseHistory: [
      {
        id: 'rf-1',
        medicationId: 'med-1',
        patientId: 'pat-1',
        date: '10 May 2026',
        quantityAdded: 30,
        supplierPharmacy: 'Apollo Health Pharmacy',
        batchNumber: 'MET-8921',
        cost: '$18.50',
        expiryDate: '2026-11-30',
        notes: 'Monthly maintenance refill',
      },
    ],
  },
  {
    id: 'med-2',
    name: 'Amlodipine',
    dosage: '5mg',
    scheduledTime: '08:00 AM',
    timingRule: 'After Food',
    category: 'Morning',
    inventory: 22,
    totalStock: 30,
    unitsPerDose: 1,
    dailyDosesCount: 1,
    reorderThreshold: 7,
    expiryDate: '2027-04-15',
    lastRefillDate: '01 May 2026',
    status: 'taken',
    instructions: 'Blood pressure maintenance, taken morning after breakfast.',
    patientId: 'pat-1',
    lastTaken: '08:14 AM Today',
    verified: true,
    purchaseHistory: [
      {
        id: 'rf-2',
        medicationId: 'med-2',
        patientId: 'pat-1',
        date: '01 May 2026',
        quantityAdded: 30,
        supplierPharmacy: 'CareFirst Meds',
        batchNumber: 'AML-4410',
        cost: '$12.00',
        expiryDate: '2027-04-15',
      },
    ],
  },
  {
    id: 'med-3',
    name: 'Atorvastatin',
    dosage: '20mg',
    scheduledTime: '09:00 PM',
    timingRule: 'After Food',
    category: 'Night',
    inventory: 5,
    totalStock: 30,
    unitsPerDose: 1,
    dailyDosesCount: 1,
    reorderThreshold: 8,
    expiryDate: '2026-09-20',
    lastRefillDate: '20 Apr 2026',
    status: 'pending',
    instructions: 'Lipid regulator, take at bedtime with food.',
    patientId: 'pat-1',
    purchaseHistory: [
      {
        id: 'rf-3',
        medicationId: 'med-3',
        patientId: 'pat-1',
        date: '20 Apr 2026',
        quantityAdded: 30,
        supplierPharmacy: 'Apollo Health Pharmacy',
        batchNumber: 'ATV-1092',
        cost: '$24.00',
        expiryDate: '2026-09-20',
      },
    ],
  },
  {
    id: 'med-4',
    name: 'Lisinopril',
    dosage: '10mg',
    scheduledTime: '08:00 AM',
    timingRule: 'After Food',
    category: 'Morning',
    inventory: 14,
    totalStock: 30,
    unitsPerDose: 1,
    dailyDosesCount: 1,
    reorderThreshold: 7,
    expiryDate: '2027-01-10',
    lastRefillDate: '28 Apr 2026',
    status: 'taken',
    instructions: 'ACE inhibitor for cardiac pressure control.',
    patientId: 'pat-1',
    lastTaken: '08:05 AM Today',
    verified: true,
    purchaseHistory: [
      {
        id: 'rf-4',
        medicationId: 'med-4',
        patientId: 'pat-1',
        date: '28 Apr 2026',
        quantityAdded: 30,
        supplierPharmacy: 'Metro Rx Dispensary',
        batchNumber: 'LIS-7731',
        cost: '$15.00',
        expiryDate: '2027-01-10',
      },
    ],
  },
  {
    id: 'med-5',
    name: 'Paracetamol',
    dosage: '650mg',
    scheduledTime: '02:00 PM',
    timingRule: 'After Food',
    category: 'Emergency',
    inventory: 18,
    totalStock: 20,
    unitsPerDose: 1,
    dailyDosesCount: 1,
    reorderThreshold: 5,
    expiryDate: '2027-12-31',
    lastRefillDate: '12 May 2026',
    status: 'pending',
    instructions: 'Take only in case of acute fever or body ache.',
    patientId: 'pat-1',
    purchaseHistory: [
      {
        id: 'rf-5',
        medicationId: 'med-5',
        patientId: 'pat-1',
        date: '12 May 2026',
        quantityAdded: 20,
        supplierPharmacy: 'Corner Chemist',
        batchNumber: 'PCM-9018',
        cost: '$6.50',
        expiryDate: '2027-12-31',
      },
    ],
  },
];

const initialInventoryTransactions: InventoryTransaction[] = [
  {
    id: 'tx-1',
    medicationId: 'med-2',
    medicineName: 'Amlodipine',
    patientId: 'pat-1',
    timestamp: 'Today, 08:14 AM',
    type: 'Dose Taken',
    quantityChange: -1,
    previousStock: 23,
    newStock: 22,
    note: '1 dose consumed (5mg, After Food)',
  },
  {
    id: 'tx-2',
    medicationId: 'med-4',
    medicineName: 'Lisinopril',
    patientId: 'pat-1',
    timestamp: 'Today, 08:05 AM',
    type: 'Dose Taken',
    quantityChange: -1,
    previousStock: 15,
    newStock: 14,
    note: '1 dose consumed (10mg, After Food)',
  },
  {
    id: 'tx-3',
    medicationId: 'med-1',
    medicineName: 'Metformin',
    patientId: 'pat-1',
    timestamp: '10 May 2026, 10:30 AM',
    type: 'Stock Refill',
    quantityChange: 30,
    previousStock: 0,
    newStock: 30,
    note: 'Refill from Apollo Health Pharmacy (Batch: MET-8921)',
  },
  {
    id: 'tx-4',
    medicationId: 'med-3',
    medicineName: 'Atorvastatin',
    patientId: 'pat-1',
    timestamp: '20 Apr 2026, 04:15 PM',
    type: 'Manual Adjustment',
    quantityChange: -5,
    previousStock: 10,
    newStock: 5,
    note: 'Inventory count reconciliation',
  },
];

const initialGestureLogs: GestureLog[] = [
  {
    id: 'gl-1',
    timestamp: '02:51:24 pm',
    gesture: 'V SIGN',
    action: 'NEXT',
    confidence: 97,
    status: 'SUCCESS',
  },
  {
    id: 'gl-2',
    timestamp: '02:51:08 pm',
    gesture: 'OK SIGN',
    action: 'CONFIRM',
    confidence: 94,
    status: 'SUCCESS',
  },
  {
    id: 'gl-3',
    timestamp: '02:50:45 pm',
    gesture: 'CLOSED FIST',
    action: 'STOP',
    confidence: 95,
    status: 'SUCCESS',
  },
  {
    id: 'gl-4',
    timestamp: '01:30:12 pm',
    gesture: 'OPEN PALM',
    action: 'HELP',
    confidence: 99,
    status: 'SUCCESS',
  },
];

const initialScanHistory: ScanResult[] = [
  {
    id: 'scan-1',
    timestamp: '19 May 2026, 02:45 PM',
    medicineName: 'Amoxicillin',
    dosage: '500mg',
    verifiedMatchId: 'MED-8942',
    confidence: 98.5,
    expiryDate: '12/2026',
    interactionSafe: true,
    pillsToTake: 18,
    instructions: 'Take 1 capsule every 8 hours with drinking water.',
  },
  {
    id: 'scan-2',
    timestamp: '18 May 2026, 11:15 AM',
    medicineName: 'Metformin',
    dosage: '500mg',
    verifiedMatchId: 'MED-4102',
    confidence: 96.8,
    expiryDate: '08/2027',
    interactionSafe: true,
    pillsToTake: 30,
    instructions: 'Verified oral hypoglycemic agent for glycemic index moderation.',
  },
];

const initialMedicationLogs: MedicationLogEntry[] = [
  {
    id: 'log-1',
    date: '19 May 2026',
    medicineName: 'Paracetamol',
    scheduledTime: '08:00 AM',
    status: 'Missed',
    notes: 'Taken after food',
  },
  {
    id: 'log-2',
    date: '19 May 2026',
    medicineName: 'Metformin',
    scheduledTime: '01:00 PM',
    status: 'Taken',
    notes: 'Reminder missed',
  },
  {
    id: 'log-3',
    date: '18 May 2026',
    medicineName: 'Amlodipine',
    scheduledTime: '06:00 PM',
    status: 'Taken',
    notes: 'Dose delayed 30 min',
  },
  {
    id: 'log-4',
    date: '18 May 2026',
    medicineName: 'Atorvastatin',
    scheduledTime: '08:00 PM',
    status: 'Taken',
    notes: 'Taken with water',
  },
  {
    id: 'log-5',
    date: '17 May 2026',
    medicineName: 'Aspirin',
    scheduledTime: '08:00 AM',
    status: 'Taken',
    notes: 'Skipped - travel',
  },
  {
    id: 'log-6',
    date: '16 May 2026',
    medicineName: 'Paracetamol',
    scheduledTime: '08:00 AM',
    status: 'Missed',
    notes: 'Taken with water',
  },
  {
    id: 'log-7',
    date: '16 May 2026',
    medicineName: 'Metformin',
    scheduledTime: '01:00 PM',
    status: 'Taken',
    notes: 'Taken after food',
  },
  {
    id: 'log-8',
    date: '15 May 2026',
    medicineName: 'Amlodipine',
    scheduledTime: '06:00 PM',
    status: 'Taken',
    notes: 'Dose delayed 30 min',
  },
  {
    id: 'log-9',
    date: '15 May 2026',
    medicineName: 'Atorvastatin',
    scheduledTime: '08:00 PM',
    status: 'Taken',
    notes: 'Taken on schedule',
  },
  {
    id: 'log-10',
    date: '14 May 2026',
    medicineName: 'Aspirin',
    scheduledTime: '08:00 AM',
    status: 'Taken',
    notes: 'Reminder missed',
  },
];

const initialNotifications: SystemNotification[] = [
  {
    id: 'notif-1',
    title: 'Medication Due Soon',
    message: 'Metformin 500mg scheduled at 01:00 PM with food.',
    timestamp: '10m ago',
    type: 'reminder',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Low Inventory Alert',
    message: 'Atorvastatin 20mg has only 5 pills remaining. Refill advised.',
    timestamp: '1h ago',
    type: 'warning',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Vitals Recorded',
    message: 'Morning Blood Pressure 120/80 mmHg within optimal range.',
    timestamp: '2h ago',
    type: 'success',
    read: false,
  },
];

const initialChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'ai',
    text: 'Hello! I am IntelliMed AI, your personal healthcare companion. How can I assist you with your medications or health today?',
    timestamp: '10:00 AM',
  },
  {
    id: 'msg-2',
    sender: 'user',
    text: 'I have a fever. What medicine should I take?',
    timestamp: '10:01 AM',
  },
  {
    id: 'msg-3',
    sender: 'ai',
    text: 'Based on your symptom of fever, here is my medical guidance:',
    timestamp: '10:01 AM',
    structuredData: {
      suggestedMedicine: 'Paracetamol (Acetaminophen) 650mg',
      dosage: '1 tablet every 6-8 hours',
      timing: 'Morning & Night (After Food)',
      notes: [
        'Drink plenty of water and stay hydrated',
        'Do NOT take on an empty stomach',
        'Avoid combining with other cold medications containing acetaminophen',
      ],
      recommendations:
        'Consult your doctor if the fever exceeds 102°F (38.8°C) or lasts more than 3 days.',
    },
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & Auth
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>('patients');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem('intellimed_auth_user_id') || 'pat-1';
  });
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('intellimed_auth_user_name') || 'Rajesh Kumar (Patient)';
  });
  const [userRole, setUserRole] = useState<string>(() => {
    return localStorage.getItem('intellimed_auth_user_role') || 'Patient';
  });

  // Persistence helpers
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('intellimed_patients');
    return saved ? JSON.parse(saved) : initialPatients;
  });

  const [activePatient, setActivePatient] = useState<Patient>(patients[0] || initialPatients[0]);

  const [caregivers, setCaregivers] = useState<Caregiver[]>(() => {
    const saved = localStorage.getItem('intellimed_caregivers');
    return saved ? JSON.parse(saved) : initialCaregivers;
  });

  const [medications, setMedications] = useState<Medication[]>(() => {
    const saved = localStorage.getItem('intellimed_medications');
    return saved ? JSON.parse(saved) : initialMedications;
  });

  const [vitals, setVitals] = useState<VitalMetrics>({
    heartRate: 72,
    bpSystolic: 120,
    bpDiastolic: 80,
    adherencePercentage: 94,
    missedDoses: 1,
    aiHealthScore: 98,
    activeMeds: 3,
    hydrationLiters: 1.2,
    sleepHours: 7.5,
  });

  const [gestureLogs, setGestureLogs] = useState<GestureLog[]>(initialGestureLogs);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>(initialScanHistory);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLogEntry[]>(initialMedicationLogs);
  const [notifications, setNotifications] = useState<SystemNotification[]>(initialNotifications);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [iotDeviceConnected, setIotDeviceConnected] = useState<boolean>(true);
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>(() => {
    const saved = localStorage.getItem('intellimed_inventory_transactions');
    return saved ? JSON.parse(saved) : initialInventoryTransactions;
  });

  const [caregiverMessages, setCaregiverMessages] = useState<CaregiverMessage[]>(() => {
    const saved = localStorage.getItem('intellimed_caregiver_messages');
    return saved ? JSON.parse(saved) : initialCaregiverMessages;
  });

  // Initial backend fetch for caregivers & messages
  useEffect(() => {
    let isSubscribed = true;
    caregiverApiService
      .fetchCaregivers()
      .then((serverCgs) => {
        if (isSubscribed && serverCgs && serverCgs.length > 0) {
          setCaregivers(serverCgs);
        }
      })
      .catch((err) => console.warn('Could not load initial caregivers from server:', err));

    caregiverApiService
      .fetchMessages()
      .then((serverMsgs) => {
        if (isSubscribed && serverMsgs) {
          setCaregiverMessages(serverMsgs);
        }
      })
      .catch((err) => console.warn('Could not load initial messages from server:', err));

    medicationApiService
      .fetchMedications()
      .then((serverMeds) => {
        if (isSubscribed && serverMeds && serverMeds.length > 0) {
          setMedications(serverMeds);
        }
      })
      .catch((err) => console.warn('Could not load initial medications from server:', err));

    return () => {
      isSubscribed = false;
    };
  }, [currentUserId]);

  // Real-time synchronization loop (polls server every 2.5s for new messages/replies)
  useEffect(() => {
    const interval = setInterval(() => {
      caregiverApiService
        .fetchMessages()
        .then((serverMsgs) => {
          if (serverMsgs) {
            setCaregiverMessages((prev) => {
              // Only trigger state update if there is a real change or new message
              if (
                serverMsgs.length !== prev.length ||
                (serverMsgs[serverMsgs.length - 1]?.id !== prev[prev.length - 1]?.id)
              ) {
                return serverMsgs;
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    }, 2500);

    return () => clearInterval(interval);
  }, [currentUserId]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('intellimed_medications', JSON.stringify(medications));
  }, [medications]);

  useEffect(() => {
    localStorage.setItem('intellimed_patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('intellimed_caregivers', JSON.stringify(caregivers));
  }, [caregivers]);

  useEffect(() => {
    localStorage.setItem('intellimed_caregiver_messages', JSON.stringify(caregiverMessages));
  }, [caregiverMessages]);

  useEffect(() => {
    localStorage.setItem('intellimed_inventory_transactions', JSON.stringify(inventoryTransactions));
  }, [inventoryTransactions]);

  useEffect(() => {
    localStorage.setItem('intellimed_auth_user_id', currentUserId);
    localStorage.setItem('intellimed_auth_user_name', userName);
    localStorage.setItem('intellimed_auth_user_role', userRole);
  }, [currentUserId, userName, userRole]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const login = (options?: { email?: string; role?: string; name?: string; userId?: string }) => {
    if (options?.userId) setCurrentUserId(options.userId);
    if (options?.name) setUserName(options.name);
    if (options?.role) setUserRole(options.role);
    setIsAuthenticated(true);
    showToast(`Logged in as ${options?.name || userName}`);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const switchUserAccount = (userType: 'patient' | 'caregiver', targetId?: string) => {
    if (userType === 'patient') {
      setCurrentUserId('pat-1');
      setUserName('Rajesh Kumar (Patient)');
      setUserRole('Patient');
      showToast('Switched session to Patient Account (Rajesh Kumar)');
    } else {
      const cg = caregivers.find((c) => c.id === targetId) || caregivers[0];
      const newId = cg?.id || 'cg-2';
      const newName = cg?.name || 'Nurse Priya Nair';
      const newRole = cg?.role || 'Nurse';
      setCurrentUserId(newId);
      setUserName(`${newName} (${newRole})`);
      setUserRole(newRole);
      showToast(`Switched session to Caregiver Account: ${newName}`);
    }
  };

  const addPatient = (patientData: Omit<Patient, 'id'>) => {
    const newPat: Patient = {
      ...patientData,
      id: `pat-${Date.now()}`,
    };
    setPatients((prev) => [newPat, ...prev]);
    setActivePatient(newPat);
    showToast(`Patient ${newPat.name} profile created`);
  };

  const updatePatient = (id: string, updates: Partial<Patient>) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    setActivePatient((prev) => (prev.id === id ? { ...prev, ...updates } : prev));
    showToast('Patient record updated');
  };

  const deletePatient = (id: string) => {
    if (patients.length <= 1) {
      showToast('Cannot delete the only remaining patient profile');
      return;
    }
    const remaining = patients.filter((p) => p.id !== id);
    setPatients(remaining);
    if (activePatient.id === id) {
      setActivePatient(remaining[0]);
    }
    showToast('Patient profile deleted');
  };

  const addCaregiver = async (cgData: Omit<Caregiver, 'id'>): Promise<Caregiver> => {
    try {
      const created = await caregiverApiService.addCaregiver(cgData);
      setCaregivers((prev) => [...prev, created]);
      showToast(`Caregiver ${created.name} registered successfully`);
      return created;
    } catch (err: any) {
      console.error('Backend addCaregiver failed:', err);
      showToast(err.message || 'Failed to save caregiver contact');
      throw err;
    }
  };

  const updateCaregiver = async (id: string, updates: Partial<Caregiver>): Promise<Caregiver> => {
    try {
      const updated = await caregiverApiService.updateCaregiver(id, updates);
      setCaregivers((prev) => prev.map((c) => (c.id === id ? updated : c)));
      showToast('Caregiver contact details updated');
      return updated;
    } catch (err: any) {
      console.error('Backend updateCaregiver failed:', err);
      showToast(err.message || 'Failed to update caregiver contact');
      throw err;
    }
  };

  const deleteCaregiver = async (id: string): Promise<void> => {
    const target = caregivers.find((c) => c.id === id);
    try {
      await caregiverApiService.deleteCaregiver(id);
      setCaregivers((prev) => prev.filter((c) => c.id !== id));
      setCaregiverMessages((prev) => prev.filter((m) => m.caregiverId !== id));
      showToast(target ? `Removed ${target.name} from caregivers` : 'Caregiver removed');
    } catch (err: any) {
      console.error('Backend deleteCaregiver failed:', err);
      showToast(err.message || 'Failed to delete caregiver record');
      throw err;
    }
  };

  const sendCaregiverMessage = async (caregiverId: string, text: string): Promise<boolean> => {
    if (!text || !text.trim()) return false;
    const cg = caregivers.find((c) => c.id === caregiverId);
    if (!cg) {
      showToast('Error: Caregiver not found');
      return false;
    }

    const isCurrentCaregiver = userRole !== 'Patient';
    const senderRole: 'patient' | 'caregiver' = isCurrentCaregiver ? 'caregiver' : 'patient';
    const senderId = currentUserId;
    const senderName = userName;
    const recipientId = isCurrentCaregiver ? (activePatient?.id || 'pat-1') : caregiverId;

    try {
      const deliveredMsg = await caregiverApiService.sendMessage({
        caregiverId,
        patientId: activePatient?.id || 'pat-1',
        senderId,
        senderName,
        senderRole,
        recipientId,
        text: text.trim(),
      });

      setCaregiverMessages((prev) => [...prev, deliveredMsg]);

      addNotification({
        title: `Message sent to ${isCurrentCaregiver ? activePatient?.name || 'Patient' : cg.name}`,
        message: text.trim().slice(0, 70) + (text.trim().length > 70 ? '...' : ''),
        type: 'success',
      });

      return true;
    } catch (err: any) {
      console.error('Failed to send message to backend:', err);
      // Local fallback record
      const fallbackMsg: CaregiverMessage = {
        id: `cmsg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        caregiverId,
        patientId: activePatient?.id || 'pat-1',
        senderId,
        senderName,
        senderRole,
        recipientId,
        text: text.trim(),
        timestamp: new Date().toISOString(),
        deliveryStatus: 'delivered',
      };
      setCaregiverMessages((prev) => [...prev, fallbackMsg]);
      return true;
    }
  };

  const deleteCaregiverMessage = async (messageId: string) => {
    try {
      await caregiverApiService.deleteMessage(messageId);
    } catch (err) {
      console.warn('Failed to delete message on backend:', err);
    }
    setCaregiverMessages((prev) => prev.filter((m) => m.id !== messageId));
    showToast('Message deleted');
  };

  const clearCaregiverConversation = async (caregiverId: string) => {
    try {
      await caregiverApiService.clearConversation(caregiverId);
    } catch (err) {
      console.warn('Failed to clear conversation on backend:', err);
    }
    setCaregiverMessages((prev) => prev.filter((m) => m.caregiverId !== caregiverId));
    showToast('Conversation history cleared');
  };

  const sendCaregiverReply = async (caregiverId: string, text: string): Promise<boolean> => {
    if (!text || !text.trim()) return false;
    const cg = caregivers.find((c) => c.id === caregiverId);
    try {
      const deliveredMsg = await caregiverApiService.sendCaregiverReply(
        caregiverId,
        text.trim(),
        activePatient?.id || 'pat-1'
      );
      setCaregiverMessages((prev) => [...prev, deliveredMsg]);
      showToast(`Reply from ${cg?.name || 'Caregiver'} sent`);
      return true;
    } catch (err: any) {
      console.error('Failed to send caregiver reply:', err);
      showToast(err.message || 'Failed to submit caregiver reply');
      return false;
    }
  };

  const markConversationRead = async (caregiverId: string) => {
    const readerRole = userRole === 'Patient' ? 'patient' : 'caregiver';
    await caregiverApiService.markConversationRead(caregiverId, readerRole);
    setCaregiverMessages((prev) =>
      prev.map((m) => {
        if (m.caregiverId === caregiverId) {
          if (readerRole === 'caregiver' && m.senderRole === 'patient') {
            return { ...m, deliveryStatus: 'read' };
          }
          if (readerRole === 'patient' && m.senderRole === 'caregiver') {
            return { ...m, deliveryStatus: 'read' };
          }
        }
        return m;
      })
    );
  };

  const addMedication = (medData: Omit<Medication, 'id'>) => {
    const newMed: Medication = {
      ...medData,
      id: `med-${Date.now()}`,
    };
    setMedications((prev) => [newMed, ...prev]);
    // update patient active meds count
    setVitals((prev) => ({ ...prev, activeMeds: prev.activeMeds + 1 }));
    showToast(`Medicine ${newMed.name} added successfully`);
  };

  const updateMedication = (id: string, updates: Partial<Medication>) => {
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
    showToast('Medication updated');
  };

  const deleteMedication = (id: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
    setVitals((prev) => ({ ...prev, activeMeds: Math.max(1, prev.activeMeds - 1) }));
    showToast('Medication deleted');
  };

  const markDoseTaken = async (id: string): Promise<boolean> => {
    const med = medications.find((m) => m.id === id);
    if (!med) {
      showToast('Error: Medication record not found');
      return false;
    }

    // Prevent duplicate deductions: If already marked as taken today, do not deduct again
    if (med.status === 'taken') {
      showToast(`${med.name} was already marked as taken today.`);
      return false;
    }

    try {
      const res = await medicationApiService.confirmDose(id);
      if (!res.success) {
        throw new Error(res.error || 'Failed to confirm dose ingestion');
      }

      const unitsDeducted = res.deducted ?? (med.unitsPerDose ?? 1);
      const newInventory = res.remainingStock ?? Math.max(0, med.inventory - unitsDeducted);

      setMedications((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                status: 'taken',
                inventory: newInventory,
                lastTaken: 'Just now',
                verified: true,
              }
            : m
        )
      );

      // Record inventory transaction
      const newTx: InventoryTransaction = {
        id: `tx-${Date.now()}`,
        medicationId: med.id,
        medicineName: med.name,
        patientId: med.patientId || activePatient.id,
        timestamp: new Date().toLocaleString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        type: 'Dose Taken',
        quantityChange: -unitsDeducted,
        previousStock: med.inventory,
        newStock: newInventory,
        note: `1 dose consumed (${med.dosage}, ${med.timingRule}) - Verified`,
      };
      setInventoryTransactions((prev) => [newTx, ...prev]);

      // Low stock warning / notification integration
      const threshold = med.reorderThreshold ?? 8;
      if (newInventory <= threshold) {
        addNotification({
          title: newInventory === 0 ? `Out of Stock: ${med.name}` : `Low Stock Alert: ${med.name}`,
          message:
            newInventory === 0
              ? `${med.name} has run out of stock (0 pills remaining). Immediate prescription refill required.`
              : `${med.name} is down to ${newInventory} units (reorder threshold: ${threshold}). Refill advised soon.`,
          type: 'warning',
        });
      }

      // Add to medication logs
      const newLog: MedicationLogEntry = {
        id: `log-${Date.now()}`,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        medicineName: med.name,
        scheduledTime: med.scheduledTime,
        status: 'Taken',
        notes: `${med.timingRule} logged via System`,
      };
      setMedicationLogs((prev) => [newLog, ...prev]);

      // Recalculate adherence
      setVitals((prev) => ({
        ...prev,
        adherencePercentage: Math.min(100, prev.adherencePercentage + 1),
      }));

      showToast(`${med.name} verified & stock updated (-${unitsDeducted}). Stock: ${newInventory} left`);
      return true;
    } catch (err: any) {
      console.error('Failed to confirm dose ingestion:', err);
      showToast(err?.message || 'Error updating medication dose in database');
      return false;
    }
  };

  const refillMedicationStock = (
    medId: string,
    quantityAdded: number,
    details?: {
      cost?: string;
      supplierPharmacy?: string;
      batchNumber?: string;
      expiryDate?: string;
      notes?: string;
    }
  ) => {
    const med = medications.find((m) => m.id === medId);
    if (!med) return;

    const previousStock = med.inventory;
    const newStock = previousStock + quantityAdded;
    const todayStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const refillRecord: InventoryRefillRecord = {
      id: `rf-${Date.now()}`,
      medicationId: medId,
      patientId: med.patientId || activePatient.id,
      date: todayStr,
      quantityAdded,
      cost: details?.cost,
      supplierPharmacy: details?.supplierPharmacy,
      batchNumber: details?.batchNumber,
      expiryDate: details?.expiryDate || med.expiryDate,
      notes: details?.notes,
    };

    setMedications((prev) =>
      prev.map((m) =>
        m.id === medId
          ? {
              ...m,
              inventory: newStock,
              totalStock: Math.max(m.totalStock, newStock),
              lastRefillDate: todayStr,
              expiryDate: details?.expiryDate || m.expiryDate,
              purchaseHistory: [refillRecord, ...(m.purchaseHistory || [])],
            }
          : m
      )
    );

    const transaction: InventoryTransaction = {
      id: `tx-${Date.now()}`,
      medicationId: medId,
      medicineName: med.name,
      patientId: med.patientId || activePatient.id,
      timestamp: new Date().toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      type: 'Stock Refill',
      quantityChange: quantityAdded,
      previousStock,
      newStock,
      note: details?.supplierPharmacy
        ? `Refill from ${details.supplierPharmacy} (Batch: ${details.batchNumber || 'N/A'})`
        : 'Stock replenishment',
    };
    setInventoryTransactions((prev) => [transaction, ...prev]);

    addNotification({
      title: `Stock Refilled: ${med.name}`,
      message: `Added +${quantityAdded} units. New available stock is ${newStock} units.`,
      type: 'success',
    });

    showToast(`Refilled ${quantityAdded} units for ${med.name}. Total stock: ${newStock}`);
  };

  const updateMedicationStockConfig = (
    medId: string,
    updates: {
      inventory?: number;
      totalStock?: number;
      unitsPerDose?: number;
      dailyDosesCount?: number;
      reorderThreshold?: number;
      expiryDate?: string;
    }
  ) => {
    const med = medications.find((m) => m.id === medId);
    if (!med) return;

    const previousStock = med.inventory;
    const newStock = updates.inventory !== undefined ? Math.max(0, updates.inventory) : previousStock;

    setMedications((prev) =>
      prev.map((m) =>
        m.id === medId
          ? {
              ...m,
              ...updates,
              inventory: newStock,
            }
          : m
      )
    );

    if (updates.inventory !== undefined && updates.inventory !== previousStock) {
      const change = newStock - previousStock;
      const transaction: InventoryTransaction = {
        id: `tx-${Date.now()}`,
        medicationId: medId,
        medicineName: med.name,
        patientId: med.patientId || activePatient.id,
        timestamp: new Date().toLocaleString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        type: 'Manual Adjustment',
        quantityChange: change,
        previousStock,
        newStock,
        note: `Manual stock level adjustment (${change > 0 ? '+' : ''}${change})`,
      };
      setInventoryTransactions((prev) => [transaction, ...prev]);
    }

    showToast(`Inventory parameters updated for ${med.name}`);
  };

  const snoozeDose = (id: string, minutes: number = 15) => {
    const med = medications.find((m) => m.id === id);
    if (!med) return;

    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: 'snoozed' } : m))
    );

    showToast(`Reminder snoozed for ${minutes} mins`);
  };

  const updateVitals = (updates: Partial<VitalMetrics>) => {
    setVitals((prev) => ({ ...prev, ...updates }));
    showToast('Vitals updated');
  };

  const addGestureLog = (logData: Omit<GestureLog, 'id' | 'timestamp'>) => {
    const newLog: GestureLog = {
      ...logData,
      id: `gl-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).toLowerCase(),
    };
    setGestureLogs((prev) => [newLog, ...prev.slice(0, 19)]);
  };

  const addScanResult = (scanData: Omit<ScanResult, 'id' | 'timestamp'>) => {
    const newScan: ScanResult = {
      ...scanData,
      id: `scan-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setScanHistory((prev) => [newScan, ...prev]);
    showToast(`Scanned: ${newScan.medicineName} (${newScan.confidence}% confidence)`);
  };

  const addMedicationLog = (logData: Omit<MedicationLogEntry, 'id'>) => {
    const newLog: MedicationLogEntry = {
      ...logData,
      id: `log-${Date.now()}`,
    };
    setMedicationLogs((prev) => [newLog, ...prev]);
  };

  const addNotification = (notifData: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: SystemNotification = {
      ...notifData,
      id: `notif-${Date.now()}`,
      timestamp: 'Just now',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    showToast('Notifications cleared');
  };

  const addChatMessage = (msgData: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMsg: ChatMessage = {
      ...msgData,
      id: `msg-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    };
    setChatMessages((prev) => [...prev, newMsg]);
  };

  const clearChat = () => {
    setChatMessages([initialChatMessages[0]]);
    showToast('Chat history cleared');
  };

  const resetDemoData = () => {
    localStorage.removeItem('intellimed_medications');
    localStorage.removeItem('intellimed_patients');
    localStorage.removeItem('intellimed_caregivers');
    localStorage.removeItem('intellimed_inventory_transactions');
    setMedications(initialMedications);
    setPatients(initialPatients);
    setActivePatient(initialPatients[0]);
    setCaregivers(initialCaregivers);
    setInventoryTransactions(initialInventoryTransactions);
    setGestureLogs(initialGestureLogs);
    setScanHistory(initialScanHistory);
    setMedicationLogs(initialMedicationLogs);
    setNotifications(initialNotifications);
    setChatMessages(initialChatMessages);
    setVitals({
      heartRate: 72,
      bpSystolic: 120,
      bpDiastolic: 80,
      adherencePercentage: 94,
      missedDoses: 1,
      aiHealthScore: 98,
      activeMeds: 3,
      hydrationLiters: 1.2,
      sleepHours: 7.5,
    });
    showToast('Demo data restored to pristine state');
  };

  return (
    <AppContext.Provider
      value={{
        activePage,
        setActivePage,
        activeSettingsTab,
        setActiveSettingsTab,
        isAuthenticated,
        userRole,
        userName,
        currentUserId,
        login,
        logout,
        switchUserAccount,
        patients,
        activePatient,
        setActivePatient,
        addPatient,
        updatePatient,
        deletePatient,
        caregivers,
        activeCaregiver: caregivers[0] || initialCaregivers[0],
        addCaregiver,
        updateCaregiver,
        deleteCaregiver,
        caregiverMessages,
        sendCaregiverMessage,
        sendCaregiverReply,
        markConversationRead,
        deleteCaregiverMessage,
        clearCaregiverConversation,
        medications,
        addMedication,
        updateMedication,
        deleteMedication,
        markDoseTaken,
        snoozeDose,
        inventoryTransactions,
        refillMedicationStock,
        updateMedicationStockConfig,
        vitals,
        updateVitals,
        systemOnline: true,
        gestureLogs,
        addGestureLog,
        voiceEnabled,
        setVoiceEnabled,
        scanHistory,
        addScanResult,
        medicationLogs,
        addMedicationLog,
        notifications,
        addNotification,
        markNotificationAsRead,
        clearAllNotifications,
        chatMessages,
        addChatMessage,
        clearChat,
        toastMessage,
        showToast,
        iotDeviceConnected,
        setIotDeviceConnected,
        resetDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
