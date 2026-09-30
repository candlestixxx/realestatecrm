'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface Approval {
  id: string;
  content: string;
  createdAt: string;
  lead?: { id: string; contact: { firstName: string; lastName: string | null } } | null;
}

interface ParsedApproval {
  title: string;
  description: string;
  assetType: string;
  assetUrl: string | null;
  status: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
}

function parseApproval(content: string): ParsedApproval {
  try {
    return JSON.parse(content);
  } catch {
    return { title: content, description: '', assetType: 'content', assetUrl: null, status: 'PENDING' };
  }
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  const loadApprovals = useCallback(async () => {
    try {
      const res = await fetch('/api/approvals');
      const data = await res.json();
      setApprovals(data.approvals || []);
    } catch {
      toast.error('Failed to load approvals');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadApprovals(); }, [loadApprovals]);

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    try {
      await fetch('/api/approvals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      toast.success(`Approval ${action}`);
      loadApprovals();
    } catch {
      toast.error('Failed to update approval');
    }
  };

  const filtered = approvals.filter(a => {
    const parsed = parseApproval(a.content);
    return filter === 'all' || parsed.status.toLowerCase() === filter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Approval Workflows</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and approve content, media assets, and marketing materials before publishing.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors ${
              filter === f ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Approvals List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading approvals...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 border border-border rounded-xl">
          <div className="text-3xl mb-2">✅</div>
          <p className="text-sm text-muted-foreground">
            {filter === 'pending' ? 'No pending approvals.' : `No ${filter} approvals.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const parsed = parseApproval(item.content);
            return (
              <div key={item.id} className="bg-background border border-border rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground">{parsed.title}</h3>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        parsed.status === 'PENDING' ? 'bg-yellow-500/15 text-yellow-500' :
                        parsed.status === 'APPROVED' ? 'bg-green-500/15 text-green-500' :
                        'bg-red-500/15 text-red-500'
                      }`}>
                        {parsed.status}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                        {parsed.assetType}
                      </span>
                    </div>
                    {parsed.description && (
                      <p className="text-xs text-muted-foreground mt-1">{parsed.description}</p>
                    )}
                    {item.lead && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Lead: {item.lead.contact.firstName} {item.lead.contact.lastName}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Created {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {parsed.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(item.id, 'approved')}
                        className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleAction(item.id, 'rejected')}
                        className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
