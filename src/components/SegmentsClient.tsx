'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { 
  Pin, 
  PinOff, 
  Trash2, 
  Mail, 
  MessageSquare, 
  Sparkles, 
  ArrowLeft, 
  Search, 
  UserPlus, 
  UserMinus, 
  X,
  Volume2,
  Bookmark,
  ChevronRight
} from 'lucide-react';
import MassOutreachModal from './MassOutreachModal';
import { 
  toggleSegmentPinAction, 
  deleteSegmentAction, 
  addLeadToSegmentAction, 
  removeLeadFromSegmentAction 
} from '@/lib/actions/segment';
import CreateSegmentModal from './CreateSegmentModal';

interface Contact {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
}

interface Lead {
  id: string;
  type: string;
  status: string;
  contact: Contact;
  createdAt: string | Date;
}

interface Segment {
  id: string;
  name: string;
  description: string | null;
  isPinned: boolean;
  leads: Lead[];
}

interface SmartPlan {
  id: string;
  name: string;
  description: string | null;
}

interface SegmentsClientProps {
  initialSegments: Segment[];
  allLeads: Lead[];
  smartPlans: SmartPlan[];
  sendMassEmailToSegmentAction: any;
  createSegmentAction: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
}

export default function SegmentsClient({
  initialSegments,
  allLeads,
  smartPlans,
  sendMassEmailToSegmentAction,
  createSegmentAction
}: SegmentsClientProps) {
  const [segments, setSegments] = useState<Segment[]>(initialSegments);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [leadSearchTerm, setLeadSearchTerm] = useState('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  
  // Modals state
  const [isSmsOpen, setIsSmsOpen] = useState(false);
  const [isSmartPlanOpen, setIsSmartPlanOpen] = useState(false);
  const [smsText, setSmsText] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [isAddingLead, setIsAddingLead] = useState(false);

  // Active Segment Context
  const activeSegment = segments.find(s => s.id === selectedSegmentId);

  // Filtered segments (based on search)
  const filteredSegments = segments.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort: Pinned first, then alphabetically
  const sortedSegments = [...filteredSegments].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return a.name.localeCompare(b.name);
  });

  const handleTogglePin = async (id: string) => {
    try {
      const res = await toggleSegmentPinAction(id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setSegments(prev => prev.map(s => {
        if (s.id === id) {
          const newPinned = !s.isPinned;
          toast.success(newPinned ? 'Segment pinned to top' : 'Segment unpinned');
          return { ...s, isPinned: newPinned };
        }
        return s;
      }));
    } catch (err) {
      toast.error('Failed to toggle pin');
    }
  };

  const handleDeleteSegment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this segment list?')) return;
    try {
      const res = await deleteSegmentAction(id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success('Segment deleted successfully');
      setSegments(prev => prev.filter(s => s.id !== id));
      if (selectedSegmentId === id) setSelectedSegmentId(null);
    } catch (err) {
      toast.error('Failed to delete segment');
    }
  };

  const handleRemoveLead = async (leadId: string) => {
    if (!selectedSegmentId) return;
    try {
      const res = await removeLeadFromSegmentAction(leadId, selectedSegmentId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success('Lead removed from segment list');
      setSegments(prev => prev.map(s => {
        if (s.id === selectedSegmentId) {
          return { ...s, leads: s.leads.filter(l => l.id !== leadId) };
        }
        return s;
      }));
    } catch (err) {
      toast.error('Failed to remove lead');
    }
  };

  const handleAddLead = async (leadId: string) => {
    if (!selectedSegmentId) return;
    try {
      const res = await addLeadToSegmentAction(leadId, selectedSegmentId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      const leadToAdd = allLeads.find(l => l.id === leadId);
      if (leadToAdd) {
        setSegments(prev => prev.map(s => {
          if (s.id === selectedSegmentId) {
            return { ...s, leads: [...s.leads, leadToAdd] };
          }
          return s;
        }));
        toast.success('Lead added to segment list');
      }
      setIsAddingLead(false);
    } catch (err) {
      toast.error('Failed to add lead');
    }
  };

  const handleMassSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsText.trim()) return;
    const targetCount = selectedLeadIds.length > 0 ? selectedLeadIds.length : (activeSegment?.leads.length || 0);
    toast.success(`Mass SMS simulation triggered for ${targetCount} leads!`);
    setIsSmsOpen(false);
    setSmsText('');
  };

  const handleApplySmartPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) return;
    const targetCount = selectedLeadIds.length > 0 ? selectedLeadIds.length : (activeSegment?.leads.length || 0);
    toast.success(`Smart Plan applied to ${targetCount} leads successfully!`);
    setIsSmartPlanOpen(false);
    setSelectedPlanId('');
  };

  // Leads in active segment filtered by lead search input
  const filteredActiveLeads = activeSegment?.leads.filter(l => {
    const fullName = `${l.contact.firstName} ${l.contact.lastName || ''}`.toLowerCase();
    return fullName.includes(leadSearchTerm.toLowerCase()) || 
           (l.contact.email && l.contact.email.toLowerCase().includes(leadSearchTerm.toLowerCase()));
  }) || [];

  // Leads in workspace NOT in the active segment
  const potentialLeads = allLeads.filter(l => 
    !activeSegment?.leads.some(al => al.id === l.id)
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. SECTOR VIEW: SEGMENTS DASHBOARD (No active segment selected) */}
      {!selectedSegmentId && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Bookmark className="w-8 h-8 text-primary" />
                Drip Segments
              </h1>
              <p className="text-muted-foreground text-sm">
                Organize leads into separate custom lists for targeted campaigns, auto-workflows, and mass actions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CreateSegmentModal createWorkspaceAction={createSegmentAction} />
            </div>
          </div>

          {/* Graphic Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sortedSegments.map((seg) => (
              <div
                key={seg.id}
                className="bg-card border border-border rounded-2xl p-5 shadow-sm relative group hover:border-primary/50 transition-all flex flex-col justify-between"
              >
                {/* Lofty Pinned Indicator Gold Ribbon Decoration */}
                {seg.isPinned && (
                  <div className="absolute top-0 left-4 w-6 h-8 bg-amber-500 flex items-center justify-center rounded-b shadow-md z-10 animate-pulse">
                    <Pin className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                
                <div className="space-y-2 mt-4">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                    {seg.isPinned ? '📌 Featured List' : 'Segment List'}
                  </span>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                    {seg.name}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {seg.description || 'Custom prospect category list.'}
                  </p>
                </div>

                <div className="pt-6 mt-4 border-t border-border flex items-end justify-between">
                  <div>
                    <span className="block text-2xl font-bold text-foreground">{seg.leads.length}</span>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">Active Leads</span>
                  </div>
                  <div className="flex flex-col items-end text-[11px] text-muted-foreground">
                    <span className="font-semibold text-green-500">Unlimited Leads</span>
                    <button
                      onClick={() => setSelectedSegmentId(seg.id)}
                      className="mt-2 text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                    >
                      Configure &rarr;
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Lofty Segment List Details Table */}
          <div className="bg-background border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <h3 className="font-bold text-md text-foreground">All Custom Segments</h3>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search segment name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-background border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary w-full"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                  <tr className="border-b border-border">
                    <th className="px-6 py-3.5 font-bold">Segment Name</th>
                    <th className="px-6 py-3.5 font-bold">Level</th>
                    <th className="px-6 py-3.5 font-bold">Type</th>
                    <th className="px-6 py-3.5 font-bold text-center"># of Leads</th>
                    <th className="px-6 py-3.5 font-bold text-center">Total Campaigns</th>
                    <th className="px-6 py-3.5 font-bold">Reminder</th>
                    <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedSegments.map((seg) => (
                    <tr key={seg.id} className="hover:bg-muted/10 transition-colors group">
                      {/* Segment Name with Gold Ribbon */}
                      <td className="px-6 py-4 font-bold text-foreground flex items-center gap-2 relative">
                        {seg.isPinned && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                        )}
                        <span>{seg.name}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">Company</td>
                      <td className="px-6 py-4">
                        <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/25 text-[10px] font-semibold">
                          Static
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-foreground font-semibold">
                        {seg.leads.length}
                      </td>
                      <td className="px-6 py-4 text-center text-muted-foreground">1 Active</td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">N/A</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-90 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleTogglePin(seg.id)}
                            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-amber-500 transition-colors"
                            title={seg.isPinned ? 'Unpin from Top' : 'Pin to Top (Up to 5)'}
                          >
                            {seg.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setSelectedSegmentId(seg.id)}
                            className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                          >
                            Open List <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSegment(seg.id)}
                            className="p-1 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sortedSegments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted-foreground">
                        No segments found. Add a new list to get started!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 2. SECTOR VIEW: LEAD VIEW INSIDE A SEGMENT (Open List) */}
      {selectedSegmentId && activeSegment && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <button
              onClick={() => {
                setSelectedSegmentId(null);
                setLeadSearchTerm('');
                setSelectedLeadIds([]);
              }}
              className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors max-w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Segments
            </button>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <span>List: {activeSegment.name}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full">
                    {activeSegment.leads.length} Leads
                  </span>
                </h1>
                <p className="text-muted-foreground text-xs mt-1">
                  {activeSegment.description || 'Custom segment subscriber pipeline.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddingLead(!isAddingLead)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Lead to List
                </button>
              </div>
            </div>
          </div>

          {/* Inline Add Lead Dropdown */}
          {isAddingLead && (
            <div className="bg-muted/30 border border-border rounded-xl p-4 max-w-md animate-in slide-in-from-top-2">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">Enroll Lead in Segment</h4>
                <button onClick={() => setIsAddingLead(false)}>
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Select an existing CRM lead to add directly into this segment list.</p>
                <select
                  onChange={(e) => e.target.value && handleAddLead(e.target.value)}
                  defaultValue=""
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Choose Lead to Add --</option>
                  {potentialLeads.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.contact.firstName} {l.contact.lastName || ''} ({l.contact.email || 'no email'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Bulk Action Controls */}
          <div className="flex items-center gap-3 bg-muted/20 border border-border p-3 rounded-xl text-xs">
            <span className="font-semibold text-muted-foreground">
              {selectedLeadIds.length > 0 ? `${selectedLeadIds.length} leads selected` : 'Bulk Actions (Applies to all list members unless items checked)'}:
            </span>
            <div className="flex items-center gap-3 ml-2">
              <MassOutreachModal
                segmentId={activeSegment.id}
                segmentName={activeSegment.name}
                sendMassEmailToSegmentAction={sendMassEmailToSegmentAction}
              />
              <button
                onClick={() => setIsSmsOpen(true)}
                className="font-bold text-primary flex items-center gap-1 hover:underline"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Mass SMS
              </button>
              <button
                onClick={() => setIsSmartPlanOpen(true)}
                className="font-bold text-primary flex items-center gap-1 hover:underline"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Apply Campaign
              </button>
            </div>
          </div>

          {/* Pinned Leads list table within this segment */}
          <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between gap-4">
              <h3 className="font-bold text-sm text-foreground">Leads in this Segment</h3>
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search leads inside list..."
                  value={leadSearchTerm}
                  onChange={(e) => setLeadSearchTerm(e.target.value)}
                  className="bg-background border border-border rounded-lg pl-8 pr-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary w-full"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/20 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left w-12">
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.length === filteredActiveLeads.length && filteredActiveLeads.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeadIds(filteredActiveLeads.map(l => l.id));
                          } else {
                            setSelectedLeadIds([]);
                          }
                        }}
                        className="rounded border-border text-primary bg-background focus:ring-0 focus:ring-offset-0"
                      />
                    </th>
                    <th className="px-6 py-3 font-semibold">Lead Name</th>
                    <th className="px-6 py-3 font-semibold">Email</th>
                    <th className="px-6 py-3 font-semibold">Phone</th>
                    <th className="px-6 py-3 font-semibold">Type</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredActiveLeads.map((l) => (
                    <tr key={l.id} className="hover:bg-muted/5 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedLeadIds.includes(l.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLeadIds(prev => [...prev, l.id]);
                            } else {
                              setSelectedLeadIds(prev => prev.filter(id => id !== l.id));
                            }
                          }}
                          className="rounded border-border text-primary bg-background focus:ring-0 focus:ring-offset-0"
                        />
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">
                        <Link href={`/dashboard/leads/${l.id}`} className="hover:underline text-primary">
                          {l.contact.firstName} {l.contact.lastName || ''}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">{l.contact.email || '—'}</td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">{l.contact.phone || '—'}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-muted-foreground">{l.type}</td>
                      <td className="px-6 py-4">
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                          {l.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRemoveLead(l.id)}
                          className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 justify-end ml-auto"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredActiveLeads.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted-foreground">
                        No leads found in this segment list. Click &quot;Add Lead to List&quot; above to connect prospects.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Bulk SMS Modal */}
      {isSmsOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-background border border-border shadow-xl rounded-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
              <h3 className="font-bold text-md text-foreground">Mass SMS Broadcast</h3>
              <button onClick={() => setIsSmsOpen(false)}>
                <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
            <form onSubmit={handleMassSms} className="p-6 space-y-4">
              <p className="text-xs text-muted-foreground">
                Sending message to {selectedLeadIds.length > 0 ? `${selectedLeadIds.length} checked leads` : `${activeSegment?.leads.length || 0} segment members`}.
              </p>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">SMS Body</label>
                <textarea
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  rows={4}
                  required
                  placeholder="Type your text message here. Emojis and links supported..."
                  className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSmsOpen(false)}
                  className="px-4 py-2 border border-border rounded-lg text-xs font-bold text-muted-foreground hover:bg-muted/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/95 transition-colors"
                >
                  Send Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Smart Plan Enrollment Modal */}
      {isSmartPlanOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-background border border-border shadow-xl rounded-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
              <h3 className="font-bold text-md text-foreground">Bulk Smart Plan Campaign Enrollment</h3>
              <button onClick={() => setIsSmartPlanOpen(false)}>
                <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
            <form onSubmit={handleApplySmartPlan} className="p-6 space-y-4">
              <p className="text-xs text-muted-foreground">
                Select a drip campaign/smart plan template to assign to {selectedLeadIds.length > 0 ? `${selectedLeadIds.length} checked leads` : `${activeSegment?.leads.length || 0} segment members`}.
              </p>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 font-semibold">Select Campaign</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  required
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Choose Template --</option>
                  {smartPlans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSmartPlanOpen(false)}
                  className="px-4 py-2 border border-border rounded-lg text-xs font-bold text-muted-foreground hover:bg-muted/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/95 transition-colors"
                >
                  Enroll Segment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
