'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface LeadCaptureModalProps {
  tenantName: string;
  triggerDelayMs?: number;
  triggerScrollPercent?: number;
}

export function LeadCaptureModal({ tenantName, triggerDelayMs = 15000, triggerScrollPercent = 60 }: LeadCaptureModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (hasTriggered) return;

    // Trigger on time
    const timer = setTimeout(() => {
      if (!hasTriggered) {
        setIsOpen(true);
        setHasTriggered(true);
      }
    }, triggerDelayMs);

    // Trigger on scroll depth
    const handleScroll = () => {
      if (hasTriggered) return;

      const scrollY = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;

      if (documentHeight > 0) {
        const scrollPercent = (scrollY / documentHeight) * 100;
        if (scrollPercent >= triggerScrollPercent) {
          setIsOpen(true);
          setHasTriggered(true);
        }
      }
    };

    // Trigger on explicit intent events (like photo gallery clicks)
    const handleIntentEvent = (e: Event) => {
      if (!hasTriggered) {
        setIsOpen(true);
        setHasTriggered(true);
      }
    };

    window.addEventListener('lead-capture-intent', handleIntentEvent);
    window.addEventListener('scroll', handleScroll);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('lead-capture-intent', handleIntentEvent);
    };
  }, [hasTriggered, triggerDelayMs, triggerScrollPercent]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-background border border-border shadow-2xl rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="relative bg-primary px-6 py-8 text-center text-primary-foreground">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-black mb-2">Don&apos;t Miss Out!</h2>
          <p className="opacity-90 text-sm">Join {tenantName}&apos;s exclusive VIP list to get properties before they hit the market.</p>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h3 className="text-xl font-bold">You&apos;re on the list!</h3>
              <p className="text-muted-foreground text-sm">We&apos;ll be in touch shortly.</p>
              <button
                onClick={() => setIsOpen(false)}
                className="mt-4 px-6 py-2 bg-muted text-muted-foreground hover:bg-muted/80 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);

                try {
                  const response = await fetch('/api/leads/external', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      firstName: formData.get('fullName')?.toString().split(' ')[0] || '',
                      lastName: formData.get('fullName')?.toString().split(' ').slice(1).join(' ') || '',
                      email: formData.get('email') || '',
                      phone: formData.get('phone') || '',
                      source: `Website Lead Capture (${tenantName})`,
                      type: 'BUYER'
                    })
                  });

                  if (response.ok) {
                    setSubmitted(true);
                  } else {
                    console.error('Failed to submit lead to CRM pipeline');
                    setSubmitted(true); // Show success UX anyway to the user
                  }
                } catch (err) {
                  console.error('Lead capture error', err);
                  setSubmitted(true);
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                <input required type="text" className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none transition-all" name="fullName" placeholder="John Doe" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                <input required type="email" className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none transition-all" name="email" placeholder="john@example.com" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Number</label>
                <input type="tel" className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary outline-none transition-all" name="phone" placeholder="(555) 123-4567" />
              </div>

              <button type="submit" className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-lg hover:bg-primary/90 transition-colors mt-2 shadow-lg shadow-primary/20">
                Unlock VIP Access
              </button>
              <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider mt-4">
                We respect your privacy. No spam.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
