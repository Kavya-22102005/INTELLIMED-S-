import { Medication } from '../types';

const BASE_URL = '';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('intellimed_auth_user_id') || 'pat-1';
  return {
    'Content-Type': 'application/json',
    'x-user-id': token,
  };
}

export interface ConfirmDoseResult {
  success: boolean;
  data: Medication;
  deducted?: number;
  previousStock?: number;
  remainingStock?: number;
  message?: string;
  error?: string;
}

export const medicationApiService = {
  // 1. Fetch persistent medications from database
  async fetchMedications(): Promise<Medication[]> {
    const res = await fetch(`${BASE_URL}/api/medications`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP error ${res.status}`);
    }
    const result = await res.json();
    return result.data as Medication[];
  },

  // 2. Explicit dose verification & single stock deduction
  async confirmDose(id: string): Promise<ConfirmDoseResult> {
    const res = await fetch(`${BASE_URL}/api/medications/${encodeURIComponent(id)}/confirm-dose`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || `Failed to confirm dose ingestion (HTTP ${res.status})`);
    }
    return result as ConfirmDoseResult;
  },

  // 3. Update medication
  async updateMedication(id: string, updates: Partial<Medication>): Promise<Medication> {
    const res = await fetch(`${BASE_URL}/api/medications/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || `Failed to update medication (HTTP ${res.status})`);
    }
    return result.data as Medication;
  },
};
