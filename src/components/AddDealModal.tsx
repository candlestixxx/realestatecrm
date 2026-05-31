'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AddDealModal({
  addDealAction,
  workspaces,
  contacts,
}: {
  addDealAction: (formData: FormData) => Promise<{ error?: string } | void>;
  workspaces: { id: string; name: string }[];
  contacts: { id: string; firstName: string; lastName: string | null }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await addDealAction(formData);
    if (result && result.error) {
      setError(result.error);
    } else {
      toast.success('Success!');
      setIsOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
      >
        New Deal
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-xl border border-border shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Deal</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Deal Title</label>
                <input
                  required
                  name="title"
                  type="text"
                  placeholder="e.g. 123 Main St Purchase"
                  className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Estimated Value ($)</label>
                <input
                  name="value"
                  type="number"
                  placeholder="500000"
                  className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Stage</label>
                <select
                  name="stage"
                  required
                  className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="QUALIFICATION">Qualification</option>
                  <option value="PROPOSAL">Proposal/Showing</option>
                  <option value="NEGOTIATION">Negotiation</option>
                  <option value="UNDER_CONTRACT">Under Contract</option>
                  <option value="CLOSED_WON">Closed Won</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Client / Contact</label>
                <select
                  name="contactId"
                  required
                  className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Workspace</label>
                <select
                  name="workspaceId"
                  required
                  className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    toast.success('Success!');
                    setIsOpen(false);
                    setError(null);
                  }}
                  className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
                >
                  Create Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
