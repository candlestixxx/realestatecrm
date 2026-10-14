'use client';
import { useRef } from 'react';
import toast from 'react-hot-toast';
import { scheduleShowingAction } from '@/lib/actions/showing';

export default function ShowingForm({ leadId, dealId }: { leadId?: string; dealId?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form 
      ref={formRef}
      action={async (data) => {
        const promise = scheduleShowingAction(data);
        toast.promise(promise, {
            loading: 'Connecting to MLS / ShowingTime...',
            success: 'Showing scheduled successfully!',
            error: 'Failed to schedule showing.'
        });
        await promise;
        formRef.current?.reset();
      }}
      className="border border-border rounded-xl p-6 bg-muted/5"
    >
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
        <span className="text-primary">🏠</span> Schedule a Showing
      </h3>
      {leadId && <input type="hidden" name="leadId" value={leadId} />}
      {dealId && <input type="hidden" name="dealId" value={dealId} />}
      
      <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase">Property Address or MLS #</label>
            <input name="propertyAddress" type="text" required className="w-full p-2 bg-background border border-border rounded mt-1 text-sm focus:ring-1 focus:ring-primary focus:outline-none" placeholder="123 Main St or MLS# 123456" />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Date</label>
                <input name="date" type="date" required className="w-full p-2 bg-background border border-border rounded mt-1 text-sm focus:ring-1 focus:ring-primary focus:outline-none" />
             </div>
             <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Time</label>
                <input name="time" type="time" required className="w-full p-2 bg-background border border-border rounded mt-1 text-sm focus:ring-1 focus:ring-primary focus:outline-none" />
             </div>
          </div>
      </div>
      <div className="flex justify-end mt-6">
        <button 
          type="submit" 
          className="px-4 py-2 bg-primary text-primary-foreground font-bold text-sm rounded-md hover:bg-primary/90 transition-colors"
        >
          Confirm Showing via MLS
        </button>
      </div>
    </form>
  );
}