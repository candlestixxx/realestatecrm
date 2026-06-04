'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AddContactModal({
  addContactAction,
  workspaces,
}: {
  addContactAction: (formData: FormData) => Promise<{ error?: string } | void>;
  workspaces: { id: string; name: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const addressInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await addContactAction(formData);
    if (result && result.error) {
      setError(result.error);
    } else {
      toast.success('Contact added successfully!');
      setIsOpen(false);
      router.refresh();
    }
  }

  // --- Google Maps Autocomplete Logic ---
  useEffect(() => {
    const google = (window as any).google;
    if (isOpen && addressInputRef.current && google) {
      const autocomplete = new google.maps.places.Autocomplete(addressInputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' }
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          if (addressInputRef.current) {
             addressInputRef.current.value = place.formatted_address;
          }
        }
      });
    }
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm"
      >
        Add Contact
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl border border-border shadow-2xl p-6 w-full max-w-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-2xl font-bold tracking-tight">Add New Contact</h2>
               <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}
            
            <form action={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">First Name</label>
                  <input
                    required
                    name="firstName"
                    type="text"
                    placeholder="John"
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Last Name</label>
                  <input
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone</label>
                  <input
                    name="phone"
                    type="tel"
                    placeholder="(555) 000-0000"
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Physical Address (Google Maps Autocomplete)</label>
                <input
                  ref={addressInputRef}
                  name="address"
                  type="text"
                  placeholder="Start typing an address..."
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Workspace / Segment</label>
                <select
                  name="workspaceId"
                  required
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                >
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Initial Internal Note</label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Enter initial contact history or context..."
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                ></textarea>
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
                  className="px-6 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-md hover:bg-primary/90 transition-colors shadow-lg"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
