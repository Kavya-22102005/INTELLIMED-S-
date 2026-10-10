/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Browser-based local medication reminder service for IntelliMed AI.
 * Operates purely client-side while the browser/tab is active, providing:
 * - HTML5 Desktop Web Notifications (when permission is granted)
 * - Synthesized medical audio chimes (Web Audio API)
 * - Audible voice announcements (Web Speech API)
 * - In-app notification center dispatch
 * - Duplicate prevention and clean unmount lifecycle management
 */

import { Medication } from '../types';

export type ReminderPermissionStatus = NotificationPermission | 'unsupported';

export interface ReminderNotificationPayload {
  title: string;
  body: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  rule: string;
  timestamp: Date;
}

class LocalReminderService {
  private timerId: number | null = null;
  private triggeredReminders: Set<string> = new Set();
  private audioCtx: AudioContext | null = null;

  /**
   * Checks if HTML5 Web Notifications are supported in the current browser.
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Retrieves the current notification permission status.
   */
  public getPermissionStatus(): ReminderPermissionStatus {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  /**
   * Requests browser notification permission.
   */
  public async requestPermission(): Promise<ReminderPermissionStatus> {
    if (!this.isSupported()) return 'unsupported';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return Notification.permission || 'denied';
    }
  }

  /**
   * Plays a gentle, clinical two-tone medical alert chime using the Web Audio API.
   * Completely offline, self-contained, and requires zero external asset files.
   */
  public playChime(): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'suspended') {
        this.audioCtx = new AudioContextClass();
      }

      const now = this.audioCtx.currentTime;

      // Tone 1: 587.33 Hz (D5)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.18, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tone 2: 880 Hz (A5) - harmonics chime
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.14);
      gain2.gain.setValueAtTime(0, now + 0.14);
      gain2.gain.linearRampToValueAtTime(0.22, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.14);
      osc2.stop(now + 0.55);
    } catch (err) {
      console.warn('AudioContext chime error:', err);
    }
  }

  /**
   * Speaks the clinical reminder aloud if SpeechSynthesis is supported and enabled.
   */
  public speakReminder(medicineName: string, dosage: string, rule: string): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const text = `Medication Reminder. Time to take ${medicineName} ${dosage}, ${rule}.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
    }
  }

  /**
   * Triggers a browser native desktop notification.
   */
  public sendDesktopNotification(title: string, options?: NotificationOptions): Notification | null {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return null;
    }
    try {
      return new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: options?.tag || 'intellimed-med-reminder',
        silent: true, // We supply our own distinct medical chime via Web Audio
        ...options,
      });
    } catch (err) {
      console.warn('Desktop notification dispatch error:', err);
      return null;
    }
  }

  /**
   * Dispatches a full medication alert across available channels:
   * 1. Desktop HTML5 notification
   * 2. Web Audio medical chime
   * 3. Optional voice speech
   * 4. In-app callback
   */
  public dispatchReminder(
    med: Medication,
    options: {
      enableSound?: boolean;
      enableVoice?: boolean;
      onTrigger?: (payload: ReminderNotificationPayload) => void;
    }
  ): void {
    const title = `IntelliMed AI: Time for ${med.name} (${med.dosage})`;
    const body = `Scheduled at ${med.scheduledTime} • ${med.timingRule}. Remaining stock: ${med.inventory} pills left.`;

    // 1. Audio Chime
    if (options.enableSound !== false) {
      this.playChime();
    }

    // 2. Desktop Notification
    this.sendDesktopNotification(title, {
      body,
      tag: `med-${med.id}-${Date.now()}`,
    });

    // 3. Voice Announcement
    if (options.enableVoice) {
      this.speakReminder(med.name, med.dosage, med.timingRule);
    }

    // 4. In-app callback
    if (options.onTrigger) {
      options.onTrigger({
        title,
        body,
        medicineId: med.id,
        medicineName: med.name,
        dosage: med.dosage,
        rule: med.timingRule,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Formats a Date object into "hh:mm A" string (e.g., "01:00 PM") for schedule matching.
   */
  private formatCurrentTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  /**
   * Generates a date string "YYYY-MM-DD" to reset daily reminders.
   */
  private getTodayKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }

  /**
   * Evaluates registered medications against current clock time.
   * Prevents duplicate notifications for the same medicine on the same day/schedule.
   */
  public checkSchedules(
    medications: Medication[],
    options: {
      enabled: boolean;
      enableSound?: boolean;
      enableVoice?: boolean;
      onTrigger?: (payload: ReminderNotificationPayload) => void;
    }
  ): void {
    if (!options.enabled) return;

    const now = new Date();
    const currentTimeStr = this.formatCurrentTime(now); // e.g. "01:00 PM"
    const todayKey = this.getTodayKey(now);

    for (const med of medications) {
      // Only remind for non-taken doses
      if (med.status === 'taken') continue;

      const reminderKey = `${todayKey}_${med.id}_${med.scheduledTime}`;

      // Check if this dose was already triggered today
      if (this.triggeredReminders.has(reminderKey)) {
        continue;
      }

      // Check exact minute match or if status is 'snoozed'
      // Note: med.scheduledTime is in "hh:mm A" format (e.g. "08:00 AM", "01:00 PM", "09:00 PM")
      const isTimeMatch =
        med.scheduledTime.trim().toUpperCase() === currentTimeStr.trim().toUpperCase();

      if (isTimeMatch) {
        this.triggeredReminders.add(reminderKey);
        this.dispatchReminder(med, options);
      }
    }
  }

  /**
   * Starts the background interval scheduler.
   * Returns a cleanup function for React useEffect unmounts.
   */
  public startScheduler(
    getMedications: () => Medication[],
    getOptions: () => {
      enabled: boolean;
      enableSound?: boolean;
      enableVoice?: boolean;
      onTrigger?: (payload: ReminderNotificationPayload) => void;
    },
    intervalMs: number = 30000 // Checks every 30 seconds
  ): () => void {
    this.stopScheduler();

    // Run an initial check after 2 seconds
    const initialTimeout = window.setTimeout(() => {
      this.checkSchedules(getMedications(), getOptions());
    }, 2000);

    // Periodic check
    this.timerId = window.setInterval(() => {
      this.checkSchedules(getMedications(), getOptions());
    }, intervalMs);

    // Return cleanup function
    return () => {
      window.clearTimeout(initialTimeout);
      this.stopScheduler();
    };
  }

  /**
   * Stops the active background scheduler.
   */
  public stopScheduler(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Triggers an immediate test reminder for verification without waiting for clock schedule.
   */
  public testReminder(
    med: Medication,
    options: {
      enableSound?: boolean;
      enableVoice?: boolean;
      onTrigger?: (payload: ReminderNotificationPayload) => void;
    }
  ): void {
    this.dispatchReminder(med, options);
  }
}

// Export singleton instance
export const reminderService = new LocalReminderService();
