import { Caregiver, CaregiverMessage } from '../types';

const BASE_URL = '';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('intellimed_auth_user_id') || 'default-user';
  return {
    'Content-Type': 'application/json',
    'x-user-id': token,
  };
}

export const caregiverApiService = {
  // 1. Fetch caregivers
  async fetchCaregivers(): Promise<Caregiver[]> {
    try {
      const res = await fetch(`${BASE_URL}/api/caregivers`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP error ${res.status}`);
      }
      const data = await res.json();
      return data.data as Caregiver[];
    } catch (e) {
      console.warn('Network fetchCaregivers failed, fallback to local:', e);
      throw e;
    }
  },

  // 2. Add caregiver
  async addCaregiver(cgData: Omit<Caregiver, 'id'>): Promise<Caregiver> {
    const res = await fetch(`${BASE_URL}/api/caregivers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(cgData),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || `Failed to create caregiver (HTTP ${res.status})`);
    }
    return result.data as Caregiver;
  },

  // 3. Update caregiver
  async updateCaregiver(id: string, updates: Partial<Caregiver>): Promise<Caregiver> {
    const res = await fetch(`${BASE_URL}/api/caregivers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || `Failed to update caregiver (HTTP ${res.status})`);
    }
    return result.data as Caregiver;
  },

  // 4. Delete caregiver
  async deleteCaregiver(id: string): Promise<string> {
    const res = await fetch(`${BASE_URL}/api/caregivers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || `Failed to delete caregiver (HTTP ${res.status})`);
    }
    return result.deletedId || id;
  },

  // 5. Fetch messages
  async fetchMessages(params?: { caregiverId?: string; patientId?: string }): Promise<CaregiverMessage[]> {
    const query = new URLSearchParams();
    if (params?.caregiverId) query.set('caregiverId', params.caregiverId);
    if (params?.patientId) query.set('patientId', params.patientId);

    const res = await fetch(`${BASE_URL}/api/messages?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP error ${res.status}`);
    }
    const data = await res.json();
    return data.data as CaregiverMessage[];
  },

  // 6. Send message
  async sendMessage(payload: {
    caregiverId: string;
    patientId: string;
    senderId: string;
    senderName: string;
    senderRole: 'patient' | 'caregiver' | 'system';
    recipientId?: string;
    text: string;
  }): Promise<CaregiverMessage> {
    const res = await fetch(`${BASE_URL}/api/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || `Failed to transmit message (HTTP ${res.status})`);
    }
    return result.data as CaregiverMessage;
  },

  // 7. Delete message
  async deleteMessage(messageId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/messages/${encodeURIComponent(messageId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const result = await res.json().catch(() => ({}));
      throw new Error(result.error || 'Failed to delete message');
    }
  },

  // 8. Clear conversation
  async clearConversation(caregiverId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/conversations/${encodeURIComponent(caregiverId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const result = await res.json().catch(() => ({}));
      throw new Error(result.error || 'Failed to clear conversation');
    }
  },

  // 9. Send direct caregiver reply
  async sendCaregiverReply(caregiverId: string, text: string, patientId = 'pat-1'): Promise<CaregiverMessage> {
    const res = await fetch(`${BASE_URL}/api/caregivers/${encodeURIComponent(caregiverId)}/reply`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text, patientId }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || `Failed to submit reply (HTTP ${res.status})`);
    }
    return result.data as CaregiverMessage;
  },

  // 10. Mark conversation messages as read
  async markConversationRead(caregiverId: string, readerRole: 'patient' | 'caregiver' = 'patient'): Promise<void> {
    try {
      await fetch(`${BASE_URL}/api/conversations/${encodeURIComponent(caregiverId)}/read`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ readerRole }),
      });
    } catch (e) {
      // Non-blocking background sync
      console.warn('markConversationRead failed:', e);
    }
  },
};
