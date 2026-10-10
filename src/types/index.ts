export type PageId =
  | 'dashboard'
  | 'medications'
  | 'scanner'
  | 'ocr'
  | 'gestures'
  | 'assistant'
  | 'reports'
  | 'settings';

export type SettingsTab =
  | 'patients'
  | 'caregivers'
  | 'voice'
  | 'alerts'
  | 'emergency'
  | 'accessibility'
  | 'language'
  | 'privacy'
  | 'devices';

export type DoseStatus = 'pending' | 'taken' | 'snoozed' | 'missed';

export type TimingRule = 'Before Food' | 'After Food' | 'With Food' | 'Empty Stomach';

export type MedicineCategory = 'Morning' | 'Afternoon' | 'Night' | 'Emergency' | 'Low Stock';

export interface InventoryRefillRecord {
  id: string;
  medicationId: string;
  patientId: string;
  date: string;
  quantityAdded: number;
  cost?: string;
  supplierPharmacy?: string;
  batchNumber?: string;
  expiryDate?: string;
  notes?: string;
}

export interface InventoryTransaction {
  id: string;
  medicationId: string;
  medicineName: string;
  patientId: string;
  timestamp: string;
  type: 'Dose Taken' | 'Stock Refill' | 'Manual Adjustment' | 'Initial Stock';
  quantityChange: number; // e.g. -1, -2, +30
  previousStock: number;
  newStock: number;
  note?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  scheduledTime: string;
  timingRule: TimingRule;
  category: 'Morning' | 'Afternoon' | 'Night' | 'Emergency';
  inventory: number;
  totalStock: number;
  status: DoseStatus;
  instructions: string;
  patientId: string;
  lastTaken?: string;
  verified?: boolean;
  // Inventory & Refill Tracker additions
  unitsPerDose?: number; // default 1
  dailyDosesCount?: number; // expected daily frequency, default 1
  reorderThreshold?: number; // threshold for low-stock alert, default 8
  expiryDate?: string; // e.g. '2026-12-31'
  lastRefillDate?: string; // e.g. '15 May 2026'
  purchaseHistory?: InventoryRefillRecord[];
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Female' | 'Male' | 'Other';
  bloodGroup: string;
  heightCm: number;
  weightKg: number;
  activeMedicationsCount: number;
  allergies: string[];
  diseases: string[];
  doctorName: string;
  emergencyContact: string;
}

export interface Caregiver {
  id: string;
  name: string;
  role: 'Caregiver' | 'Nurse' | 'Doctor' | 'Family Member' | string;
  phone: string;
  email?: string;
  relationship?: string;
  notes?: string;
  preferredContact?: 'Phone' | 'Chat' | 'WhatsApp' | 'Email';
  shiftTiming: 'Day Shift' | 'Night Shift' | 'Flexible' | 'On Call';
  isOnline: boolean;
  isPrimary: boolean;
  isVerified?: boolean;
  assignedPatientId?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CaregiverMessage {
  id: string;
  caregiverId: string;
  patientId: string;
  senderId: string; // 'patient' or 'caregiver' or user name
  senderName: string;
  senderRole: 'patient' | 'caregiver' | 'system';
  recipientId: string;
  text: string;
  timestamp: string;
  deliveryStatus: 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: string[];
}

export interface VitalMetrics {
  heartRate: number;
  bpSystolic: number;
  bpDiastolic: number;
  adherencePercentage: number;
  missedDoses: number;
  aiHealthScore: number;
  activeMeds: number;
  hydrationLiters: number;
  sleepHours: number;
}

export interface GestureLog {
  id: string;
  timestamp: string;
  gesture: 'OPEN PALM' | 'CLOSED FIST' | 'V SIGN' | 'OK SIGN';
  action: 'HELP' | 'STOP' | 'NEXT' | 'CONFIRM';
  confidence: number;
  status: 'SUCCESS' | 'CANCELLED';
}

export interface ScanResult {
  id: string;
  timestamp: string;
  medicineName: string;
  dosage: string;
  verifiedMatchId: string;
  confidence: number;
  expiryDate: string;
  interactionSafe: boolean;
  pillsToTake: number;
  instructions: string;
  imageThumbnail?: string;
}

export interface MedicationLogEntry {
  id: string;
  date: string;
  medicineName: string;
  scheduledTime: string;
  status: 'Taken' | 'Missed' | 'Snoozed';
  notes: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'reminder' | 'warning' | 'success' | 'alert';
  read: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  structuredData?: {
    suggestedMedicine?: string;
    dosage?: string;
    timing?: string;
    notes?: string[];
    recommendations?: string;
  };
}

export interface YoloDetectionBox {
  classId: number;
  className: string;
  confidence: number; // 0.0 - 1.0 or 0 - 100
  bbox: [number, number, number, number]; // [x1, y1, x2, y2] normalized or pixels
  color?: string;
}

export interface YoloInferenceResult {
  modelLoaded: boolean;
  modelName: string;
  inferenceTimeMs?: number;
  device?: string;
  boxes: YoloDetectionBox[];
  countsPerClass: Record<string, number>;
  totalPillsDetected: number;
  rawImageWidth?: number;
  rawImageHeight?: number;
  annotatedImageBase64?: string;
}
