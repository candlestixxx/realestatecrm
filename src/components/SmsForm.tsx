'use client';
import { useRef } from 'react';
import toast from 'react-hot-toast';
import { sendSmsAction } from '@/lib/actions/sms';

export default function SmsForm({ leadId, phone }: { leadId: string; phone?: string | null }) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form 
      ref={formRef}
      action={async (data) => {
        if (!data.get('phone')) {
            toast.error('No phone number attached to this lead.');
            return;
        }
        const promise = sendSmsAction(data);
        toast.promise(promise, {
            loading: 'Sending SMS...',
            success: 'Message sent successfully!',
            error: 'Failed to send message.'
        });
        await promise;
        formRef.current?.reset();
      }}
      className="border border-border rounded-xl p-4 bg-muted/5"
    >
      <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
         <span className="text-primary">📱</span> Draft SMS Message
      </h3>
      <input type="hidden" name="leadId" value={leadId} />
      <input type="hidden" name="phone" value={phone || ''} />
      <textarea 
        name="message"
        className="w-full h-24 p-3 bg-background border border-border rounded-md text-sm mb-4 focus:ring-1 focus:ring-primary focus:outline-none" 
        placeholder={phone ? `Type message to ${phone}... (Tip: Include "listings" to trigger Gemini AI Search Alert)` : "No phone number available"}
        disabled={!phone}
        required
      ></textarea>
      <div className="flex justify-end">
        <button 
          type="submit" 
          disabled={!phone}
          className="px-4 py-2 bg-primary text-primary-foreground font-bold text-sm rounded-md disabled:opacity-50 hover:bg-primary/90 transition-colors"
        >
          Send Message
        </button>
      </div>
    </form>
  );
}