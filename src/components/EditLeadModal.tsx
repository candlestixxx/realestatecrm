'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { updateLeadContactDetailsAction } from '@/lib/actions/lead';

type ContactField = {
  value: string;
  label: 'Mobile/Cell' | 'Home' | 'Work' | 'Personal' | 'Other';
};

type FamilyMember = {
  name: string;
  relationship: string;
  age?: string;
};

type EditLeadModalProps = {
  leadId: string;
  contact: {
    firstName: string;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    additionalPhones: string | null;
    additionalEmails: string | null;
    spouseName: string | null;
    spousePhone: string | null;
    spouseEmail: string | null;
    familyMembers: string | null;
  };
  onClose: () => void;
};

export default function EditLeadModal({ leadId, contact, onClose }: EditLeadModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [firstName, setFirstName] = useState(contact.firstName);
  const [lastName, setLastName] = useState(contact.lastName || '');
  const [email, setEmail] = useState(contact.email || '');
  const [phone, setPhone] = useState(contact.phone || '');
  const [address, setAddress] = useState(contact.address || '');

  // Spouses details
  const [spouseName, setSpouseName] = useState(contact.spouseName || '');
  const [spousePhone, setSpousePhone] = useState(contact.spousePhone || '');
  const [spouseEmail, setSpouseEmail] = useState(contact.spouseEmail || '');

  // Additional Phones (Primary + up to 9 additional = 10 total)
  const [additionalPhones, setAdditionalPhones] = useState<ContactField[]>(() => {
    try {
      const parsed = contact.additionalPhones ? JSON.parse(contact.additionalPhones) : [];
      return parsed.map((p: any) => {
        if (typeof p === 'string') return { value: p, label: 'Mobile/Cell' };
        return p;
      });
    } catch {
      return [];
    }
  });

  // Additional Emails (Primary + up to 9 additional = 10 total)
  const [additionalEmails, setAdditionalEmails] = useState<ContactField[]>(() => {
    try {
      const parsed = contact.additionalEmails ? JSON.parse(contact.additionalEmails) : [];
      return parsed.map((e: any) => {
        if (typeof e === 'string') return { value: e, label: 'Personal' };
        return e;
      });
    } catch {
      return [];
    }
  });

  // Family members list
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(() => {
    try {
      return contact.familyMembers ? JSON.parse(contact.familyMembers) : [];
    } catch {
      return [];
    }
  });

  const handleAddPhone = () => {
    if (additionalPhones.length >= 9) {
      toast.error('Maximum of 10 phone numbers allowed (including primary).');
      return;
    }
    setAdditionalPhones([...additionalPhones, { value: '', label: 'Mobile/Cell' }]);
  };

  const handlePhoneValueChange = (index: number, val: string) => {
    const updated = [...additionalPhones];
    updated[index].value = val;
    setAdditionalPhones(updated);
  };

  const handlePhoneLabelChange = (index: number, label: ContactField['label']) => {
    const updated = [...additionalPhones];
    updated[index].label = label;
    setAdditionalPhones(updated);
  };

  const handleRemovePhone = (index: number) => {
    setAdditionalPhones(additionalPhones.filter((_, i) => i !== index));
  };

  const handleAddEmail = () => {
    if (additionalEmails.length >= 9) {
      toast.error('Maximum of 10 email addresses allowed (including primary).');
      return;
    }
    setAdditionalEmails([...additionalEmails, { value: '', label: 'Personal' }]);
  };

  const handleEmailValueChange = (index: number, val: string) => {
    const updated = [...additionalEmails];
    updated[index].value = val;
    setAdditionalEmails(updated);
  };

  const handleEmailLabelChange = (index: number, label: ContactField['label']) => {
    const updated = [...additionalEmails];
    updated[index].label = label;
    setAdditionalEmails(updated);
  };

  const handleRemoveEmail = (index: number) => {
    setAdditionalEmails(additionalEmails.filter((_, i) => i !== index));
  };

  const handleAddFamilyMember = () => {
    setFamilyMembers([...familyMembers, { name: '', relationship: 'Son', age: '' }]);
  };

  const handleFamilyChange = (index: number, field: keyof FamilyMember, val: string) => {
    const updated = [...familyMembers];
    updated[index] = { ...updated[index], [field]: val };
    setFamilyMembers(updated);
  };

  const handleRemoveFamilyMember = (index: number) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await updateLeadContactDetailsAction(leadId, {
        firstName,
        lastName,
        email,
        phone,
        address,
        spouseName,
        spousePhone,
        spouseEmail,
        additionalPhones: additionalPhones.filter(p => p.value).map(p => ({ value: p.value, label: p.label })) as any,
        additionalEmails: additionalEmails.filter(e => e.value).map(e => ({ value: e.value, label: e.label })) as any,
        familyMembers: familyMembers.filter((f) => f.name),
      });

      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success('Lead details updated successfully!');
        onClose();
        router.refresh();
      }
    } catch {
      toast.error('Failed to save contact changes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-background rounded-2xl border border-border shadow-2xl p-6 w-full max-w-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-border mb-6 flex-shrink-0">
          <div>
            <span className="text-[10px] bg-secondary/15 text-secondary border border-secondary/30 rounded-full px-2.5 py-0.5 font-bold uppercase tracking-wider">
              Lead Profile Editor
            </span>
            <h3 className="text-xl font-bold mt-1">Edit Contact Information</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 space-y-6">
          {/* Core Fields */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-foreground/80 border-b border-border/40 pb-1 uppercase tracking-wider">
              Primary Info
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">First Name *</label>
                <input
                  required
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground font-bold text-primary">Primary Phone (Mobile/Cell)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground font-bold text-primary">Primary Email (Work)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Multiple Phone Numbers (Up to 10) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-1">
              <h4 className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                Additional Phone Numbers ({additionalPhones.length + 1}/10)
              </h4>
              <button
                type="button"
                onClick={handleAddPhone}
                className="text-xs text-primary font-bold hover:underline"
              >
                + Add Phone
              </button>
            </div>
            <div className="space-y-2">
              {additionalPhones.map((ph, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-muted/10 p-2 rounded-xl border border-border/30">
                  <select
                    value={ph.label}
                    onChange={(e) => handlePhoneLabelChange(idx, e.target.value as any)}
                    className="bg-background border border-border rounded px-2.5 py-1 text-xs font-semibold focus:outline-none"
                  >
                    <option value="Mobile/Cell">Cell / Mobile</option>
                    <option value="Home">Home Phone</option>
                    <option value="Work">Work Phone</option>
                    <option value="Other">Other</option>
                  </select>
                  <input
                    type="text"
                    value={ph.value}
                    placeholder={`Phone #${idx + 2}`}
                    onChange={(e) => handlePhoneValueChange(idx, e.target.value)}
                    className="flex-1 bg-background border border-border rounded px-3 py-1 text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhone(idx)}
                    className="text-xs text-red-500 hover:text-red-600 font-bold px-2"
                  >
                    Delete
                  </button>
                </div>
              ))}
              {additionalPhones.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No additional phone numbers.</p>
              )}
            </div>
          </div>

          {/* Multiple Email Addresses (Up to 10) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-1">
              <h4 className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                Additional Emails ({additionalEmails.length + 1}/10)
              </h4>
              <button
                type="button"
                onClick={handleAddEmail}
                className="text-xs text-primary font-bold hover:underline"
              >
                + Add Email
              </button>
            </div>
            <div className="space-y-2">
              {additionalEmails.map((em, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-muted/10 p-2 rounded-xl border border-border/30">
                  <select
                    value={em.label}
                    onChange={(e) => handleEmailLabelChange(idx, e.target.value as any)}
                    className="bg-background border border-border rounded px-2.5 py-1 text-xs font-semibold focus:outline-none"
                  >
                    <option value="Personal">Personal Email</option>
                    <option value="Work">Work Email</option>
                    <option value="Other">Other</option>
                  </select>
                  <input
                    type="email"
                    value={em.value}
                    placeholder={`Email #${idx + 2}`}
                    onChange={(e) => handleEmailValueChange(idx, e.target.value)}
                    className="flex-1 bg-background border border-border rounded px-3 py-1 text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(idx)}
                    className="text-xs text-red-500 hover:text-red-600 font-bold px-2"
                  >
                    Delete
                  </button>
                </div>
              ))}
              {additionalEmails.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No additional emails.</p>
              )}
            </div>
          </div>

          {/* Spouse Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-foreground/80 border-b border-border/40 pb-1 uppercase tracking-wider">
              Spouse / Co-Borrower
            </h4>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Spouse Full Name</label>
                <input
                  type="text"
                  value={spouseName}
                  onChange={(e) => setSpouseName(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Spouse Phone</label>
                  <input
                    type="text"
                    value={spousePhone}
                    onChange={(e) => setSpousePhone(e.target.value)}
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Spouse Email</label>
                  <input
                    type="email"
                    value={spouseEmail}
                    onChange={(e) => setSpouseEmail(e.target.value)}
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Other Family Members */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-1">
              <h4 className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                Other Family Members
              </h4>
              <button
                type="button"
                onClick={handleAddFamilyMember}
                className="text-xs text-primary font-bold hover:underline"
              >
                + Add Member
              </button>
            </div>
            <div className="space-y-3">
              {familyMembers.map((fm, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-muted/10 p-2.5 border border-border/50 rounded-xl">
                  <div className="col-span-5 space-y-1">
                    <input
                      required
                      type="text"
                      placeholder="Name"
                      value={fm.name}
                      onChange={(e) => handleFamilyChange(idx, 'name', e.target.value)}
                      className="w-full bg-background border border-border rounded px-2.5 py-1 text-xs"
                    />
                  </div>
                  <div className="col-span-4 space-y-1">
                    <select
                      value={fm.relationship}
                      onChange={(e) => handleFamilyChange(idx, 'relationship', e.target.value)}
                      className="w-full bg-background border border-border rounded px-2.5 py-1 text-xs"
                    >
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <input
                      type="text"
                      placeholder="Age"
                      value={fm.age || ''}
                      onChange={(e) => handleFamilyChange(idx, 'age', e.target.value)}
                      className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-center"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveFamilyMember(idx)}
                      className="text-red-500 hover:text-red-600 font-bold text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              {familyMembers.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No other family members added.</p>
              )}
            </div>
          </div>
        </form>

        <div className="border-t border-border pt-4 mt-6 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border hover:bg-muted text-xs font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="px-6 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
