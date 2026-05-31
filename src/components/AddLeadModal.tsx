'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AddLeadModal({
  addLeadAction,
  workspaces,
}: {
  addLeadAction: (formData: FormData) => Promise<{ error?: string } | void>;
  workspaces: { id: string; name: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await addLeadAction(formData);
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
        Add Lead
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-xl border border-border shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Lead</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1" title="The lead's official first name">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  name="firstName"
                  type="text"
                  placeholder="e.g. John"
                  className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-[10px] text-muted-foreground italic">Required for record identification.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" title="The lead's official last name or surname">Last Name</label>
                <input
                  name="lastName"
                  type="text"
                  placeholder="e.g. Doe"
                  className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" title="Primary contact email address">Email Address</label>
                <input
                  name="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-[10px] text-muted-foreground italic">Used for automated follow-ups and portal access.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" title="Primary contact phone number">Phone Number</label>
                <input
                  name="phone"
                  type="tel"
                  placeholder="(555) 000-0000"
                  className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
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
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
