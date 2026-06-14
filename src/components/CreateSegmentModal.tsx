'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function CreateSegmentModal({
  createWorkspaceAction,
}: {
  createWorkspaceAction: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSyncing] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSyncing(true);
    const formData = new FormData(e.currentTarget);
    
    const result = await createWorkspaceAction(formData);
    
    setIsSyncing(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Segment created successfully!');
      setIsOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 border border-border bg-background text-foreground font-medium rounded-md hover:bg-muted transition-colors"
      >
        + New Segment
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl border border-border shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Create New Segment</h2>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-6">
              Segments (Workspaces) allow you to organize leads into isolated lists like &quot;Hot Prospects&quot; or &quot;Foreclosures&quot;.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Segment Name</label>
                <input
                  required
                  name="name"
                  type="text"
                  placeholder="e.g. Past Clients, Macomb Sellers"
                  className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-md hover:bg-primary/90 transition-colors shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Segment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
