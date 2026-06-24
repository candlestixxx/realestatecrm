'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function DashboardHeaderActions() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {

    setMounted(true);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-4">
        <button className="text-sm font-medium px-4 py-2 rounded-md bg-primary text-primary-foreground opacity-50 cursor-not-allowed">
          + New Deal / Action
        </button>
      </div>
    );
  }

  const actions = [
    { label: 'Manual Deal Entry', path: '/dashboard/deals?openModal=true', icon: '📝', desc: 'Create a deal pipeline record directly' },
    { label: 'Offer Draft Workflow', path: '/workflows/offer-draft', icon: '📄', desc: 'Buy-side: Prepare an offer with compliance checks' },
    { label: 'Listing Entry Workflow', path: '/workflows/listing-entry', icon: '🏡', desc: 'Sell-side: Prepare a new property listing' },
    { label: 'Foreclosure Intake', path: '/workflows/foreclosure-intake', icon: '🏛️', desc: 'Process a new distressed property lead' },
  ];

  const handleAction = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        + New Action
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-background border border-border rounded-xl shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          <div className="p-2 bg-muted/20 border-b border-border">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">Launch Workflow</h3>
          </div>
          <div className="p-2 space-y-1">
            {actions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleAction(action.path)}
                className="w-full text-left flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="text-lg leading-none">{action.icon}</div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground">{action.label}</span>
                  <span className="text-xs text-muted-foreground">{action.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
