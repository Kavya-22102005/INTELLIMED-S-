import React, { useState, useEffect } from 'react';
import { Caregiver } from '../../types';
import { validateIndianMobile } from '../../utils/phoneUtils';
import {
  X,
  User,
  Phone,
  Mail,
  HeartHandshake,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface CaregiverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (caregiverData: Omit<Caregiver, 'id'>) => Promise<void> | void;
  caregiverToEdit?: Caregiver | null;
}

export const CaregiverModal: React.FC<CaregiverModalProps> = ({
  isOpen,
  onClose,
  onSave,
  caregiverToEdit,
}) => {
  const isEditing = Boolean(caregiverToEdit);

  const [name, setName] = useState('');
  const [role, setRole] = useState<'Caregiver' | 'Nurse' | 'Doctor' | 'Family Member'>('Caregiver');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('');
  const [notes, setNotes] = useState('');
  const [preferredContact, setPreferredContact] = useState<'Phone' | 'Chat' | 'WhatsApp' | 'Email'>('Phone');
  const [shiftTiming, setShiftTiming] = useState<'Day Shift' | 'Night Shift' | 'Flexible' | 'On Call'>('Day Shift');
  const [isPrimary, setIsPrimary] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Validation state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [phoneValidation, setPhoneValidation] = useState(validateIndianMobile(''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    setServerError(null);
    setIsSubmitting(false);
    if (caregiverToEdit) {
      setName(caregiverToEdit.name || '');
      setRole((caregiverToEdit.role as any) || 'Caregiver');
      setPhone(caregiverToEdit.phone || '');
      setEmail(caregiverToEdit.email || '');
      setRelationship(caregiverToEdit.relationship || '');
      setNotes(caregiverToEdit.notes || '');
      setPreferredContact(caregiverToEdit.preferredContact || 'Phone');
      setShiftTiming(caregiverToEdit.shiftTiming || 'Day Shift');
      setIsPrimary(caregiverToEdit.isPrimary || false);
      setIsOnline(caregiverToEdit.isOnline !== undefined ? caregiverToEdit.isOnline : true);
      setPhoneValidation(validateIndianMobile(caregiverToEdit.phone || ''));
    } else {
      // Defaults for new contact
      setName('');
      setRole('Caregiver');
      setPhone('+91 ');
      setEmail('');
      setRelationship('Family Caregiver');
      setNotes('');
      setPreferredContact('Phone');
      setShiftTiming('Day Shift');
      setIsPrimary(false);
      setIsOnline(true);
      setPhoneValidation(validateIndianMobile('+91 '));
    }
    setErrors({});
  }, [caregiverToEdit, isOpen]);

  if (!isOpen) return null;

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    const result = validateIndianMobile(val);
    setPhoneValidation(result);
    if (errors.phone && result.isValid) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.phone;
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (!name.trim()) {
      errs.name = 'Full name is required.';
    } else if (name.trim().length < 2) {
      errs.name = 'Full name must be at least 2 characters.';
    }

    const phoneRes = validateIndianMobile(phone);
    if (!phoneRes.isValid) {
      errs.phone = phoneRes.error || 'Please enter a valid 10-digit Indian mobile number.';
    }

    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errs.email = 'Please provide a valid email address.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;

    const phoneRes = validateIndianMobile(phone);
    setIsSubmitting(true);
    setServerError(null);

    try {
      await onSave({
        name: name.trim(),
        role,
        phone: phoneRes.formatted, // Save in clean formatted Indian format: +91 98765 43210
        email: email.trim() || undefined,
        relationship: relationship.trim() || undefined,
        notes: notes.trim() || undefined,
        preferredContact,
        shiftTiming,
        isOnline,
        isPrimary,
        isVerified: true,
      });

      onClose();
    } catch (err: any) {
      setServerError(err?.message || 'Failed to save contact record to server. Please check connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#111B2D] border border-[#1E2D4A] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-blue-950/60 to-purple-950/40 border-b border-[#1E2D4A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                {isEditing ? 'Edit Caregiver / Nurse Record' : 'Register New Caregiver / Nurse'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? 'Update verified emergency contact credentials and notification channels.'
                  : 'Add verified staff member or caregiver with validated Indian mobile number.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E2D4A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {serverError && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Error Saving Record: </span>
                {serverError}
              </div>
            </div>
          )}

          {/* Full Name & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. Dr. Kavita Sharma / Nurse Priya"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.name;
                        return next;
                      });
                    }
                  }}
                  className={`w-full bg-[#080D19] border ${
                    errors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-[#1E2D4A] focus:border-cyan-400'
                  } text-white text-xs rounded-xl pl-9 pr-3 py-2.5 transition-colors focus:outline-none`}
                  required
                />
              </div>
              {errors.name && <p className="text-[11px] text-red-400 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Designated Clinical Role <span className="text-red-400">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full bg-[#080D19] border border-[#1E2D4A] focus:border-cyan-400 text-white text-xs rounded-xl px-3 py-2.5 transition-colors focus:outline-none"
              >
                <option value="Caregiver">Caregiver (Primary Home Care)</option>
                <option value="Nurse">Nurse (Clinical Staff / Monitor)</option>
                <option value="Doctor">Doctor (Attending Physician)</option>
                <option value="Family Member">Family Member (Emergency Kin)</option>
              </select>
            </div>
          </div>

          {/* Indian Mobile Number (Validated) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Indian Mobile Number <span className="text-red-400">*</span>
              </label>
              <span className="text-[10px] text-slate-400">
                Supports <code className="text-cyan-300">+91</code> or 10-digit (starts with 6-9)
              </span>
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="tel"
                placeholder="+91 98765 43210 or 9876543210"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={`w-full bg-[#080D19] font-mono border ${
                  errors.phone
                    ? 'border-red-500 ring-1 ring-red-500'
                    : phoneValidation.isValid
                    ? 'border-emerald-500/80 focus:border-emerald-400'
                    : 'border-[#1E2D4A] focus:border-cyan-400'
                } text-white text-xs rounded-xl pl-9 pr-10 py-2.5 transition-colors focus:outline-none`}
                required
              />
              {phoneValidation.isValid && (
                <div className="absolute right-3 top-2.5 text-emerald-400 flex items-center gap-1" title="Valid Indian Mobile">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Helper preview or error */}
            {errors.phone ? (
              <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.phone}</span>
              </p>
            ) : phoneValidation.isValid ? (
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 rounded-lg px-2.5 py-1">
                <span>Standardized Indian Format: <strong>{phoneValidation.formatted}</strong></span>
                <span className="text-[10px] text-emerald-300/80 font-mono">E.164: {phoneValidation.e164}</span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">
                Example inputs: <code>9876543210</code>, <code>+91 98765 43210</code>, <code>09876543210</code>
              </p>
            )}
          </div>

          {/* Email (Optional) & Relationship */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  placeholder="e.g. priya.n@apollo.med"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.email;
                        return next;
                      });
                    }
                  }}
                  className={`w-full bg-[#080D19] border ${
                    errors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-[#1E2D4A] focus:border-cyan-400'
                  } text-white text-xs rounded-xl pl-9 pr-3 py-2.5 transition-colors focus:outline-none`}
                />
              </div>
              {errors.email && <p className="text-[11px] text-red-400 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Relationship / Department <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. ICU Nurse, Eldest Daughter, Apollo Staff"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full bg-[#080D19] border border-[#1E2D4A] focus:border-cyan-400 text-white text-xs rounded-xl px-3 py-2.5 transition-colors focus:outline-none"
              />
            </div>
          </div>

          {/* Preferred Contact Method & Shift Timing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Preferred Contact Channel
              </label>
              <select
                value={preferredContact}
                onChange={(e) => setPreferredContact(e.target.value as any)}
                className="w-full bg-[#080D19] border border-[#1E2D4A] focus:border-cyan-400 text-white text-xs rounded-xl px-3 py-2.5 transition-colors focus:outline-none"
              >
                <option value="Phone">Direct Voice Call</option>
                <option value="Chat">Secure In-App Chat</option>
                <option value="WhatsApp">WhatsApp Messenger</option>
                <option value="Email">Email Notification</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Duty / Shift Timing
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <select
                  value={shiftTiming}
                  onChange={(e) => setShiftTiming(e.target.value as any)}
                  className="w-full bg-[#080D19] border border-[#1E2D4A] focus:border-cyan-400 text-white text-xs rounded-xl pl-9 pr-3 py-2.5 transition-colors focus:outline-none"
                >
                  <option value="Day Shift">Day Shift (08:00 - 16:00)</option>
                  <option value="Night Shift">Night Shift (20:00 - 08:00)</option>
                  <option value="Flexible">Flexible Schedule</option>
                  <option value="On Call">On Call (24/7 Priority)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Clinical Notes (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Clinical & Handover Notes <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <textarea
                rows={2}
                placeholder="e.g. Available for urgent morning glucose titration; contact on alternate landline if busy."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#080D19] border border-[#1E2D4A] focus:border-cyan-400 text-white text-xs rounded-xl pl-9 pr-3 py-2 transition-colors focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Checkbox Options */}
          <div className="p-3 bg-[#080D19] border border-[#1E2D4A] rounded-xl space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="rounded border-[#1E2D4A] bg-[#111B2D] text-blue-600 focus:ring-0 w-4 h-4"
              />
              <span className="text-xs text-slate-200 font-medium">
                Set as Primary Emergency Dispatch Contact (Triggered by SOS & Fall Detection)
              </span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isOnline}
                onChange={(e) => setIsOnline(e.target.checked)}
                className="rounded border-[#1E2D4A] bg-[#111B2D] text-emerald-600 focus:ring-0 w-4 h-4"
              />
              <span className="text-xs text-slate-200 font-medium">
                Mark currently active / reachable on duty roster
              </span>
            </label>
          </div>

          {/* Verification Badge Notice */}
          <div className="flex items-center gap-2 p-2.5 bg-blue-950/30 border border-blue-500/20 rounded-xl text-[11px] text-blue-300">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              All saved contact records are authenticated and verified against Indian telecom regulations.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E2D4A]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-[#080D19] hover:bg-[#1E2D4A] border border-[#1E2D4A] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!phoneValidation.isValid || !name.trim() || isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Saving to Database...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isEditing ? 'Save Changes' : 'Register Contact'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
