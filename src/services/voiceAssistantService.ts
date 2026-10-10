export interface VoiceAssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  status?: 'sent' | 'processing' | 'delivered' | 'error';
  errorMessage?: string;
}

export interface VoiceSettings {
  language: string;
  persona: 'Female' | 'Male';
  speed: 'Slow' | 'Normal' | 'Fast';
  autoSpeak: boolean;
}

export const LANGUAGE_CODE_MAP: Record<string, string> = {
  English: 'en-US',
  Hindi: 'hi-IN',
  Tamil: 'ta-IN',
  Telugu: 'te-IN',
  Kannada: 'kn-IN',
  Malayalam: 'ml-IN',
};

export const SPEED_RATE_MAP: Record<string, number> = {
  Slow: 0.85,
  Normal: 1.0,
  Fast: 1.25,
};

/**
 * Find matching browser voice based on language code and persona preference
 */
export function getBestVoice(langCode: string, persona: 'Female' | 'Male'): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // Filter voices that match the language prefix (e.g., 'en' or 'hi')
  const langPrefix = langCode.split('-')[0].toLowerCase();
  const matchingLangVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix));

  const candidatePool = matchingLangVoices.length > 0 ? matchingLangVoices : voices;

  // Try to match persona/gender hints in voice name
  const isFemale = persona === 'Female';
  const femaleKeywords = ['female', 'zira', 'samantha', 'victoria', 'karen', 'veena', 'priya', 'kalpana', 'geeta', 'shruti', 'swara', 'google हिन्दी'];
  const maleKeywords = ['male', 'david', 'alex', 'george', 'daniel', 'rishi', 'ravi', 'neel', 'madhav'];

  const targetKeywords = isFemale ? femaleKeywords : maleKeywords;

  const foundPersona = candidatePool.find((v) =>
    targetKeywords.some((kw) => v.name.toLowerCase().includes(kw))
  );

  if (foundPersona) return foundPersona;

  // Fallback to first matching language voice or default
  return candidatePool[0] || null;
}

/**
 * Synthesizes text to speech with configured language, persona, and velocity
 */
export function speakText(
  text: string,
  settings: VoiceSettings,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onError?.(new Error('Speech synthesis not supported in this browser.'));
    return null;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(text);
    const langCode = LANGUAGE_CODE_MAP[settings.language] || 'en-US';
    utterance.lang = langCode;
    utterance.rate = SPEED_RATE_MAP[settings.speed] || 1.0;

    const matchedVoice = getBestVoice(langCode, settings.persona);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      onEnd?.();
    };

    utterance.onerror = (e) => {
      // Ignore synthesis cancel events
      if (e.error === 'canceled' || e.error === 'interrupted') {
        onEnd?.();
        return;
      }
      console.warn('Speech synthesis error:', e);
      onError?.(e);
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
    return utterance;
  } catch (err) {
    console.error('Error invoking speechSynthesis.speak:', err);
    onError?.(err);
    onEnd?.();
    return null;
  }
}

/**
 * Cancel any ongoing speech synthesis
 */
export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Call the backend Gemini voice assistant endpoint
 */
export async function queryVoiceAssistant(
  message: string,
  history: VoiceAssistantMessage[],
  patientContext: any
): Promise<string> {
  // Format conversation history for Gemini API
  const formattedHistory = history
    .filter((m) => m.status !== 'error')
    .slice(-6)
    .map((m) => ({
      role: m.sender === 'user' ? ('user' as const) : ('model' as const),
      parts: [{ text: m.text }],
    }));

  const response = await fetch('/api/voice-assistant', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      conversationHistory: formattedHistory,
      patientContext,
    }),
  });

  if (!response.ok) {
    let errorMessage = `Server error (${response.status})`;
    try {
      const errData = await response.json();
      if (errData?.error) {
        errorMessage = errData.error;
      }
    } catch {
      // Use fallback error message
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  if (!data?.reply) {
    throw new Error('No reply received from AI service.');
  }

  return data.reply;
}
