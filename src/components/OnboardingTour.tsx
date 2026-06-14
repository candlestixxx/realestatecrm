'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export function OnboardingTour() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenOnboarding_v2');
    if (!hasSeenTour) {
      // Small delay to let the page load
      const timer = setTimeout(() => {
        setShow(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasSeenOnboarding_v2', 'true');
    setShow(false);
    toast.success('You can review these features anytime in the Help menu.');
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-background border border-primary shadow-2xl rounded-xl p-5 animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h3 className="font-bold text-lg text-foreground">Welcome to your new CRM</h3>
      </div>
      <div className="space-y-3 text-sm text-muted-foreground mb-5">
        <p>
          <strong className="text-foreground">Workspaces are now Segments:</strong> Use the workspace dropdown in the header to switch between different lead lists or team segments.
        </p>
        <p>
          <strong className="text-foreground">Bulk Actions:</strong> On the Leads page, use checkboxes to add multiple leads to an AI Drip Campaign or Workflow simultaneously.
        </p>
        <p>
          <strong className="text-foreground">AI Assistant:</strong> Gemini is integrated into the dashboard to execute these background workflows and communicate with your segmented leads.
        </p>
      </div>
      <div className="flex justify-end">
        <button
          onClick={handleClose}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded hover:bg-primary/90 transition-colors"
        >
          Got it, thanks!
        </button>
      </div>
    </div>
  );
}
