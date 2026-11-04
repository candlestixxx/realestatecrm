'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

const STAGES = [
  { key: 'LEAD', label: 'Lead Inquiry' },
  { key: 'PRE_APPROVAL', label: 'Pre-Approval' },
  { key: 'SHOWING', label: 'Showing/Viewing' },
  { key: 'OFFER_DRAFT', label: 'Offer Drafting' },
  { key: 'UNDER_CONTRACT', label: 'Under Contract' },
  { key: 'CLOSED', label: 'Closed Deal' },
];

export default function DealStageTracker({
  leadId,
  initialStage = 'LEAD',
}: {
  leadId: string;
  initialStage?: string;
}) {
  const [currentStage, setCurrentStage] = useState(initialStage);

  const handleStageChange = (stageKey: string) => {
    setCurrentStage(stageKey);
    toast.success(`Transaction stage updated to: ${stageKey.replace('_', ' ')}`);
  };

  const activeIdx = STAGES.findIndex((s) => s.key === currentStage);

  return (
    <div className="bg-background border border-border rounded-xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-md font-bold">Transaction Deal Tracker</h3>
          <p className="text-xs text-muted-foreground">Transparency pipeline showing active coordinator stages.</p>
        </div>
        <span className="text-[10px] bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
          Broker Approved
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < activeIdx;
          const isActive = idx === activeIdx;
          const isFuture = idx > activeIdx;

          return (
            <div
              key={stage.key}
              onClick={() => handleStageChange(stage.key)}
              className="flex-1 w-full sm:w-auto flex flex-col items-center group cursor-pointer relative"
            >
              {/* Node Circle */}
              <div
                className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs transition-all ${
                  isCompleted
                    ? 'bg-green-500/10 border-green-500 text-green-500'
                    : isActive
                      ? 'bg-primary/20 border-primary text-primary scale-110 ring-2 ring-primary/20'
                      : 'bg-muted border-border text-muted-foreground group-hover:border-primary/50'
                }`}
              >
                {isCompleted ? '✓' : idx + 1}
              </div>

              {/* Step Label */}
              <span
                className={`text-[10px] font-bold mt-2 text-center transition-colors uppercase tracking-tight ${
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                }`}
              >
                {stage.label}
              </span>

              {/* Connecting Lines for Desktop */}
              {idx < STAGES.length - 1 && (
                <div
                  className={`hidden sm:block absolute top-4 left-[60%] w-[80%] h-[2px] -z-10 transition-colors ${
                    idx < activeIdx ? 'bg-green-500' : 'bg-border'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
