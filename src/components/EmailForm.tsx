'use client';
import { useRef } from 'react';
import toast from 'react-hot-toast';
import { sendEmailAction } from '@/lib/actions/email';

export default function EmailForm({ leadId, email }: { leadId: string; email?: string | null }) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form 
      ref={formRef}
      action={async (data) => {
        if (!data.get('email')) {
            toast.error('No email address attached to this lead.');
            return;
        }
        const promise = sendEmailAction(data);
        toast.promise(promise, {
            loading: 'Sending Email...',
            success: 'Email sent successfully!',
            error: 'Failed to send email.'
        });
        await promise;
        formRef.current?.reset();
      }}
      className="border border-border rounded-xl p-4 bg-muted/5"
    >
      <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
         <span className="text-primary">✉️</span> Draft Email Message
      </h3>
      <input type="hidden" name="leadId" value={leadId} />
      <input type="hidden" name="email" value={email || ''} />
      
      <div className="mb-3">
        <label className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Subject</label>
        <input 
          type="text" 
          name="subject" 
          className="w-full p-2.5 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary focus:outline-none"
          placeholder="CRM Follow-up"
          disabled={!email}
        />
      </div>

      <div className="mb-4">
        <label className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Message Content</label>
        <textarea 
          name="message"
          className="w-full h-32 p-3 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-primary focus:outline-none" 
          placeholder={email ? `Type email to ${email}...` : "No email address available"}
          disabled={!email}
          required
        ></textarea>
      </div>

      <div className="flex justify-end">
        <button 
          type="submit" 
          disabled={!email}
          className="px-4 py-2 bg-primary text-primary-foreground font-bold text-sm rounded-md disabled:opacity-50 hover:bg-primary/90 transition-colors"
        >
          Send Email
        </button>
      </div>
    </form>
  );
}
