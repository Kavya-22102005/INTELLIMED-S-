export interface PhoneValidationResult {
  isValid: boolean;
  raw: string;
  cleaned: string;
  nationalNumber: string; // 10 digits
  e164: string; // +91XXXXXXXXXX
  formatted: string; // +91 98765 43210
  error?: string;
}

/**
 * Validates and formats Indian mobile numbers.
 * Supported formats:
 * - 10-digit mobile number: 9876543210 (starts with 6, 7, 8, or 9)
 * - With prefix 0: 09876543210
 * - With country code: +919876543210, +91 98765 43210, 919876543210
 */
export function validateIndianMobile(phone: string): PhoneValidationResult {
  if (!phone || typeof phone !== 'string') {
    return {
      isValid: false,
      raw: phone || '',
      cleaned: '',
      nationalNumber: '',
      e164: '',
      formatted: '',
      error: 'Phone number is required.',
    };
  }

  // Remove spaces, hyphens, brackets, dots
  let cleaned = phone.trim().replace(/[\s\-().]/g, '');

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

  // Indian mobile numbers must be exactly 10 digits and start with 6, 7, 8, or 9
  const digitRegex = /^\d+$/;
  if (!digitRegex.test(national)) {
    return {
      isValid: false,
      raw: phone,
      cleaned,
      nationalNumber: national,
      e164: '',
      formatted: phone,
      error: 'Phone number must contain only numeric digits.',
    };
  }

  if (national.length !== 10) {
    return {
      isValid: false,
      raw: phone,
      cleaned,
      nationalNumber: national,
      e164: '',
      formatted: phone,
      error: `Indian mobile number must be exactly 10 digits (got ${national.length}).`,
    };
  }

  const validStartDigit = /^[6-9]/.test(national);
  if (!validStartDigit) {
    return {
      isValid: false,
      raw: phone,
      cleaned,
      nationalNumber: national,
      e164: '',
      formatted: phone,
      error: 'Valid Indian mobile numbers must begin with 6, 7, 8, or 9.',
    };
  }

  const e164 = `+91${national}`;
  const formatted = `+91 ${national.slice(0, 5)} ${national.slice(5)}`;

  return {
    isValid: true,
    raw: phone,
    cleaned,
    nationalNumber: national,
    e164,
    formatted,
  };
}

/**
 * Checks whether user agent indicates a mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}
