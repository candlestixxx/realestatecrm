'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import AddTaskModal from './AddTaskModal';
import AddLeadModal from './AddLeadModal';
import { addTaskAction } from '@/lib/actions/task';
import { bulkEnrollLeadsInCampaignAction } from '@/lib/actions/campaign';
import { deleteLeadAction, importLeadsBulkAction, assignLeadAction, enrollLeadInSmartPlanAction, updateLeadTagsAction, bulkUpdateLeadTagsAction, bulkAssignLeadAction, bulkDeleteLeadAction } from '@/lib/actions/lead';
import { addLeadsToSegmentBulkAction } from '@/lib/actions/segment';

type LeadRow = {
  id: string;
  status: string;
  score: number | null;
  source: string | null;
  isAiAssisted: boolean;
  tags?: string | null;
  userId?: string | null;
  contact: {
    firstName: string;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    address?: string | null;
    additionalPhones?: string | null;
    additionalEmails?: string | null;
    spouseName?: string | null;
    spousePhone?: string | null;
    spouseEmail?: string | null;
    familyMembers?: string | null;
  };
};

// ---------------------------------------------------------------------------
// Per-row Quick Actions Dropdown
// ---------------------------------------------------------------------------
function LeadQuickMenu({
  lead,
  users,
  campaigns,
  workspaces,
  onRefresh,
  triggerMode = 'more',
}: {
  lead: LeadRow;
  users: { id: string; name: string | null; email: string | null }[];
  campaigns: { id: string; name: string }[];
  workspaces: { id: string; name: string }[];
  onRefresh: () => void;
  triggerMode?: 'more' | 'tag';
}) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<'main' | 'assign' | 'tags' | 'smartplan' | 'ai'>(triggerMode === 'tag' ? 'tags' : 'main');
  const [tagInput, setTagInput] = useState(lead.tags || '');
  const [isSaving, setIsSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const openMenu = () => {
    setTagInput(lead.tags || '');
    setPanel(triggerMode === 'tag' ? 'tags' : 'main');
    setOpen(o => !o);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setPanel('main');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleAssign = async (userId: string | null) => {
    setIsSaving(true);
    const res = await assignLeadAction(lead.id, userId);
    setIsSaving(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(userId ? 'Lead assigned!' : 'Lead unassigned.');
      setOpen(false);
      setPanel('main');
      onRefresh();
    }
  };

  const handleSaveTags = async () => {
    setIsSaving(true);
    const res = await updateLeadTagsAction(lead.id, tagInput);
    setIsSaving(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Tags saved!');
      setOpen(false);
      setPanel('main');
      onRefresh();
    }
  };

  const handleEnrollSmartPlan = async (smartPlanId: string) => {
    setIsSaving(true);
    const res = await enrollLeadInSmartPlanAction(lead.id, smartPlanId);
    setIsSaving(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Enrolled in Smart Plan!');
      setOpen(false);
      setPanel('main');
      onRefresh();
    }
  };

  const assignedUser = users.find(u => u.id === lead.userId);

  return (
    <div className="relative" ref={menuRef}>
      {triggerMode === 'tag' ? (
        <button
          onClick={openMenu}
          className="px-1.5 py-0.5 text-[9px] font-bold rounded border border-dashed border-muted-foreground/40 text-muted-foreground hover:border-primary hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
          title="Add tags"
        >
          + Tag
        </button>
      ) : (
        <button
          onClick={openMenu}
          className="px-2.5 py-1.5 bg-muted/60 text-foreground hover:bg-muted border border-border rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1"
          title="More Actions"
        >
          <span>More</span>
          <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {open && (
        <div className="absolute right-0 mt-1 z-50 w-56 bg-background border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1">
          {panel === 'main' && (
            <div className="py-1">
              {/* Assign Agent */}
              <button
                onClick={() => setPanel('assign')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-muted/60 transition-colors text-left"
              >
                <span className="text-base">👤</span>
                <div className="flex flex-col flex-1">
                  <span className="font-semibold">Assign Agent</span>
                  <span className="text-[10px] text-muted-foreground">
                    {assignedUser ? (assignedUser.name || assignedUser.email || 'Assigned') : 'Unassigned'}
                  </span>
                </div>
                <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Tags / Hashtags */}
              <button
                onClick={() => { setTagInput(lead.tags || ''); setPanel('tags'); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-muted/60 transition-colors text-left"
              >
                <span className="text-base">#️⃣</span>
                <div className="flex flex-col flex-1">
                  <span className="font-semibold">Hashtags / Tags</span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                    {lead.tags ? lead.tags : 'No tags yet'}
                  </span>
                </div>
                <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Smart Plan */}
              <button
                onClick={() => setPanel('smartplan')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-muted/60 transition-colors text-left"
              >
                <span className="text-base">🤖</span>
                <div className="flex flex-col flex-1">
                  <span className="font-semibold">Add Smart Plan</span>
                  <span className="text-[10px] text-muted-foreground">Enroll in drip campaign</span>
                </div>
                <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* AI Assistant */}
              <button
                onClick={() => {
                  setOpen(false);
                  router.push(`/dashboard/leads/${lead.id}?tab=ai`);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-amber-500/10 text-amber-600 transition-colors text-left"
              >
                <span className="text-base">✨</span>
                <div className="flex flex-col flex-1">
                  <span className="font-semibold">AI Assistant</span>
                  <span className="text-[10px] text-amber-500/80">Open AI analysis</span>
                </div>
              </button>

              <div className="border-t border-border my-1" />

              {/* Delete */}
              <button
                onClick={async () => {
                  setOpen(false);
                  if (confirm(`Delete "${lead.contact.firstName} ${lead.contact.lastName || ''}"?`)) {
                    const res = await deleteLeadAction(lead.id);
                    if (res?.error) toast.error(res.error);
                    else { toast.success('Lead deleted.'); onRefresh(); }
                  }
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-red-500/10 text-red-500 transition-colors text-left"
              >
                <span className="text-base">🗑️</span>
                <span className="font-semibold">Delete Lead</span>
              </button>
            </div>
          )}

          {panel === 'assign' && (
            <div>
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                <button onClick={() => setPanel('main')} className="text-muted-foreground hover:text-foreground">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xs font-bold">Assign to Agent</span>
              </div>
              <div className="py-1 max-h-52 overflow-y-auto">
                <button
                  onClick={() => handleAssign(null)}
                  disabled={isSaving}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-muted/60 transition-colors text-left ${
                    !lead.userId ? 'text-primary font-bold' : ''
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">—</span>
                  <span>Unassigned</span>
                  {!lead.userId && <span className="ml-auto text-primary">✓</span>}
                </button>
                {users.map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleAssign(user.id)}
                    disabled={isSaving}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-muted/60 transition-colors text-left ${
                      lead.userId === user.id ? 'text-primary font-bold' : ''
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold uppercase"
                    >
                      {(user.name || user.email || '?')[0]}
                    </span>
                    <span>{user.name || user.email || 'Agent'}</span>
                    {lead.userId === user.id && <span className="ml-auto text-primary">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {panel === 'tags' && (
            <div>
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                <button onClick={() => setPanel('main')} className="text-muted-foreground hover:text-foreground">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xs font-bold">Hashtags / Tags</span>
              </div>
              <div className="p-3 space-y-2">
                <p className="text-[10px] text-muted-foreground">Separate tags with commas. Use # prefix or not.</p>
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  placeholder="e.g. #hot, #investor, #june-2025"
                  className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveTags(); }}
                  autoFocus
                />
                {/* Quick-add chips */}
                <div className="flex flex-wrap gap-1">
                  {['#hot', '#warm', '#cold', '#investor', '#cash-buyer', '#motivated'].map(chip => (
                    <button
                      key={chip}
                      onClick={() => {
                        const current = tagInput.split(',').map(t => t.trim()).filter(Boolean);
                        if (!current.includes(chip)) {
                          setTagInput([...current, chip].join(', '));
                        }
                      }}
                      className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setPanel('main')}
                    className="flex-1 px-2 py-1.5 bg-muted border border-border rounded text-[10px] hover:bg-muted/80"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTags}
                    disabled={isSaving}
                    className="flex-1 px-2 py-1.5 bg-primary text-primary-foreground rounded text-[10px] font-bold hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Tags'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {panel === 'smartplan' && (
            <div>
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                <button onClick={() => setPanel('main')} className="text-muted-foreground hover:text-foreground">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xs font-bold">Add Smart Plan</span>
              </div>
              <div className="py-1 max-h-52 overflow-y-auto">
                {campaigns.length === 0 ? (
                  <p className="px-3 py-4 text-xs text-muted-foreground text-center">No Smart Plans found.</p>
                ) : (
                  campaigns.map(camp => (
                    <button
                      key={camp.id}
                      onClick={() => handleEnrollSmartPlan(camp.id)}
                      disabled={isSaving}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-muted/60 transition-colors text-left"
                    >
                      <span className="text-base">🤖</span>
                      <span className="font-medium">{camp.name}</span>
                      <span className="ml-auto text-[10px] text-primary">Enroll →</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function LeadTableClient({
  initialLeads,
  totalCount: serverTotalCount,
  currentPage: serverCurrentPage,
  pageSize: serverPageSize,
  workspaces,
  users,
  segments = [],
  campaigns = [],
  addLeadAction,
  currentUserId,
}: {
  addLeadAction: (formData: FormData) => Promise<{ success?: boolean; error?: string }>;
  currentUserId?: string;
  initialLeads: LeadRow[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  workspaces: { id: string; name: string }[];
  users: { id: string; name: string | null; email: string | null }[];
  segments?: { id: string; name: string }[];
  campaigns?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Custom view and filter states
  const [activeView, setActiveView] = useState('All Leads');
  const [customViews, setCustomViews] = useState<{name: string, filters: any}[]>([]);
  const [activeStatus, setActiveStatus] = useState('ALL');
  const [ownerMode, setOwnerMode] = useState('ALL'); // 'ALL' | 'COMPANY' | 'PRIVATE'
  const [searchQuery, setSearchQuery] = useState('');
  
  // All Filters Sidebar States
  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [filterAddress, setFilterAddress] = useState('');
  const [filterOwner, setFilterOwner] = useState('ALL');
  const [filterAgent, setFilterAgent] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterSource, setFilterSource] = useState('ALL');
  const [filterTags, setFilterTags] = useState('');
  const [filterMinScore, setFilterMinScore] = useState('');

  // Three dots menu state
  const [showThreeDotsMenu, setShowThreeDotsMenu] = useState(false);
  const threeDotsRef = useRef<HTMLDivElement>(null);
  
  // Custom view creation modal state
  const [showCustomViewModal, setShowCustomViewModal] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  // Collapsed sections in sidebar
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    address: true,
    owner: false,
    agent: false,
    type: false,
    source: false,
    tags: true,
    score: true,
  });

  // Client-side pagination state overrides
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load custom views on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('crm_custom_views');
      if (saved) {
        setCustomViews(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  // Close three dots menu on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (threeDotsRef.current && !threeDotsRef.current.contains(e.target as Node)) {
        setShowThreeDotsMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Filtering Logic
  const displayLeads = initialLeads.filter(lead => {
    // 1. Owner Mode Filter
    if (ownerMode === 'COMPANY' && lead.userId) return false;
    if (ownerMode === 'PRIVATE' && !lead.userId) return false;

    // 2. Active View Filter
    if (activeView === 'My Leads' && lead.userId !== currentUserId) return false;
    if (activeView === 'Priorities' && (lead.score === null || lead.score <= 70)) return false;
    if (activeView === 'Expired' && (!lead.tags || !lead.tags.toLowerCase().includes('expired'))) return false;
    if (activeView === 'Preforeclosure' && lead.status !== 'PREFORECLOSURE' && (!lead.source || !lead.source.toLowerCase().includes('foreclosure'))) return false;
    
    // Custom Saved Views
    const customView = customViews.find(v => v.name === activeView);
    if (customView) {
      const f = customView.filters;
      if (f.address && (!lead.contact.address || !lead.contact.address.toLowerCase().includes(f.address.toLowerCase()))) return false;
      if (f.owner && f.owner !== 'ALL' && lead.userId !== f.owner) return false;
      if (f.agent && f.agent !== 'ALL' && lead.userId !== f.agent) return false;
      if (f.type && f.type !== 'ALL' && lead.contact.spouseName !== f.type) return false; // type map
      if (f.source && f.source !== 'ALL' && lead.source !== f.source) return false;
      if (f.tags && (!lead.tags || !lead.tags.toLowerCase().includes(f.tags.toLowerCase()))) return false;
      if (f.minScore && (lead.score === null || lead.score < Number(f.minScore))) return false;
    }

    // 3. Active Status Chip
    if (activeStatus !== 'ALL' && lead.status !== activeStatus) return false;

    // 4. Main & Sidebar Text Search
    const searchVal = (searchQuery || sidebarSearch).toLowerCase();
    if (searchVal) {
      const fn = (lead.contact.firstName || '').toLowerCase();
      const ln = (lead.contact.lastName || '').toLowerCase();
      const email = (lead.contact.email || '').toLowerCase();
      const phone = (lead.contact.phone || '').toLowerCase();
      const addr = (lead.contact.address || '').toLowerCase();
      const tags = (lead.tags || '').toLowerCase();
      if (!fn.includes(searchVal) && !ln.includes(searchVal) && !email.includes(searchVal) && !phone.includes(searchVal) && !addr.includes(searchVal) && !tags.includes(searchVal)) {
        return false;
      }
    }

    // 5. Sidebar Collapsible Filters
    if (filterAddress && (!lead.contact.address || !lead.contact.address.toLowerCase().includes(filterAddress.toLowerCase()))) return false;
    if (filterOwner !== 'ALL' && lead.userId !== filterOwner) return false;
    if (filterAgent !== 'ALL' && lead.userId !== filterAgent) return false;
    if (filterType !== 'ALL' && lead.status !== filterType) return false; // Type matching
    if (filterSource !== 'ALL' && lead.source !== filterSource) return false;
    if (filterTags && (!lead.tags || !lead.tags.toLowerCase().includes(filterTags.toLowerCase()))) return false;
    if (filterMinScore && (lead.score === null || lead.score < Number(filterMinScore))) return false;

    return true;
  });

  const totalCount = displayLeads.length;

  const handleCreateCustomView = () => {
    if (!newViewName.trim()) return;
    const newView = {
      name: newViewName.trim(),
      filters: {
        address: filterAddress,
        owner: filterOwner,
        agent: filterAgent,
        type: filterType,
        source: filterSource,
        tags: filterTags,
        minScore: filterMinScore
      }
    };
    const next = [...customViews.filter(v => v.name !== newView.name), newView];
    setCustomViews(next);
    localStorage.setItem('crm_custom_views', JSON.stringify(next));
    setActiveView(newView.name);
    setNewViewName('');
    setShowCustomViewModal(false);
    toast.success(`Custom View "${newView.name}" created!`);
  };

  const handleDeleteCustomView = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = customViews.filter(v => v.name !== name);
    setCustomViews(next);
    localStorage.setItem('crm_custom_views', JSON.stringify(next));
    if (activeView === name) {
      setActiveView('All Leads');
    }
    toast.success(`Custom View "${name}" deleted.`);
  };

  // Pipeline chip count functions
  const countByStatus = (status: string) => {
    return initialLeads.filter(l => {
      if (ownerMode === 'COMPANY' && l.userId) return false;
      if (ownerMode === 'PRIVATE' && !l.userId) return false;
      if (activeView === 'My Leads' && l.userId !== currentUserId) return false;
      if (status === 'ALL') return true;
      return l.status === status;
    }).length;
  };

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState('');
  const [activeAssignee, setActiveAssignee] = useState('');
  const [activeCampaign, setActiveCampaign] = useState('');
  const [activeSegment, setActiveSegment] = useState('');

  // Restore and save page limit (pageSize) in localStorage to preserve selection on back navigation
  useEffect(() => {
    const urlLimit = searchParams.get('limit');
    if (urlLimit) {
      localStorage.setItem('crm_leads_page_size', urlLimit);
    } else {
      const savedLimit = localStorage.getItem('crm_leads_page_size');
      if (savedLimit && savedLimit !== String(pageSize)) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('limit', savedLimit);
        router.replace(`?${params.toString()}`);
      }
    }
  }, [searchParams, pageSize, router]);
  // (bulk action pending state removed - now handled per-action)

  // CSV Import States
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [importSegmentId, setImportSegmentId] = useState('');
  const [importSegmentName, setImportSegmentName] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // AI Intake States
  const [showAiIntakeModal, setShowAiIntakeModal] = useState(false);
  const [aiIntakeText, setAiIntakeText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedLeadData, setParsedLeadData] = useState<any>(null);
  const [aiSegmentId, setAiSegmentId] = useState('');
  const [aiSegmentName, setAiSegmentName] = useState('');

  const handleCsvFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length === 0) {
        toast.error('The selected CSV file is empty.');
        return;
      }

      const parseCsvLine = (line: string) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const parsedHeaders = parseCsvLine(lines[0]);
      const parsedRows = lines.slice(1).map(line => parseCsvLine(line));

      setCsvHeaders(parsedHeaders);
      setCsvRows(parsedRows);

      const mappings: Record<string, string> = {};
      const targetFields = [
        'firstName', 'lastName', 'email', 'phone', 'type', 'source', 'tags', 'notes', 'address',
        'additionalPhones', 'additionalEmails', 'spouseName', 'spousePhone', 'spouseEmail', 'familyMembers'
      ];
      
      targetFields.forEach(field => {
        const fieldLower = field.toLowerCase();
        const matchedIdx = parsedHeaders.findIndex(header => {
          const hLower = header.toLowerCase();
          return hLower === fieldLower || 
                 hLower.includes(fieldLower) || 
                 (field === 'firstName' && (hLower.includes('first') || hLower.includes('fname') || hLower === 'name')) ||
                 (field === 'lastName' && (hLower.includes('last') || hLower.includes('lname'))) ||
                 (field === 'phone' && (hLower.includes('cell') || hLower.includes('mobile') || hLower.includes('tel') || hLower.includes('phone'))) ||
                 (field === 'additionalPhones' && (hLower.includes('phone 2') || hLower.includes('phone2') || hLower.includes('other phone') || hLower.includes('secondary phone'))) ||
                 (field === 'additionalEmails' && (hLower.includes('email 2') || hLower.includes('email2') || hLower.includes('other email') || hLower.includes('secondary email'))) ||
                 (field === 'spouseName' && (hLower.includes('spouse name') || hLower.includes('spouse_name') || hLower.includes('partner') || hLower.includes('husband') || hLower.includes('wife'))) ||
                 (field === 'spousePhone' && (hLower.includes('spouse phone') || hLower.includes('spouse cell'))) ||
                 (field === 'spouseEmail' && hLower.includes('spouse email')) ||
                 (field === 'familyMembers' && (hLower.includes('family') || hLower.includes('relative') || hLower.includes('child')));
        });
        if (matchedIdx !== -1) {
          mappings[field] = String(matchedIdx);
        } else {
          mappings[field] = '';
        }
      });

      setFieldMappings(mappings);
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    if (isImporting) return;
    setIsImporting(true);

    try {
      const leadsToImport = csvRows.map(row => {
        const getVal = (field: string) => {
          const idx = fieldMappings[field];
          if (idx === '' || idx === undefined) return '';
          return row[Number(idx)] || '';
        };

        return {
          firstName: getVal('firstName') || 'Imported',
          lastName: getVal('lastName'),
          email: getVal('email'),
          phone: getVal('phone'),
          status: 'NEW',
          type: (getVal('type').toUpperCase().includes('SELL') ? 'SELLER' : 'BUYER') as 'BUYER' | 'SELLER',
          source: getVal('source') || 'CSV Import',
          tags: getVal('tags'),
          notes: getVal('notes'),
          address: getVal('address'),
          additionalPhones: getVal('additionalPhones'),
          additionalEmails: getVal('additionalEmails'),
          spouseName: getVal('spouseName'),
          spousePhone: getVal('spousePhone'),
          spouseEmail: getVal('spouseEmail'),
          familyMembers: getVal('familyMembers'),
        };
      }).filter(l => l.firstName.trim().length > 0);

      if (leadsToImport.length === 0) {
        toast.error('No valid leads found to import.');
        setIsImporting(false);
        return;
      }

      const res = await importLeadsBulkAction(
        leadsToImport,
        importSegmentId || undefined,
        importSegmentName || undefined
      );

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Successfully imported ${res.imported} leads!`);
        setShowCsvImportModal(false);
        setCsvHeaders([]);
        setCsvRows([]);
        setImportSegmentId('');
        setImportSegmentName('');
        router.refresh();
      }
    } catch (err) {
      toast.error('Failed to import leads.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportCSV = () => {
    if (initialLeads.length === 0) {
      toast.error('No leads to export.');
      return;
    }

    const headers = [
      'First Name', 'Last Name', 'Email', 'Phone', 'Status', 'Type', 'Source', 'Tags', 'Address',
      'Additional Phones', 'Additional Emails', 'Spouse Name', 'Spouse Phone', 'Spouse Email', 'Family Members'
    ];
    const csvRowsData = initialLeads.map(l => [
      l.contact.firstName,
      l.contact.lastName || '',
      l.contact.email || '',
      l.contact.phone || '',
      l.status,
      l.status === 'PREFORECLOSURE' ? 'SELLER' : 'BUYER',
      l.source || '',
      l.tags || '',
      l.contact.address || '',
      l.contact.additionalPhones ? (() => {
        try {
          const parsed = JSON.parse(l.contact.additionalPhones);
          return Array.isArray(parsed) ? parsed.map((p: any) => typeof p === 'string' ? p : `${p.label || 'Alt'}: ${p.value}`).join('; ') : l.contact.additionalPhones;
        } catch {
          return l.contact.additionalPhones;
        }
      })() : '',
      l.contact.additionalEmails ? (() => {
        try {
          const parsed = JSON.parse(l.contact.additionalEmails);
          return Array.isArray(parsed) ? parsed.map((e: any) => typeof e === 'string' ? e : `${e.label || 'Alt'}: ${e.value}`).join('; ') : l.contact.additionalEmails;
        } catch {
          return l.contact.additionalEmails;
        }
      })() : '',
      l.contact.spouseName || '',
      l.contact.spousePhone || '',
      l.contact.spouseEmail || '',
      l.contact.familyMembers || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvRowsData.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `crm_leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Leads exported successfully!');
  };

  const handleAiParse = async () => {
    if (!aiIntakeText.trim()) return;
    setIsParsing(true);
    setParsedLeadData(null);

    try {
      const res = await fetch('/api/leads/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiIntakeText }),
      });
      const data = await res.json();

      if (data.success) {
        setParsedLeadData(data.data);
        toast.success('Lead details parsed successfully by AI Agent!');
      } else {
        toast.error(data.error || 'Failed to parse text.');
      }
    } catch (err) {
      toast.error('Failed to parse text via AI.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleAiImportSubmit = async () => {
    if (!parsedLeadData) return;
    setIsImporting(true);

    try {
      const res = await importLeadsBulkAction(
        [
          {
            firstName: parsedLeadData.firstName || 'Imported',
            lastName: parsedLeadData.lastName,
            email: parsedLeadData.email,
            phone: parsedLeadData.phone,
            status: 'NEW',
            type: parsedLeadData.type,
            source: parsedLeadData.source || 'AI Ingestion',
            tags: parsedLeadData.tags,
            notes: parsedLeadData.notes,
            address: parsedLeadData.address,
          }
        ],
        aiSegmentId || undefined,
        aiSegmentName || undefined
      );

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Lead parsed and saved successfully!');
        setShowAiIntakeModal(false);
        setAiIntakeText('');
        setParsedLeadData(null);
        setAiSegmentId('');
        setAiSegmentName('');
        router.refresh();
      }
    } catch (err) {
      toast.error('Failed to save lead.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(initialLeads.map((l) => l.id)));
    } else {
      setSelectedIds(new Set());
      setSelectAllMode(false);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedIds(newSet);
  };

  const handlePageSizeChange = (newSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('limit', String(newSize));
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  // Select-all-pages mode
  const [selectAllMode, setSelectAllMode] = useState(false);
  const [showPageSizeMenu, setShowPageSizeMenu] = useState(false);
  const [customPageSize, setCustomPageSize] = useState('');
  const pageSizeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPageSizeMenu) return;
    const handler = (e: MouseEvent) => {
      if (pageSizeMenuRef.current && !pageSizeMenuRef.current.contains(e.target as Node)) {
        setShowPageSizeMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPageSizeMenu]);

  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);

  // Lofty-style toolbar More dropdown state
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showBulkAssignPanel, setShowBulkAssignPanel] = useState(false);
  const [showBulkTagPanel, setShowBulkTagPanel] = useState(false);
  const [bulkTagInput, setBulkTagInput] = useState('');
  const [isBulkTagSaving, setIsBulkTagSaving] = useState(false);
  const [isBulkAssigning, setIsBulkAssigning] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMoreMenu) return;
    const handler = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMoreMenu]);

  const handleBulkAssign = async (userId: string | null) => {
    if (selectedIds.size === 0) { toast.error('Select at least one lead.'); return; }

    // Check if we need a full-database query instead (if selectAllMode is true)
    if (selectAllMode) {
      toast.error('Bulk assigning across all pages is coming soon. For now, please assign one page at a time by setting Per Page to "Show all".');
      return;
    }

    setIsBulkAssigning(true);
    const ids = Array.from(selectedIds);
    const res = await bulkAssignLeadAction(ids, userId);
    setIsBulkAssigning(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Assigned ${ids.length} lead(s).`);
      setShowBulkAssignPanel(false);
      setSelectedIds(new Set());
      router.refresh();
    }
  };

  const handleBulkChangeTags = async () => {
    if (selectedIds.size === 0) { toast.error('Select at least one lead.'); return; }

    if (selectAllMode) {
      toast.error('Bulk tagging across all pages is coming soon. For now, please tag one page at a time by setting Per Page to "Show all".');
      return;
    }

    setIsBulkTagSaving(true);
    const ids = Array.from(selectedIds);
    const res = await bulkUpdateLeadTagsAction(ids, bulkTagInput);
    setIsBulkTagSaving(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Tags updated for ${ids.length} lead(s).`);
      setShowBulkTagPanel(false);
      setBulkTagInput('');
      setSelectedIds(new Set());
      router.refresh();
    }
  };

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
    <div className="flex relative min-h-screen bg-background">
      {/* Main Leads Pane */}
      <div className="flex-1 space-y-4 p-6 transition-all duration-300">
        
        {/* CRM Header - Add Lead, 3-dots, and Filters Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              Leads
              <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                {totalCount} total
              </span>
            </h1>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">Manage your incoming leads and prospects.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <AddLeadModal addLeadAction={addLeadAction} workspaces={workspaces} />
            
            {/* Three Dots Import/Export Dropdown */}
            <div className="relative" ref={threeDotsRef}>
              <button
                onClick={() => setShowThreeDotsMenu(prev => !prev)}
                className="p-2 border border-border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                title="More Ingestion Options"
              >
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
              </button>
              
              {showThreeDotsMenu && (
                <div className="absolute right-0 top-full mt-2.5 z-50 w-52 bg-card border border-border/80 rounded-2xl shadow-xl overflow-hidden py-2 animate-fadeIn text-xs font-semibold text-muted-foreground">
                  <p className="px-3 pb-1.5 text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest border-b border-border/40">Leads Actions</p>
                  <button
                    onClick={() => { setShowCsvImportModal(true); setShowThreeDotsMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-muted/60 transition-colors text-left"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    <span>Import CSV File</span>
                  </button>
                  <button
                    onClick={() => { handleExportCSV(); setShowThreeDotsMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-muted/60 transition-colors text-left"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    <span>Export CSV File</span>
                  </button>
                  <button
                    onClick={() => { setShowAiIntakeModal(true); setShowThreeDotsMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-muted/60 transition-colors text-left text-amber-600 hover:text-amber-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    <span>✨ AI Lead Ingest</span>
                  </button>
                </div>
              )}
            </div>

            {/* All Filters Toggle Sidebar Button */}
            <button
              onClick={() => setShowFiltersSidebar(prev => !prev)}
              className={`px-4.5 py-2.5 border rounded-xl flex items-center gap-2 transition-all font-black uppercase text-[10px] tracking-widest cursor-pointer ${
                showFiltersSidebar || displayLeads.length !== initialLeads.length
                  ? 'bg-primary text-primary-foreground border-primary shadow-md'
                  : 'bg-background hover:bg-muted text-foreground border-border'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              <span>Filters ({displayLeads.length !== initialLeads.length ? 'Active' : '0'})</span>
            </button>
          </div>
        </div>

        {/* Lofty Quick View Tabs and Company Leads Dropdown */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-3 text-xs font-semibold text-muted-foreground overflow-x-auto">
          <div className="flex items-center gap-2">
            {/* Company Leads Toggle dropdown */}
            <select
              value={ownerMode}
              onChange={(e) => { setOwnerMode(e.target.value); setCurrentPage(1); }}
              className="bg-muted hover:bg-muted/80 border-none rounded-xl px-3 py-2 text-foreground font-black uppercase text-[10px] tracking-widest focus:outline-none cursor-pointer"
            >
              <option value="ALL">🏢 All Owned Leads</option>
              <option value="COMPANY">🏢 Company Leads</option>
              <option value="PRIVATE">🔒 Private Leads</option>
            </select>

            {/* Quick Views */}
            <div className="flex items-center gap-1.5 ml-2">
              {['All Leads', 'My Leads', 'Priorities', 'Expired', 'Preforeclosure'].map(view => (
                <button
                  key={view}
                  onClick={() => { setActiveView(view); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeView === view
                      ? 'bg-primary/15 text-primary font-bold'
                      : 'hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {view}
                </button>
              ))}

              {/* Custom views */}
              {customViews.map(view => (
                <div
                  key={view.name}
                  onClick={() => { setActiveView(view.name); setCurrentPage(1); }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeView === view.name
                      ? 'bg-primary/15 text-primary font-bold'
                      : 'hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <span>{view.name}</span>
                  <span
                    onClick={(e) => handleDeleteCustomView(view.name, e)}
                    className="text-muted-foreground/60 hover:text-red-500 font-bold ml-1 text-xs"
                    title="Delete View"
                  >
                    ×
                  </span>
                </div>
              ))}

              {/* Add Custom View Button */}
              <button
                onClick={() => setShowCustomViewModal(true)}
                className="px-2.5 py-1.5 border border-dashed border-border hover:border-muted-foreground/40 rounded-lg hover:text-foreground flex items-center gap-1 transition-all cursor-pointer text-[10px] font-black uppercase tracking-wider"
              >
                <span>+ View</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pipeline Stage Chips with count badges */}
        <div className="flex flex-wrap items-center gap-2 py-2">
          {[
            { id: 'ALL', label: 'All Leads' },
            { id: 'NEW', label: 'New Leads' },
            { id: 'PROSPECTING', label: 'Attempting Contact' },
            { id: 'CONTACTED', label: 'Nurturing/Cold' },
            { id: 'QUALIFIED', label: 'Warm/Hot' },
          ].map(chip => {
            const count = countByStatus(chip.id);
            return (
              <button
                key={chip.id}
                onClick={() => { setActiveStatus(chip.id); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeStatus === chip.id
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{chip.label}</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  activeStatus === chip.id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sync/Action Toolbar for selection actions */}
        {selectedIds.size > 0 && (
          <div className="p-3 border border-indigo-500/20 bg-indigo-500/5 rounded-2xl flex items-center justify-between animate-fadeIn text-xs font-bold text-foreground">
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center font-black text-[10px]">
                {selectedIds.size}
              </span>
              <span>Leads Selected</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => bulkAction('Assign')}
                className="px-3 py-1.5 bg-background border border-border hover:bg-muted rounded-xl transition-all cursor-pointer"
              >
                👤 Assign
              </button>
              <button
                onClick={() => bulkAction('Tags')}
                className="px-3 py-1.5 bg-background border border-border hover:bg-muted rounded-xl transition-all cursor-pointer"
              >
                🏷️ Tags
              </button>
              <button
                onClick={() => bulkAction('Enroll Smart Plan')}
                className="px-3 py-1.5 bg-background border border-border hover:bg-muted rounded-xl transition-all cursor-pointer"
              >
                🤖 Smart Plan
              </button>
              <button
                onClick={() => bulkAction('Delete')}
                className="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/15 rounded-xl transition-all cursor-pointer border border-red-500/20"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        )}

        {/* Lead Rows Table */}
        <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                <tr>
                  <th className="px-4 py-3.5 font-medium w-10">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedIds.size === displayLeads.length && displayLeads.length > 0}
                      className="rounded border-border cursor-pointer accent-primary"
                    />
                  </th>
                  <th className="px-4 py-3.5 font-bold">Name</th>
                  <th className="px-4 py-3.5 font-bold">Contact Info</th>
                  <th className="px-4 py-3.5 font-bold">Pipeline</th>
                  <th className="px-4 py-3.5 font-bold">Tags</th>
                  <th className="px-4 py-3.5 font-bold">Owner</th>
                  <th className="px-4 py-3.5 font-bold">Agent</th>
                  <th className="px-4 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {displayLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((lead) => {
                  const assignedUser = users.find(u => u.id === lead.userId);
                  return (
                    <tr key={lead.id} className={`hover:bg-muted/10 transition-colors group ${selectedIds.has(lead.id) ? 'bg-primary/5' : ''}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(lead.id)}
                          onChange={(e) => handleSelectOne(lead.id, e.target.checked)}
                          className="rounded border-border text-primary cursor-pointer accent-primary"
                        />
                      </td>

                      {/* Name + lead type badge */}
                      <td className="px-4 py-3 font-semibold">
                        <div className="flex flex-col">
                          <Link
                            href={`/dashboard/leads/${lead.id}`}
                            className="hover:text-primary hover:underline font-extrabold text-foreground transition-colors text-sm"
                          >
                            {lead.contact?.firstName} {lead.contact?.lastName}
                          </Link>
                          <span className="text-[10px] text-muted-foreground font-medium mt-0.5 uppercase tracking-wider block">
                            {lead.status === 'PREFORECLOSURE' ? 'Seller' : 'Buyer'}
                          </span>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                        <div className="flex flex-col gap-0.5">
                          {lead.contact?.email && <span className="text-foreground">{lead.contact.email}</span>}
                          {lead.contact?.phone && <span>{lead.contact.phone}</span>}
                        </div>
                      </td>

                      {/* Pipeline Status */}
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          lead.status === 'NEW' ? 'bg-blue-500/10 text-blue-500' :
                          lead.status === 'PROSPECTING' ? 'bg-amber-500/10 text-amber-500' :
                          lead.status === 'CONTACTED' ? 'bg-emerald-500/10 text-emerald-500' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {lead.status}
                        </span>
                      </td>

                      {/* Tags */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {(lead.tags || '').split(',').filter(Boolean).map(t => (
                            <span key={t} className="bg-primary/5 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded">
                              {t.trim()}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="px-4 py-3 text-xs font-bold text-muted-foreground">
                        {assignedUser ? assignedUser.name || assignedUser.email : 'Company-Owned'}
                      </td>

                      {/* Agent */}
                      <td className="px-4 py-3 text-xs font-bold text-muted-foreground">
                        {assignedUser ? assignedUser.name || 'Unassigned' : 'Excel Legacy Real Estate'}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <LeadQuickMenu
                          lead={lead}
                          users={users}
                          campaigns={campaigns}
                          workspaces={workspaces}
                          onRefresh={() => router.refresh()}
                        />
                      </td>
                    </tr>
                  );
                })}

                {displayLeads.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground font-semibold text-xs">
                      No leads match the active filters. Open "Filters" or choose a different tab view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Client Side Pagination controls */}
          <div className="p-4 border-t border-border flex items-center justify-between text-xs font-semibold text-muted-foreground bg-muted/10">
            <div>
              <span>
                Showing {totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, totalCount)} of {totalCount} entries
              </span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 border border-border rounded-xl hover:bg-muted transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                Prev
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2)).map(p => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-lg font-bold transition-all cursor-pointer ${
                      currentPage === p ? 'bg-primary text-primary-foreground shadow-xs' : 'hover:bg-muted'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 border border-border rounded-xl hover:bg-muted transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Lofty "All Filters" Right Slide-Out Sidebar Panel */}
      {showFiltersSidebar && (
        <div className="w-80 bg-card border-l border-border/80 p-5 shadow-2xl flex flex-col h-screen sticky top-0 overflow-y-auto animate-slideIn">
          <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
            <span className="font-extrabold text-sm text-foreground uppercase tracking-wider">All Filters</span>
            <button
              onClick={() => setShowFiltersSidebar(false)}
              className="p-1.5 hover:bg-muted/60 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 space-y-4 text-xs font-semibold text-muted-foreground">
            {/* Direct Finder Search bar inside panel */}
            <div className="space-y-1.5 p-3.5 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
              <label className="block text-[9px] font-black uppercase text-indigo-600 tracking-wider">Tell criteria or filter leads</label>
              <div className="flex gap-1.5 mt-1">
                <input
                  type="text"
                  placeholder="e.g. St. Clair Shores..."
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none font-medium"
                />
                <button
                  onClick={() => setCurrentPage(1)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Find
                </button>
              </div>
            </div>

            {/* Address Collapsible accordion */}
            <div className="border-b border-border/40 pb-3">
              <button
                onClick={() => setCollapsedSections(prev => ({ ...prev, address: !prev.address }))}
                className="w-full flex items-center justify-between font-bold text-foreground text-xs py-1 cursor-pointer"
              >
                <span>Filter by Address</span>
                <span className="text-muted-foreground/60">{collapsedSections.address ? '▼' : '▲'}</span>
              </button>
              {!collapsedSections.address && (
                <input
                  type="text"
                  placeholder="City, Zip, or Street"
                  value={filterAddress}
                  onChange={(e) => { setFilterAddress(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 mt-2 text-foreground font-medium focus:outline-none"
                />
              )}
            </div>

            {/* Lead Owner Collapsible Accordion */}
            <div className="border-b border-border/40 pb-3">
              <button
                onClick={() => setCollapsedSections(prev => ({ ...prev, owner: !prev.owner }))}
                className="w-full flex items-center justify-between font-bold text-foreground text-xs py-1 cursor-pointer"
              >
                <span>Lead Owner</span>
                <span className="text-muted-foreground/60">{collapsedSections.owner ? '▼' : '▲'}</span>
              </button>
              {!collapsedSections.owner && (
                <select
                  value={filterOwner}
                  onChange={(e) => { setFilterOwner(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 mt-2 text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Owners</option>
                  <option value="COMPANY">Company Leads</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name || u.email}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Agent Collapsible Accordion */}
            <div className="border-b border-border/40 pb-3">
              <button
                onClick={() => setCollapsedSections(prev => ({ ...prev, agent: !prev.agent }))}
                className="w-full flex items-center justify-between font-bold text-foreground text-xs py-1 cursor-pointer"
              >
                <span>Assignee Agent</span>
                <span className="text-muted-foreground/60">{collapsedSections.agent ? '▼' : '▲'}</span>
              </button>
              {!collapsedSections.agent && (
                <select
                  value={filterAgent}
                  onChange={(e) => { setFilterAgent(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 mt-2 text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Agents</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name || u.email}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Lead Type / Status Collapsible Accordion */}
            <div className="border-b border-border/40 pb-3">
              <button
                onClick={() => setCollapsedSections(prev => ({ ...prev, type: !prev.type }))}
                className="w-full flex items-center justify-between font-bold text-foreground text-xs py-1 cursor-pointer"
              >
                <span>Lead Pipeline Status</span>
                <span className="text-muted-foreground/60">{collapsedSections.type ? '▼' : '▲'}</span>
              </button>
              {!collapsedSections.type && (
                <select
                  value={filterType}
                  onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 mt-2 text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="NEW">NEW</option>
                  <option value="PROSPECTING">Attempting Contact</option>
                  <option value="CONTACTED">Nurturing/Cold</option>
                  <option value="QUALIFIED">Warm/Hot</option>
                  <option value="PREFORECLOSURE">Preforeclosure</option>
                </select>
              )}
            </div>

            {/* Source Collapsible Accordion */}
            <div className="border-b border-border/40 pb-3">
              <button
                onClick={() => setCollapsedSections(prev => ({ ...prev, source: !prev.source }))}
                className="w-full flex items-center justify-between font-bold text-foreground text-xs py-1 cursor-pointer"
              >
                <span>Leads Source</span>
                <span className="text-muted-foreground/60">{collapsedSections.source ? '▼' : '▲'}</span>
              </button>
              {!collapsedSections.source && (
                <select
                  value={filterSource}
                  onChange={(e) => { setFilterSource(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 mt-2 text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Sources</option>
                  <option value="MyPlusLeads">MyPlusLeads</option>
                  <option value="Manual">Manual</option>
                  <option value="Zillow">Zillow</option>
                  <option value="Referral">Referral</option>
                  <option value="Legal News - Macomb Foreclosures">Foreclosures (Legal News)</option>
                </select>
              )}
            </div>

            {/* Tags Collapsible Accordion */}
            <div className="border-b border-border/40 pb-3">
              <button
                onClick={() => setCollapsedSections(prev => ({ ...prev, tags: !prev.tags }))}
                className="w-full flex items-center justify-between font-bold text-foreground text-xs py-1 cursor-pointer"
              >
                <span>Tags Contains</span>
                <span className="text-muted-foreground/60">{collapsedSections.tags ? '▼' : '▲'}</span>
              </button>
              {!collapsedSections.tags && (
                <input
                  type="text"
                  placeholder="e.g. Expired, Buyer"
                  value={filterTags}
                  onChange={(e) => { setFilterTags(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 mt-2 text-foreground font-medium focus:outline-none"
                />
              )}
            </div>

            {/* Score Collapsible Accordion */}
            <div className="border-b border-border/40 pb-3">
              <button
                onClick={() => setCollapsedSections(prev => ({ ...prev, score: !prev.score }))}
                className="w-full flex items-center justify-between font-bold text-foreground text-xs py-1 cursor-pointer"
              >
                <span>Lead Score Threshold</span>
                <span className="text-muted-foreground/60">{collapsedSections.score ? '▼' : '▲'}</span>
              </button>
              {!collapsedSections.score && (
                <input
                  type="number"
                  placeholder="Min Score (e.g. 50)"
                  value={filterMinScore}
                  onChange={(e) => { setFilterMinScore(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 mt-2 text-foreground font-medium focus:outline-none"
                />
              )}
            </div>

          </div>

          {/* Reset button & Create View button inside Panel footer */}
          <div className="border-t border-border/40 pt-4 mt-6 flex gap-2 text-xs font-bold text-foreground">
            <button
              onClick={() => {
                setFilterAddress('');
                setFilterOwner('ALL');
                setFilterAgent('ALL');
                setFilterType('ALL');
                setFilterSource('ALL');
                setFilterTags('');
                setFilterMinScore('');
                setSidebarSearch('');
                setCurrentPage(1);
                toast.success('Filters cleared.');
              }}
              className="flex-1 py-2.5 border border-border rounded-xl hover:bg-muted/60 transition-colors cursor-pointer text-center"
            >
              Clear All
            </button>
            <button
              onClick={() => setShowCustomViewModal(true)}
              className="flex-1 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl transition-all shadow-md cursor-pointer text-center"
            >
              Create View
            </button>
          </div>
        </div>
      )}

      {/* Save Custom View Modal */}
      {showCustomViewModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-sm overflow-hidden text-xs font-semibold text-muted-foreground">
            <div className="p-4 border-b border-border/40 flex justify-between items-center bg-muted/10">
              <h3 className="font-extrabold text-sm text-foreground uppercase tracking-wider">Create Custom View</h3>
              <button onClick={() => setShowCustomViewModal(false)} className="text-muted-foreground hover:text-foreground">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block mb-1.5 text-[9px] font-black uppercase tracking-wider">Custom View Name</label>
                <input
                  type="text"
                  placeholder="e.g. St. Clair Shores Expired"
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                onClick={handleCreateCustomView}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-md cursor-pointer"
              >
                Save View Tab
              </button>
            </div>
          </div>
        </div>
      )}
      {/* CSV Universal Import Modal */}
      {showCsvImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-background border border-border shadow-2xl rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
              <div>
                <h3 className="font-extrabold text-lg text-foreground">📥 Universal CSV Field Mapper</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Upload a CSV file and match your columns to CRM fields.</p>
              </div>
              <button 
                onClick={() => {
                  setShowCsvImportModal(false);
                  setCsvHeaders([]);
                  setCsvRows([]);
                }} 
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {csvHeaders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-border rounded-xl">
                  <span className="text-3xl mb-2">📊</span>
                  <p className="font-bold mb-1">Select a CSV File to Begin</p>
                  <p className="text-muted-foreground mb-4">First row must contain header columns</p>
                  <label className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/95 transition-all cursor-pointer shadow-sm">
                    Choose CSV File
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <>
                  {/* Segment Options */}
                  <div className="bg-muted/10 border border-border rounded-xl p-4 space-y-4">
                    <h4 className="font-bold text-sm text-foreground">🏷️ Assign Imports to Segment</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Choose Existing Segment</label>
                        <select
                          value={importSegmentId}
                          onChange={(e) => {
                            setImportSegmentId(e.target.value);
                            setImportSegmentName('');
                          }}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary"
                        >
                          <option value="">-- No Segment --</option>
                          {segments.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">OR Create New Segment Name</label>
                        <input
                          type="text"
                          value={importSegmentName}
                          onChange={(e) => {
                            setImportSegmentName(e.target.value);
                            setImportSegmentId('');
                          }}
                          placeholder="e.g. June Zillow Leads"
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Universal Column Matching */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-foreground">🔗 Map Columns to CRM Fields</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 bg-muted/5 border border-border p-4 rounded-xl">
                      {[
                        ['firstName', 'First Name * (Required)'],
                        ['lastName', 'Last Name'],
                        ['email', 'Email Address'],
                        ['phone', 'Phone Number'],
                        ['type', 'Lead Type (Buyer/Seller)'],
                        ['source', 'Lead Source'],
                        ['tags', 'Hashtags / Tags'],
                        ['notes', 'Inquiry Message / Notes'],
                        ['address', 'Property Address'],
                      ].map(([fieldKey, labelName]) => (
                        <div key={fieldKey} className="flex justify-between items-center gap-2 border-b border-border/40 pb-2">
                          <span className="font-semibold text-muted-foreground">{labelName}</span>
                          <select
                            value={fieldMappings[fieldKey] || ''}
                            onChange={(e) => setFieldMappings({ ...fieldMappings, [fieldKey]: e.target.value })}
                            className="bg-background border border-border rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-primary max-w-[150px] md:max-w-[180px] truncate"
                          >
                            <option value="">-- Ignore Field --</option>
                            {csvHeaders.map((header, idx) => (
                              <option key={idx} value={String(idx)}>{header}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm text-foreground">👁️ Preview Intake Data ({csvRows.length} Rows found)</h4>
                    <div className="border border-border rounded-lg overflow-x-auto max-h-[150px] bg-background">
                      <table className="w-full text-left text-[10px] divide-y divide-border">
                        <thead className="bg-muted/40 font-bold uppercase text-muted-foreground">
                          <tr>
                            {csvHeaders.slice(0, 5).map((h, i) => (
                              <th key={i} className="px-3 py-1.5">{h}</th>
                            ))}
                            {csvHeaders.length > 5 && <th className="px-3 py-1.5">...</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {csvRows.slice(0, 3).map((row, rowIdx) => (
                            <tr key={rowIdx}>
                              {row.slice(0, 5).map((val, valIdx) => (
                                <td key={valIdx} className="px-3 py-1.5 text-muted-foreground font-mono">{val}</td>
                              ))}
                              {row.length > 5 && <td className="px-3 py-1.5 text-muted-foreground italic">...</td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            {csvHeaders.length > 0 && (
              <div className="p-4 border-t border-border bg-muted/20 flex justify-between items-center shrink-0">
                <button
                  onClick={() => {
                    setCsvHeaders([]);
                    setCsvRows([]);
                  }}
                  className="px-3 py-1.5 bg-muted border border-border text-xs rounded hover:bg-muted/80 cursor-pointer"
                >
                  Clear File
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowCsvImportModal(false);
                      setCsvHeaders([]);
                      setCsvRows([]);
                      setImportSegmentId('');
                      setImportSegmentName('');
                    }}
                    className="px-3 py-1.5 hover:bg-muted rounded text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportSubmit}
                    disabled={isImporting}
                    className="px-5 py-1.5 bg-primary text-primary-foreground font-bold rounded hover:bg-primary/90 text-xs shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {isImporting ? 'Importing Leads...' : `Confirm Import (${csvRows.length} Leads)`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Lead Intake Modal */}
      {showAiIntakeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
              <div>
                <h3 className="font-extrabold text-lg text-foreground">✨ AI Agent Lead Intake</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Paste any email text, Zillow/Realtor notification to extract details.</p>
              </div>
              <button 
                onClick={() => {
                  setShowAiIntakeModal(false);
                  setAiIntakeText('');
                  setParsedLeadData(null);
                  setAiSegmentId('');
                  setAiSegmentName('');
                }} 
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Paste Unstructured Text</label>
                <textarea
                  value={aiIntakeText}
                  onChange={(e) => setAiIntakeText(e.target.value)}
                  placeholder="Paste Zillow/Realtor contact details or lead emails here..."
                  rows={6}
                  className="w-full bg-muted/10 border border-border rounded-xl px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none resize-none font-mono text-[11px]"
                />
              </div>

              {!parsedLeadData ? (
                <div className="flex justify-end">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleAiParse}
                          disabled={isParsing || !aiIntakeText.trim()}
                          className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/95 text-xs shadow-md disabled:opacity-50 cursor-pointer"
                        >
                          {isParsing ? 'AI Parsing Info...' : '⚡ AI Extract Details'}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Uses Gemini AI to intelligently extract structured CRM data from unstructured text blocks.</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ) : (
                <>
                  {/* Segment Options */}
                  <div className="bg-muted/10 border border-border rounded-xl p-4 space-y-4">
                    <h4 className="font-bold text-sm text-foreground">🏷️ Assign AI Intake to Segment</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Choose Existing Segment</label>
                        <select
                          value={aiSegmentId}
                          onChange={(e) => {
                            setAiSegmentId(e.target.value);
                            setAiSegmentName('');
                          }}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary"
                        >
                          <option value="">-- No Segment --</option>
                          {segments.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">OR Create New Segment Name</label>
                        <input
                          type="text"
                          value={aiSegmentName}
                          onChange={(e) => {
                            setAiSegmentName(e.target.value);
                            setAiSegmentId('');
                          }}
                          placeholder="e.g. AI Intake Leads"
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Structured Preview Form */}
                  <div className="space-y-3 border border-border bg-muted/5 p-4 rounded-xl">
                    <h4 className="font-bold text-sm text-foreground text-primary flex items-center gap-1">
                      <span>✓</span> Extracted Structured Fields
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">First Name</span>
                        <input
                          type="text"
                          value={parsedLeadData.firstName || ''}
                          onChange={(e) => setParsedLeadData({ ...parsedLeadData, firstName: e.target.value })}
                          className="w-full bg-background border border-border rounded px-2.5 py-1 mt-0.5 font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Last Name</span>
                        <input
                          type="text"
                          value={parsedLeadData.lastName || ''}
                          onChange={(e) => setParsedLeadData({ ...parsedLeadData, lastName: e.target.value })}
                          className="w-full bg-background border border-border rounded px-2.5 py-1 mt-0.5"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Email</span>
                        <input
                          type="email"
                          value={parsedLeadData.email || ''}
                          onChange={(e) => setParsedLeadData({ ...parsedLeadData, email: e.target.value })}
                          className="w-full bg-background border border-border rounded px-2.5 py-1 mt-0.5"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Phone</span>
                        <input
                          type="text"
                          value={parsedLeadData.phone || ''}
                          onChange={(e) => setParsedLeadData({ ...parsedLeadData, phone: e.target.value })}
                          className="w-full bg-background border border-border rounded px-2.5 py-1 mt-0.5"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Lead Type</span>
                        <select
                          value={parsedLeadData.type}
                          onChange={(e) => setParsedLeadData({ ...parsedLeadData, type: e.target.value })}
                          className="w-full bg-background border border-border rounded px-2.5 py-1 mt-0.5"
                        >
                          <option value="BUYER">BUYER</option>
                          <option value="SELLER">SELLER</option>
                        </select>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Source</span>
                        <input
                          type="text"
                          value={parsedLeadData.source || ''}
                          onChange={(e) => setParsedLeadData({ ...parsedLeadData, source: e.target.value })}
                          className="w-full bg-background border border-border rounded px-2.5 py-1 mt-0.5"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Property Address</span>
                      <input
                        type="text"
                        value={parsedLeadData.address || ''}
                        onChange={(e) => setParsedLeadData({ ...parsedLeadData, address: e.target.value })}
                        className="w-full bg-background border border-border rounded px-2.5 py-1 mt-0.5"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Tags</span>
                      <input
                        type="text"
                        value={parsedLeadData.tags || ''}
                        onChange={(e) => setParsedLeadData({ ...parsedLeadData, tags: e.target.value })}
                        className="w-full bg-background border border-border rounded px-2.5 py-1 mt-0.5"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Notes / Summary</span>
                      <textarea
                        value={parsedLeadData.notes || ''}
                        onChange={(e) => setParsedLeadData({ ...parsedLeadData, notes: e.target.value })}
                        rows={2}
                        className="w-full bg-background border border-border rounded px-2.5 py-1 mt-0.5 resize-none"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {parsedLeadData && (
              <div className="p-4 border-t border-border bg-muted/20 flex justify-between items-center shrink-0">
                <button
                  onClick={() => setParsedLeadData(null)}
                  className="px-3 py-1.5 bg-muted border border-border text-xs rounded hover:bg-muted/80 cursor-pointer"
                >
                  Reparse Text
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowAiIntakeModal(false);
                      setAiIntakeText('');
                      setParsedLeadData(null);
                      setAiSegmentId('');
                      setAiSegmentName('');
                    }}
                    className="px-3 py-1.5 hover:bg-muted rounded text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAiImportSubmit}
                    disabled={isImporting}
                    className="px-5 py-1.5 bg-primary text-primary-foreground font-bold rounded hover:bg-primary/90 text-xs shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {isImporting ? 'Saving Lead...' : '✓ Approve & Import Lead'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
