'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

type ContactRow = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  createdAt: Date | string;
  workspaceId: string;
};

export function ContactTableClient({
  initialContacts,
  totalCount,
  currentPage,
  pageSize,
  workspaces,
}: {
  initialContacts: ContactRow[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  workspaces: { id: string; name: string }[];
}) {
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(initialContacts.map((c) => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedIds(newSet);
  };

  const bulkAction = async (action: string) => {
    if (selectedIds.size === 0) {
      toast.error('Select at least one contact first.');
      return;
    }
    
    const promise = new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast.promise(promise, {
      loading: `Executing ${action} for ${selectedIds.size} contacts...`,
      success: `Successfully triggered ${action}!`,
      error: `Failed to execute ${action}.`,
    });

    await promise;
    setSelectedIds(new Set());
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Build pagination URL safely
  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    return `?${params.toString()}`;
  };

  return (
    <div>
      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-primary/10 border-b border-primary/20 p-3 flex items-center justify-between sticky top-16 z-20">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-primary">{selectedIds.size} Selected</span>
            <div className="h-4 w-[1px] bg-primary/20 mx-1"></div>
            <div className="flex gap-1">
              <button
                onClick={() => bulkAction('Add to Segment')}
                className="px-2 py-1 bg-background border border-border text-[10px] font-bold uppercase rounded hover:bg-muted transition-colors"
              >
                + Segment
              </button>
              <button
                onClick={() => bulkAction('Export')}
                className="px-2 py-1 bg-background border border-border text-[10px] font-bold uppercase rounded hover:bg-muted transition-colors"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
            <tr>
              <th className="px-6 py-3 font-medium w-10">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={selectedIds.size === initialContacts.length && initialContacts.length > 0}
                  className="rounded border-border"
                />
              </th>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Email</th>
              <th className="px-6 py-3 font-medium">Phone</th>
              <th className="px-6 py-3 font-medium">Segment</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {initialContacts.map((contact) => (
              <tr 
                key={contact.id} 
                className={`hover:bg-muted/5 transition-colors group ${selectedIds.has(contact.id) ? 'bg-primary/5' : ''}`}
              >
                <td className="px-6 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(contact.id)}
                    onChange={(e) => handleSelectOne(contact.id, e.target.checked)}
                    className="rounded border-border text-primary"
                  />
                </td>
                <td className="px-6 py-4 font-medium">
                  <Link 
                    href={`/dashboard/contacts/${contact.id}`}
                    className="hover:underline text-foreground decoration-primary/30 underline-offset-4 block w-full h-full"
                  >
                    {contact.firstName} {contact.lastName}
                  </Link>
                </td>
                <td className="px-6 py-4 text-muted-foreground">{contact.email || '--'}</td>
                <td className="px-6 py-4 text-muted-foreground">{contact.phone || '--'}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 bg-muted border border-border rounded text-[10px] font-bold uppercase tracking-tight">
                    {workspaces.find(ws => ws.id === contact.workspaceId)?.name || 'Default'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/dashboard/contacts/${contact.id}`}
                    className="px-3 py-1.5 bg-primary/5 text-primary border border-primary/10 rounded text-xs font-bold hover:bg-primary/10 transition-colors inline-block"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {initialContacts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground text-sm italic">
                  No contacts found in this segment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground bg-muted/10">
        <span>
          Showing {totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
          {Math.min(currentPage * pageSize, totalCount)} of {totalCount} entries
        </span>
        <div className="flex gap-2">
          <Link
            href={createPageUrl(currentPage - 1)}
            className={`px-3 py-1 border border-border rounded hover:bg-muted transition-colors ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}
          >
            Prev
          </Link>
          <Link
            href={createPageUrl(currentPage + 1)}
            className={`px-3 py-1 border border-border rounded hover:bg-muted transition-colors ${currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
