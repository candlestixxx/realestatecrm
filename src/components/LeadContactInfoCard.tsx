'use client';

import { useState } from 'react';
import EditLeadModal from './EditLeadModal';
import { deleteLeadAction } from '@/lib/actions/lead';
import toast from 'react-hot-toast';

type ContactField = {
  value: string;
  label: 'Mobile/Cell' | 'Home' | 'Work' | 'Personal' | 'Other';
};

type ContactData = {
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

type LeadContactInfoCardProps = {
  leadId: string;
  contact: ContactData;
  source: string | null;
};

export default function LeadContactInfoCard({ leadId, contact, source }: LeadContactInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  const additionalPhones: ContactField[] = (() => {
    try {
      const parsed = contact.additionalPhones ? JSON.parse(contact.additionalPhones) : [];
      return parsed.map((p: any) => {
        if (typeof p === 'string') return { value: p, label: 'Mobile/Cell' };
        return p;
      });
    } catch {
      return [];
    }
  })();

  const additionalEmails: ContactField[] = (() => {
    try {
      const parsed = contact.additionalEmails ? JSON.parse(contact.additionalEmails) : [];
      return parsed.map((e: any) => {
        if (typeof e === 'string') return { value: e, label: 'Personal' };
        return e;
      });
    } catch {
      return [];
    }
  })();

  const familyMembers: { name: string; relationship: string; age?: string }[] = (() => {
    try {
      return contact.familyMembers ? JSON.parse(contact.familyMembers) : [];
    } catch {
      return [];
    }
  })();

  return (
    <div className="bg-background border border-border rounded-xl shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-border/50 pb-2">
        <h2 className="text-lg font-bold">Contact Info</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            ✏️ Edit
          </button>
          <span className="text-muted-foreground/30 text-xs select-none">|</span>
          <button
            onClick={async () => {
              if (confirm(`Are you sure you want to permanently delete lead "${contact.firstName} ${contact.lastName || ''}"? This will redirect to the dashboard.`)) {
                const res = await deleteLeadAction(leadId);
                if (res && res.error) {
                  toast.error(res.error);
                } else {
                  toast.success('Lead deleted successfully!');
                  window.location.href = '/dashboard/leads';
                }
              }
            }}
            className="text-xs font-bold text-red-500 hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Email Addresses */}
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            Emails
          </span>
          <p className="font-semibold text-xs text-primary mt-1">Primary Work:</p>
          <p className="font-medium truncate text-sm">{contact.email || 'No primary email'}</p>
          {additionalEmails.map((em, idx) => (
            <div key={idx} className="mt-1.5">
              <span className="font-semibold text-[10px] text-slate-400 capitalize">{em.label}:</span>
              <p className="text-xs text-muted-foreground truncate">{em.value}</p>
            </div>
          ))}
        </div>

        {/* Phone Numbers */}
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            Phones
          </span>
          <p className="font-semibold text-xs text-primary mt-1">Primary Mobile/Cell:</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="font-medium text-sm">{contact.phone || 'No primary phone'}</p>
            {contact.phone && (
              <div className="flex gap-1">
                <a
                  href={`tel:${contact.phone}`}
                  className="px-1.5 py-0.5 bg-primary/10 text-primary hover:bg-primary/20 text-[9px] font-bold rounded border border-primary/20 transition-colors"
                >
                  📞 Call
                </a>
                <a
                  href={`sms:${contact.phone}`}
                  className="px-1.5 py-0.5 bg-secondary/10 text-secondary hover:bg-secondary/20 text-[9px] font-bold rounded border border-secondary/20 transition-colors"
                >
                  💬 Text
                </a>
              </div>
            )}
          </div>
          {additionalPhones.map((ph, idx) => (
            <div key={idx} className="mt-2.5">
              <span className="font-semibold text-[10px] text-slate-400 capitalize">{ph.label}:</span>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-muted-foreground">{ph.value}</p>
                <div className="flex gap-1">
                  <a
                    href={`tel:${ph.value}`}
                    className="px-1.5 py-0.5 bg-muted text-foreground hover:bg-muted/80 text-[8px] font-semibold rounded border border-border"
                  >
                    Call
                  </a>
                  <a
                    href={`sms:${ph.value}`}
                    className="px-1.5 py-0.5 bg-muted text-foreground hover:bg-muted/80 text-[8px] font-semibold rounded border border-border"
                  >
                    Text
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Address */}
        {contact.address && (
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Address
            </span>
            <p className="text-xs font-medium mt-0.5">{contact.address}</p>
          </div>
        )}

        {/* Source */}
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            Source
          </span>
          <p className="font-medium mt-0.5 capitalize text-xs">{source || 'Manual'}</p>
        </div>
      </div>

      {/* Spouse / Co-borrower section */}
      {(contact.spouseName || contact.spousePhone || contact.spouseEmail) && (
        <div className="border-t border-border/50 pt-4 space-y-3">
          <h3 className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
            Spouse / Co-Borrower
          </h3>
          <div className="space-y-2 text-xs">
            {contact.spouseName && (
              <p className="font-semibold">
                👤 {contact.spouseName}
              </p>
            )}
            {contact.spousePhone && (
              <div className="flex items-center gap-2">
                <span>📞 {contact.spousePhone} (Spouse Cell)</span>
                <a
                  href={`tel:${contact.spousePhone}`}
                  className="px-1 py-0.2 bg-muted text-foreground text-[8px] rounded border border-border"
                >
                  Call
                </a>
              </div>
            )}
            {contact.spouseEmail && (
              <p className="text-muted-foreground truncate">
                ✉️ {contact.spouseEmail} (Spouse Personal)
              </p>
            )}
          </div>
        </div>
      )}

      {/* Family Members section */}
      {familyMembers.length > 0 && (
        <div className="border-t border-border/50 pt-4 space-y-3">
          <h3 className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
            Family Members
          </h3>
          <div className="space-y-1.5">
            {familyMembers.map((fm, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs bg-muted/20 p-2 rounded-lg border border-border/30">
                <span className="font-medium">{fm.name}</span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold">
                  {fm.relationship} {fm.age ? `(Age ${fm.age})` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isEditing && (
        <EditLeadModal
          leadId={leadId}
          contact={contact}
          onClose={() => setIsEditing(false)}
        />
      )}
    </div>
  );
}
