'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function MassOutreachModal({
  segmentId,
  segmentName,
  sendMassEmailToSegmentAction,
}: {
  segmentId: string;
  segmentName: string;
  sendMassEmailToSegmentAction: (segmentId: string, subject: string, message: string) => Promise<{ success?: boolean; error?: string; sentCount?: number }>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject and message are required.');
      return;
    }
    setIsSending(true);
    try {
      const res = await sendMassEmailToSegmentAction(segmentId, subject, message);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Successfully sent emails to ${res.sentCount || 0} leads via Amazon SES!`);
        setIsOpen(false);
        setSubject('');
        setMessage('');
      }
    } catch (err) {
      toast.error('Failed to send mass emails.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-[11px] font-bold text-primary hover:underline"
      >
        ✉️ Mass Outreach
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-background border border-border shadow-xl rounded-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
              <div>
                <h3 className="font-bold text-md text-foreground">Mass Email Campaign</h3>
                <p className="text-xs text-muted-foreground">Targeting List: <strong className="text-foreground">{segmentName}</strong></p>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-muted-foreground hover:text-foreground"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSend} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground uppercase font-bold mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Hot new properties in Macomb County!"
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground uppercase font-bold mb-1">
                  Message Body
                </label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Draft your bulk marketing message here..."
                  className="w-full h-40 bg-muted/30 border border-border rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                ></textarea>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-[10px] text-muted-foreground max-w-[280px]">
                  💡 Integrates automatically with Amazon SES for maximum deliverability and tracking.
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 border border-border rounded-lg text-xs font-semibold hover:bg-muted/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSending}
                    className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-all shadow-md disabled:opacity-50"
                  >
                    {isSending ? 'Sending...' : '🚀 Launch Bulk SES'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
