'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import AddTaskModal from './AddTaskModal';
import { addTaskAction } from '@/lib/actions/task';
import { bulkEnrollLeadsInCampaignAction } from '@/lib/actions/campaign';
import { deleteLeadAction } from '@/lib/actions/lead';
import { addLeadsToSegmentBulkAction } from '@/lib/actions/segment';

type LeadRow = {
  id: string;
  status: string;
  score: number | null;
  source: string | null;
  isAiAssisted: boolean;
  tags?: string | null;
  contact: {
    firstName: string;
    lastName: string | null;
    email: string | null;
    phone: string | null;
  };
};

export function LeadTableClient({
  initialLeads,
  totalCount,
  currentPage,
  pageSize,
  workspaces,
  users,
  segments = [],
  campaigns = [],
}: {
  initialLeads: LeadRow[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  workspaces: { id: string; name: string }[];
  users: { id: string; name: string | null }[];
  segments?: { id: string; name: string }[];
  campaigns?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(initialLeads.map((l) => l.id)));
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

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('limit', e.target.value);
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);

  const handleEnrollCampaignBulk = async (campaignId: string) => {
    try {
      const ids = Array.from(selectedIds);
      const res = await bulkEnrollLeadsInCampaignAction(ids, campaignId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Successfully enrolled ${ids.length} leads in the Smart Plan.`);
        setSelectedIds(new Set());
        setShowCampaignModal(false);
        router.refresh();
      }
    } catch (err) {
      toast.error('Failed to bulk enroll in campaign.');
    }
  };

  const startWorkflow = (path: string) => {
    if (selectedIds.size !== 1) {
      toast.error('Please select exactly ONE lead to start a workflow.');
      setShowWorkflowModal(false);
      return;
    }
    const leadId = Array.from(selectedIds)[0];
    router.push(`${path}?leadId=${leadId}`);
  };

  const handleAddToSegment = async (segmentId: string) => {
    try {
      const ids = Array.from(selectedIds);
      const res = await addLeadsToSegmentBulkAction(ids, segmentId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Successfully added ${ids.length} leads to the segment.`);
        setSelectedIds(new Set());
        setShowSegmentModal(false);
        router.refresh();
      }
    } catch (err) {
      toast.error('Failed to add leads to segment.');
    }
  };

  const bulkAction = async (action: string) => {
    if (action === 'Add to Workflow') {
      if (selectedIds.size !== 1) {
        toast.error('Workflows require exactly 1 lead to be selected.');
        return;
      }
      setShowWorkflowModal(true);
      return;
    }

    if (action === 'Add to Segment') {
      if (selectedIds.size === 0) {
        toast.error('Select at least one lead first.');
        return;
      }
      setShowSegmentModal(true);
      return;
    }

    if (action === 'Add to Smart Plan') {
      if (selectedIds.size === 0) {
        toast.error('Select at least one lead first.');
        return;
      }
      setShowCampaignModal(true);
      return;
    }

    if (selectedIds.size === 0) {
      toast.error('Select at least one lead first.');
      return;
    }
    
    // Simulate backend processing
    const promise = new Promise((resolve) => setTimeout(resolve, 1500));
    
    toast.promise(promise, {
      loading: `Executing ${action} for ${selectedIds.size} leads...`,
      success: `Successfully triggered ${action}!`,
      error: `Failed to execute ${action}.`,
    });

    await promise;
    setSelectedIds(new Set());
  };

  const handleImportFromQueue = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'syncToCrm' }),
      });
      const data = await res.json();
      
      if (data.success) {
         toast.success(`Successfully imported ${data.syncedCount} leads from the queue.`);
      } else {
         toast.error(data.error || 'Failed to import from queue.');
      }
      router.refresh();
    } catch (err) {
      toast.error('Network error during sync.');
    } finally {
      setIsSyncing(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div>
      {/* Top Controls Bar */}
      <div className="p-4 border-b border-border flex justify-between items-center bg-muted/5">
        <div className="flex gap-2">
           <button
            onClick={handleImportFromQueue}
            disabled={isSyncing}
            className="px-3 py-1.5 bg-secondary/10 text-secondary border border-secondary/20 text-xs font-bold rounded shadow-sm hover:bg-secondary/15 transition-colors disabled:opacity-50"
          >
            {isSyncing ? 'Syncing...' : '📥 Sync from Queue'}
          </button>
          <button
            onClick={() => bulkAction('Import from Workflow')}
            className="px-3 py-1.5 bg-background border border-border text-xs font-medium rounded shadow-sm hover:bg-muted transition-colors"
          >
            🔄 Sync from Workflow
          </button>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
           <div className="flex items-center gap-2">
            <span className="text-xs">Per page:</span>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="bg-background border border-border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-primary"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="75">75</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Workflow Selection Modal */}
      {showWorkflowModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-background border border-border shadow-xl rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
              <h3 className="font-bold text-lg">Select Workflow</h3>
              <button onClick={() => setShowWorkflowModal(false)} className="text-muted-foreground hover:text-foreground">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 space-y-2">
              <button onClick={() => startWorkflow('/workflows/offer-draft')} className="w-full flex items-start gap-3 p-3 rounded-xl border border-border bg-background hover:bg-muted/50 transition-all text-left group">
                <span className="text-2xl group-hover:scale-110 transition-transform">📄</span>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">Offer Draft</span>
                  <span className="text-xs text-muted-foreground">Prepare a buy-side offer for this lead.</span>
                </div>
              </button>
              <button onClick={() => startWorkflow('/workflows/listing-entry')} className="w-full flex items-start gap-3 p-3 rounded-xl border border-border bg-background hover:bg-muted/50 transition-all text-left group">
                <span className="text-2xl group-hover:scale-110 transition-transform">🏡</span>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">Listing Entry</span>
                  <span className="text-xs text-muted-foreground">Prepare a sell-side property listing.</span>
                </div>
              </button>
              <button onClick={() => startWorkflow('/workflows/foreclosure-intake')} className="w-full flex items-start gap-3 p-3 rounded-xl border border-border bg-background hover:bg-muted/50 transition-all text-left group">
                <span className="text-2xl group-hover:scale-110 transition-transform">🏛️</span>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">Foreclosure Intake</span>
                  <span className="text-xs text-muted-foreground">Process distressed property data.</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Segment Selection Modal */}
      {showSegmentModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-background border border-border shadow-xl rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
              <h3 className="font-bold text-lg">Add to Segment</h3>
              <button onClick={() => setShowSegmentModal(false)} className="text-muted-foreground hover:text-foreground">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
              {segments.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No segments found. Go to the Segments page to create one.
                </div>
              ) : (
                segments.map((seg) => (
                  <button
                    key={seg.id}
                    onClick={() => handleAddToSegment(seg.id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:bg-muted/50 transition-all text-left font-bold text-sm"
                  >
                    <span>📁 {seg.name}</span>
                    <span className="text-xs text-primary font-normal">Select &rarr;</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Campaign Selection Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-background border border-border shadow-xl rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
              <h3 className="font-bold text-lg">Enroll in Drip Campaign</h3>
              <button onClick={() => setShowCampaignModal(false)} className="text-muted-foreground hover:text-foreground">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
              {campaigns.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No campaigns found. Go to the Campaigns page to create one.
                </div>
              ) : (
                campaigns.map((camp) => (
                  <button
                    key={camp.id}
                    onClick={() => handleEnrollCampaignBulk(camp.id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:bg-muted/50 transition-all text-left font-bold text-sm"
                  >
                    <span>🤖 {camp.name}</span>
                    <span className="text-xs text-primary font-normal">Enroll Selected &rarr;</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}


      {/* Bulk Actions Bar (Sticky/Floating overlay when selection exists) */}
      {selectedIds.size > 0 && (
        <div className="bg-primary/10 border-b border-primary/20 p-3 flex items-center justify-between sticky top-0 z-20">
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
                onClick={() => bulkAction('Add to Deal')}
                className="px-2 py-1 bg-background border border-border text-[10px] font-bold uppercase rounded hover:bg-muted transition-colors"
              >
                + Deal
              </button>
              <button
                onClick={() => bulkAction('Add to Smart Plan')}
                className="px-2 py-1 bg-background border border-border text-[10px] font-bold uppercase rounded hover:bg-muted transition-colors"
              >
                + Smart Plan
              </button>
              <button
                onClick={() => bulkAction('Add to Workflow')}
                className="px-2 py-1 bg-background border border-border text-[10px] font-bold uppercase rounded hover:bg-muted transition-colors"
              >
                + Workflow
              </button>
              <button
                onClick={async () => {
                  const ids = Array.from(selectedIds);
                  if (confirm(`Are you sure you want to delete the ${ids.length} selected leads?`)) {
                    let successCount = 0;
                    for (const id of ids) {
                      const res = await deleteLeadAction(id);
                      if (!res.error) successCount++;
                    }
                    toast.success(`Successfully deleted ${successCount} leads.`);
                    setSelectedIds(new Set());
                    router.refresh();
                  }
                }}
                className="px-2 py-1 bg-red-600 text-white border border-red-700 text-[10px] font-bold uppercase rounded hover:bg-red-700 transition-colors shadow-sm"
              >
                🗑️ Delete Selected
              </button>
            </div>
          </div>
          <div className="flex gap-2">
             <button
              onClick={() => bulkAction('AI Assist')}
              className="px-3 py-1.5 bg-primary/20 text-primary border border-primary/30 text-xs font-bold rounded shadow-sm hover:bg-primary/30 transition-colors"
            >
              ✨ AI Assist
            </button>
            <div className="flex border border-border rounded overflow-hidden">
               <button onClick={() => bulkAction('Call')} className="px-3 py-1.5 bg-background hover:bg-muted border-r border-border text-xs font-medium">📞 Call</button>
               <button onClick={() => bulkAction('Text')} className="px-3 py-1.5 bg-background hover:bg-muted border-r border-border text-xs font-medium">💬 Text</button>
               <button onClick={() => bulkAction('Email')} className="px-3 py-1.5 bg-background hover:bg-muted text-xs font-medium">✉️ Email</button>
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
                  checked={selectedIds.size === initialLeads.length && initialLeads.length > 0}
                  className="rounded border-border"
                />
              </th>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Contact</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">AI Status</th>
              <th className="px-6 py-3 font-medium">Source</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {initialLeads.map((lead) => (
              <tr key={lead.id} className={`hover:bg-muted/10 transition-colors ${selectedIds.has(lead.id) ? 'bg-primary/5' : ''}`}>
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(lead.id)}
                    onChange={(e) => handleSelectOne(lead.id, e.target.checked)}
                    className="rounded border-border text-primary"
                  />
                </td>
                <td className="px-6 py-4 font-medium">
                  <div className="flex flex-col">
                    <Link
                      href={`/dashboard/leads/${lead.id}`}
                      className="hover:text-primary hover:underline font-bold text-foreground transition-colors"
                    >
                      {lead.contact?.firstName} {lead.contact?.lastName}
                    </Link>
                    {lead.tags && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {lead.tags.split(',').map(tag => {
                          const cleanTag = tag.trim();
                          if (!cleanTag) return null;
                          return (
                            <span key={cleanTag} className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-tighter">
                              {cleanTag.startsWith('#') ? cleanTag : `#${cleanTag}`}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span>{lead.contact?.email}</span>
                    <span className="text-xs text-muted-foreground">{lead.contact?.phone}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium border ${
                      lead.status === 'NEW'
                        ? 'bg-secondary/20 text-secondary-foreground border-secondary/30'
                        : lead.status === 'QUALIFIED'
                          ? 'bg-primary/20 text-primary border-primary/30'
                          : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {lead.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {lead.isAiAssisted ? (
                    <span className="flex items-center gap-1 text-xs text-primary font-bold">
                       <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                       AI ACTIVE
                     </span>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Manual Only</span>
                  )}
                </td>
                <td className="px-6 py-4 text-muted-foreground">{lead.source}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <AddTaskModal
                      addTaskAction={addTaskAction}
                      workspaces={workspaces}
                      users={users}
                      leadId={lead.id}
                      triggerText="+ Task"
                      triggerClassName="px-2.5 py-1.5 bg-secondary/15 text-secondary hover:bg-secondary/20 text-[10px] font-bold rounded-lg border border-secondary/30 transition-colors uppercase tracking-wider"
                    />
                    <Link
                      href={`/dashboard/leads/${lead.id}`}
                      className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm"
                    >
                      View Lead
                    </Link>
                    <button
                      onClick={async () => {
                        if (confirm(`Are you sure you want to delete lead "${lead.contact?.firstName} ${lead.contact?.lastName || ''}"?`)) {
                          const res = await deleteLeadAction(lead.id);
                          if (res && res.error) {
                            toast.error(res.error);
                          } else {
                            toast.success('Lead deleted successfully!');
                            router.refresh();
                          }
                        }
                      }}
                      className="px-2.5 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-lg text-[10px] font-bold uppercase transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {initialLeads.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                  No leads found in this segment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground bg-muted/10">
        <div className="flex items-center gap-4">
          <span>
            Showing {totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount} entries
          </span>
        </div>
        <div className="flex gap-2">
          <Link
            href={`?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(currentPage - 1) }).toString()}`}
            className={`px-3 py-1 border border-border rounded hover:bg-muted transition-colors ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}
          >
            Prev
          </Link>
          <Link
            href={`?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(currentPage + 1) }).toString()}`}
            className={`px-3 py-1 border border-border rounded hover:bg-muted transition-colors ${currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
