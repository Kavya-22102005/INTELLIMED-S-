import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Persistent JSON Database Storage Setup
const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const CAREGIVERS_FILE = path.join(DATA_DIR, 'caregivers.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'caregiver_messages.json');
const MEDICATIONS_FILE = path.join(DATA_DIR, 'medications.json');

export interface MedicationRecord {
  id: string;
  name: string;
  dosage: string;
  scheduledTime: string;
  timingRule: string;
  category: string;
  inventory: number;
  totalStock: number;
  unitsPerDose: number;
  dailyDosesCount: number;
  reorderThreshold: number;
  expiryDate: string;
  lastRefillDate?: string;
  status: 'pending' | 'taken' | 'missed' | 'snoozed';
  instructions?: string;
  patientId: string;
  lastTaken?: string;
  verified?: boolean;
}

// Interface types
export interface CaregiverRecord {
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

export interface CaregiverMessageRecord {
  id: string;
  caregiverId: string;
  patientId: string;
  senderId: string;
  senderName: string;
  senderRole: 'patient' | 'caregiver' | 'system';
  recipientId: string;
  text: string;
  timestamp: string;
  deliveryStatus: 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: string[];
}

// Initial seed caregivers
const initialCaregiversSeed: CaregiverRecord[] = [
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

const initialMessagesSeed: CaregiverMessageRecord[] = [
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

function readCaregiversFromFile(): CaregiverRecord[] {
  try {
    if (!fs.existsSync(CAREGIVERS_FILE)) {
      fs.writeFileSync(CAREGIVERS_FILE, JSON.stringify(initialCaregiversSeed, null, 2), 'utf8');
      return initialCaregiversSeed;
    }
    const raw = fs.readFileSync(CAREGIVERS_FILE, 'utf8');
    return JSON.parse(raw) as CaregiverRecord[];
  } catch (err) {
    console.error('Error reading caregivers file:', err);
    return initialCaregiversSeed;
  }
}

function writeCaregiversToFile(data: CaregiverRecord[]) {
  try {
    fs.writeFileSync(CAREGIVERS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing caregivers file:', err);
  }
}

function readMessagesFromFile(): CaregiverMessageRecord[] {
  try {
    if (!fs.existsSync(MESSAGES_FILE)) {
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify(initialMessagesSeed, null, 2), 'utf8');
      return initialMessagesSeed;
    }
    const raw = fs.readFileSync(MESSAGES_FILE, 'utf8');
    return JSON.parse(raw) as CaregiverMessageRecord[];
  } catch (err) {
    console.error('Error reading messages file:', err);
    return initialMessagesSeed;
  }
}

function writeMessagesToFile(data: CaregiverMessageRecord[]) {
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing messages file:', err);
  }
}

function readMedicationsFromFile(): MedicationRecord[] {
  try {
    if (!fs.existsSync(MEDICATIONS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(MEDICATIONS_FILE, 'utf8');
    return JSON.parse(raw) as MedicationRecord[];
  } catch (err) {
    console.error('Error reading medications file:', err);
    return [];
  }
}

function writeMedicationsToFile(data: MedicationRecord[]) {
  try {
    fs.writeFileSync(MEDICATIONS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing medications file:', err);
  }
}

// Indian mobile validator helper
function validateIndianMobileNumber(phone: string): { isValid: boolean; formatted: string } {
  if (!phone || typeof phone !== 'string') return { isValid: false, formatted: '' };
  const cleaned = phone.trim().replace(/[\s\-().]/g, '');
  let national = '';
  if (cleaned.startsWith('+91')) {
    national = cleaned.slice(3);
  } else if (cleaned.startsWith('0091')) {
    national = cleaned.slice(4);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    national = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    national = cleaned.slice(1);
  } else {
    national = cleaned;
  }
  if (!/^\d{10}$/.test(national)) return { isValid: false, formatted: phone };
  if (!/^[6-9]/.test(national)) return { isValid: false, formatted: phone };
  return {
    isValid: true,
    formatted: `+91 ${national.slice(0, 5)} ${national.slice(5)}`,
  };
}

// Authentication / user authorization extraction helper
function getRequestUserId(req: Request): string {
  const headerUserId = req.header('x-user-id') || req.header('authorization');
  if (headerUserId) {
    const cleaned = headerUserId.replace(/^Bearer\s+/i, '').trim();
    if (cleaned) return cleaned;
  }
  return 'default-user';
}

// ==========================================
// CAREGIVER CRUD ENDPOINTS (Part A & D)
// ==========================================

// GET /api/caregivers - Load all contacts authorized for user
app.get('/api/caregivers', (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const all = readCaregiversFromFile();
    // Patient pat-1 and default-user can view all contacts for the patient care team
    // Caregivers on the care team can view fellow colleagues and themselves
    const userCaregivers = all.filter((c) => {
      if (!c.userId || c.userId === 'default-user' || userId === 'default-user' || userId === 'pat-1') {
        return true;
      }
      if (c.userId === userId || c.id === userId) return true;
      if (c.assignedPatientId && (userId === c.assignedPatientId || userId === 'pat-1')) return true;
      const isColleague = all.some((item) => item.id === userId);
      if (isColleague) return true;
      return false;
    });

    res.json({
      success: true,
      data: userCaregivers,
      count: userCaregivers.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch caregivers' });
  }
});

// POST /api/caregivers - Add a new caregiver contact with validation
app.post('/api/caregivers', (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req);
    const body = req.body as Partial<CaregiverRecord>;

    if (!body.name || !body.name.trim()) {
      res.status(400).json({ success: false, error: 'Full name is required.' });
      return;
    }

    if (!body.phone) {
      res.status(400).json({ success: false, error: 'Phone number is required.' });
      return;
    }

    const phoneCheck = validateIndianMobileNumber(body.phone);
    if (!phoneCheck.isValid) {
      res.status(400).json({
        success: false,
        error: 'A valid 10-digit Indian mobile number starting with 6, 7, 8, or 9 is required.',
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const newRecord: CaregiverRecord = {
      id: `cg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: body.name.trim(),
      role: body.role || 'Caregiver',
      phone: phoneCheck.formatted,
      email: body.email?.trim() || undefined,
      relationship: body.relationship?.trim() || undefined,
      notes: body.notes?.trim() || undefined,
      preferredContact: body.preferredContact || 'Phone',
      shiftTiming: body.shiftTiming || 'Day Shift',
      isOnline: body.isOnline !== undefined ? Boolean(body.isOnline) : true,
      isPrimary: Boolean(body.isPrimary),
      isVerified: true,
      assignedPatientId: body.assignedPatientId || 'pat-1',
      userId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const current = readCaregiversFromFile();
    current.push(newRecord);
    writeCaregiversToFile(current);

    res.status(201).json({
      success: true,
      message: `Caregiver ${newRecord.name} registered successfully.`,
      data: newRecord,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to create caregiver' });
  }
});

// PUT /api/caregivers/:id - Update an existing caregiver
app.put('/api/caregivers/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = getRequestUserId(req);
    const body = req.body as Partial<CaregiverRecord>;

    const current = readCaregiversFromFile();
    const targetIndex = current.findIndex((c) => c.id === id);

    if (targetIndex === -1) {
      res.status(404).json({ success: false, error: 'Caregiver record not found.' });
      return;
    }

    const existing = current[targetIndex];
    // Enforce authorization: patient owner, creator, or caregiver themselves
    const isAuthorized =
      !existing.userId ||
      existing.userId === 'default-user' ||
      existing.userId === userId ||
      userId === 'pat-1' ||
      userId === 'default-user' ||
      existing.id === userId;

    if (!isAuthorized) {
      res.status(403).json({ success: false, error: 'Not authorized to modify this caregiver record.' });
      return;
    }

    if (body.phone) {
      const phoneCheck = validateIndianMobileNumber(body.phone);
      if (!phoneCheck.isValid) {
        res.status(400).json({
          success: false,
          error: 'A valid 10-digit Indian mobile number starting with 6, 7, 8, or 9 is required.',
        });
        return;
      }
      body.phone = phoneCheck.formatted;
    }

    const updated: CaregiverRecord = {
      ...existing,
      ...body,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };

    current[targetIndex] = updated;
    writeCaregiversToFile(current);

    res.json({
      success: true,
      message: 'Caregiver details updated successfully.',
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to update caregiver' });
  }
});

// DELETE /api/caregivers/:id - Delete a caregiver
app.delete('/api/caregivers/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = getRequestUserId(req);

    const current = readCaregiversFromFile();
    const targetIndex = current.findIndex((c) => c.id === id);

    if (targetIndex === -1) {
      res.status(404).json({ success: false, error: 'Caregiver record not found.' });
      return;
    }

    const target = current[targetIndex];
    const isAuthorized =
      !target.userId ||
      target.userId === 'default-user' ||
      target.userId === userId ||
      userId === 'pat-1' ||
      userId === 'default-user';

    if (!isAuthorized) {
      res.status(403).json({ success: false, error: 'Not authorized to delete this caregiver record.' });
      return;
    }

    const remaining = current.filter((c) => c.id !== id);
    writeCaregiversToFile(remaining);

    // Also delete messages associated with this caregiver
    const allMsgs = readMessagesFromFile();
    const remainingMsgs = allMsgs.filter((m) => m.caregiverId !== id);
    writeMessagesToFile(remainingMsgs);

    res.json({
      success: true,
      message: `Caregiver ${target.name} removed successfully.`,
      deletedId: id,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to delete caregiver' });
  }
});

// ==========================================
// TWO-WAY MESSAGING ENDPOINTS (Part B & C)
// ==========================================

// GET /api/messages - Fetch messages for conversation or participants
app.get('/api/messages', (req: Request, res: Response) => {
  try {
    const { caregiverId, patientId, since } = req.query as {
      caregiverId?: string;
      patientId?: string;
      since?: string;
    };

    let messages = readMessagesFromFile();

    if (caregiverId) {
      messages = messages.filter((m) => m.caregiverId === caregiverId);
    }
    if (patientId) {
      messages = messages.filter((m) => m.patientId === patientId);
    }
    if (since) {
      const sinceDate = new Date(since).getTime();
      messages = messages.filter((m) => new Date(m.timestamp).getTime() > sinceDate);
    }

    res.json({
      success: true,
      data: messages,
      count: messages.length,
      serverTime: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch messages' });
  }
});

// POST /api/messages - Submit a new message (from patient OR caregiver)
app.post('/api/messages', (req: Request, res: Response) => {
  try {
    const {
      caregiverId,
      patientId = 'pat-1',
      senderId,
      senderName = 'User',
      senderRole = 'patient',
      recipientId,
      text,
    } = req.body as {
      caregiverId?: string;
      patientId?: string;
      senderId?: string;
      senderName?: string;
      senderRole?: 'patient' | 'caregiver' | 'system';
      recipientId?: string;
      text?: string;
    };

    if (!text || !text.trim()) {
      res.status(400).json({ success: false, error: 'Message body text is required.' });
      return;
    }

    if (!caregiverId) {
      res.status(400).json({ success: false, error: 'caregiverId is required for this conversation.' });
      return;
    }

    const newMessage: CaregiverMessageRecord = {
      id: `cmsg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      caregiverId,
      patientId,
      senderId: senderId || (senderRole === 'patient' ? patientId : caregiverId),
      senderName: senderName.trim(),
      senderRole: senderRole === 'caregiver' ? 'caregiver' : 'patient',
      recipientId: recipientId || (senderRole === 'patient' ? caregiverId : patientId),
      text: text.trim(),
      timestamp: new Date().toISOString(),
      deliveryStatus: 'delivered',
    };

    const all = readMessagesFromFile();
    all.push(newMessage);
    writeMessagesToFile(all);

    res.status(201).json({
      success: true,
      message: 'Message delivered successfully.',
      data: newMessage,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to send message' });
  }
});

// DELETE /api/messages/:id - Delete single message
app.delete('/api/messages/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const all = readMessagesFromFile();
    const remaining = all.filter((m) => m.id !== id);
    writeMessagesToFile(remaining);
    res.json({ success: true, message: 'Message deleted', id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to delete message' });
  }
});

// DELETE /api/conversations/:caregiverId - Clear entire conversation
app.delete('/api/conversations/:caregiverId', (req: Request, res: Response) => {
  try {
    const { caregiverId } = req.params;
    const all = readMessagesFromFile();
    const remaining = all.filter((m) => m.caregiverId !== caregiverId);
    writeMessagesToFile(remaining);
    res.json({ success: true, message: 'Conversation cleared', caregiverId });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to clear conversation' });
  }
});

// POST /api/caregivers/:id/reply - Clinician/Caregiver direct reply endpoint (Part B & C)
app.post('/api/caregivers/:id/reply', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { text, patientId = 'pat-1' } = req.body as { text?: string; patientId?: string };

    if (!text || !text.trim()) {
      res.status(400).json({ success: false, error: 'Reply text cannot be empty.' });
      return;
    }

    const allCaregivers = readCaregiversFromFile();
    const cg = allCaregivers.find((c) => c.id === id);
    if (!cg) {
      res.status(404).json({ success: false, error: 'Target caregiver not found.' });
      return;
    }

    const newReply: CaregiverMessageRecord = {
      id: `cmsg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      caregiverId: id,
      patientId,
      senderId: id,
      senderName: cg.name,
      senderRole: 'caregiver',
      recipientId: patientId,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      deliveryStatus: 'delivered',
    };

    const allMsgs = readMessagesFromFile();
    allMsgs.push(newReply);
    writeMessagesToFile(allMsgs);

    res.status(201).json({
      success: true,
      message: `Reply from ${cg.name} delivered successfully.`,
      data: newReply,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to post caregiver reply' });
  }
});

// PUT /api/conversations/:caregiverId/read - Mark incoming messages in this thread as read
app.put('/api/conversations/:caregiverId/read', (req: Request, res: Response) => {
  try {
    const { caregiverId } = req.params;
    const { readerRole } = req.body as { readerRole?: 'patient' | 'caregiver' };
    const all = readMessagesFromFile();
    let updatedCount = 0;

    all.forEach((m) => {
      if (m.caregiverId === caregiverId) {
        if (readerRole === 'caregiver' && m.senderRole === 'patient' && m.deliveryStatus !== 'read') {
          m.deliveryStatus = 'read';
          updatedCount++;
        } else if (readerRole !== 'caregiver' && m.senderRole === 'caregiver' && m.deliveryStatus !== 'read') {
          m.deliveryStatus = 'read';
          updatedCount++;
        }
      }
    });

    if (updatedCount > 0) {
      writeMessagesToFile(all);
    }
    res.json({ success: true, updatedCount });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// ==========================================
// MEDICATION & INVENTORY CRUD ENDPOINTS
// ==========================================

// GET /api/medications - Retrieve all persistent medication records
app.get('/api/medications', (_req: Request, res: Response) => {
  try {
    const all = readMedicationsFromFile();
    res.json({
      success: true,
      data: all,
      count: all.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch medications' });
  }
});

// PUT /api/medications/:id - Update medication record
app.put('/api/medications/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body as Partial<MedicationRecord>;
    const all = readMedicationsFromFile();
    const idx = all.findIndex((m) => m.id === id);

    if (idx === -1) {
      res.status(404).json({ success: false, error: 'Medication record not found in database.' });
      return;
    }

    all[idx] = {
      ...all[idx],
      ...updates,
      id, // Preserve ID
    };

    writeMedicationsToFile(all);
    res.json({
      success: true,
      data: all[idx],
      message: 'Medication updated successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to update medication.' });
  }
});

// POST /api/medications/:id/confirm-dose - Explicit dose ingestion verification & single stock deduction
app.post('/api/medications/:id/confirm-dose', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const all = readMedicationsFromFile();
    const med = all.find((m) => m.id === id);

    if (!med) {
      res.status(404).json({ success: false, error: 'Medication not found in database.' });
      return;
    }

    // Safety guard: prevent duplicate deduction
    if (med.status === 'taken') {
      res.status(400).json({
        success: false,
        error: `${med.name} was already marked as taken today. Duplicate stock deduction prevented.`,
      });
      return;
    }

    const unitsDeducted = Number(med.unitsPerDose) || 1;
    const previousStock = Number(med.inventory) || 0;
    const newStock = Math.max(0, previousStock - unitsDeducted);

    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' Today';
    med.status = 'taken';
    med.inventory = newStock;
    med.lastTaken = timeStr;
    med.verified = true;

    writeMedicationsToFile(all);

    res.json({
      success: true,
      data: med,
      deducted: unitsDeducted,
      previousStock,
      remainingStock: newStock,
      message: `Explicit dose ingestion verified for ${med.name}. Stock updated to ${newStock} pills.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to confirm dose ingestion.' });
  }
});

// ==========================================
// VOICE ASSISTANT GEMINI ENDPOINT
// ==========================================

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: { 'User-Agent': 'aistudio-build' },
    },
  });
};

interface MessagePart {
  text: string;
}

interface HistoryMessage {
  role: 'user' | 'model';
  parts: MessagePart[];
}

interface PatientContextPayload {
  name?: string;
  age?: number;
  condition?: string;
  medications?: Array<{
    name: string;
    dosage?: string;
    scheduledTime?: string;
    status?: string;
    inventory?: number;
    reorderThreshold?: number;
    instructions?: string;
  }>;
  vitals?: {
    heartRate?: number;
    bloodPressure?: string;
    bloodGlucose?: number;
    adherencePercentage?: number;
    waterIntake?: number;
  };
  caregivers?: Array<{
    name: string;
    role: string;
    phone: string;
    email?: string;
  }>;
}

// POST /api/voice-assistant
app.post('/api/voice-assistant', async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory = [], patientContext = {} } = req.body as {
      message?: string;
      conversationHistory?: HistoryMessage[];
      patientContext?: PatientContextPayload;
    };

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'Message content is required.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Gemini API key is not configured on the server. Please ensure GEMINI_API_KEY is provided.',
        code: 'MISSING_API_KEY',
      });
      return;
    }

    // Build clinical context for patient
    const medsSummary = (patientContext.medications || [])
      .map(
        (m) =>
          `- ${m.name} (${m.dosage || 'standard dose'}): scheduled at ${m.scheduledTime || 'unspecified'}, status: ${
            m.status || 'pending'
          }, remaining stock: ${m.inventory ?? 'N/A'} (alert threshold: ${m.reorderThreshold ?? 10}). Instructions: ${
            m.instructions || 'take with water'
          }`
      )
      .join('\n');

    const caregiversSummary = (patientContext.caregivers || [])
      .map((c) => `- ${c.name} (${c.role}): Phone ${c.phone}${c.email ? `, Email ${c.email}` : ''}`)
      .join('\n');

    const vitalsSummary = patientContext.vitals
      ? `Adherence Rate: ${patientContext.vitals.adherencePercentage ?? 92}%, Heart Rate: ${
          patientContext.vitals.heartRate ?? 72
        } bpm, Blood Pressure: ${patientContext.vitals.bloodPressure ?? '120/80'}, Blood Glucose: ${
          patientContext.vitals.bloodGlucose ?? 95
        } mg/dL, Water Intake: ${patientContext.vitals.waterIntake ?? 1.5} L.`
      : 'Vitals normal, adherence around 92%.';

    const systemInstruction = `You are IntelliMed AI's Clinical Voice Assistant, speaking directly with patient ${
      patientContext.name || 'User'
    }.
Your answers are read aloud via text-to-speech, so follow these speech guidelines:
1. Speak in a warm, concise, conversational, and articulate manner (typically 2 to 4 sentences).
2. Avoid markdown tables, long bulleted lists, code blocks, or special formatting symbols that sound awkward when synthesized aloud.
3. Ground your responses strictly in the patient's actual real-time records:
PATIENT SCHEDULE & MEDICATIONS:
${medsSummary || 'No active medications registered.'}

CURRENT VITALS & CLINICAL ADHERENCE:
${vitalsSummary}

ASSIGNED CAREGIVERS & CLINICAL TEAM:
${caregiversSummary || 'No caregivers assigned.'}

SAFETY & ETHICAL RULES:
- Never diagnose medical illnesses or diseases.
- Never prescribe medication or recommend stopping or changing dosages of prescribed medicines.
- For medical concerns, symptoms of distress, or advice to change a prescription, warmly advise contacting their assigned doctor or caregiver.
- Answer accurately regarding: which medications they need to take today, what time doses are scheduled, whether they have taken a dose, inventory count and refills, vitals tracking, and how to use the YOLO camera scanner or gesture monitor.`;

    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    const recentHistory = conversationHistory.slice(-6);
    for (const h of recentHistory) {
      if (h.role === 'user' || h.role === 'model') {
        const text = h.parts?.[0]?.text;
        if (text) {
          contents.push({
            role: h.role,
            parts: [{ text }],
          });
        }
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: message.trim() }],
    });

    let lastErr: any = null;
    let replyText = '';
    let usedModel = 'gemini-3.5-flash-lite';
    const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];

    for (const modelCandidate of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelCandidate,
          contents,
          config: {
            systemInstruction,
            temperature: 0.6,
          },
        });
        replyText = response.text || "I'm sorry, I couldn't process your request at this moment.";
        usedModel = modelCandidate;
        lastErr = null;
        break;
      } catch (err: any) {
        lastErr = err;
        console.warn(`Model ${modelCandidate} failed: ${err?.message || err}. Trying next fallback...`);
      }
    }

    if (lastErr && !replyText) {
      throw lastErr;
    }

    res.json({
      reply: replyText,
      status: 'success',
      model: usedModel,
    });
  } catch (error: any) {
    console.error('Gemini Voice Assistant Error:', error);
    let parsedMessage = error?.message || 'An error occurred while generating a response from Gemini AI.';
    try {
      if (typeof parsedMessage === 'string' && parsedMessage.startsWith('{')) {
        const parsed = JSON.parse(parsedMessage);
        if (parsed?.error?.message) {
          parsedMessage = parsed.error.message;
        }
      }
    } catch {
      // keep parsedMessage as is
    }
    res.status(500).json({
      error: parsedMessage,
      code: 'GEMINI_GENERATION_ERROR',
    });
  }
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Dev vs Prod Vite handling
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IntelliMed AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
