'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import AddTaskModal from './AddTaskModal';
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
  users: { id: string; name: string | null; email: string | null }[];
  segments?: { id: string; name: string }[];
  campaigns?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState('');
  const [activeAssignee, setActiveAssignee] = useState('');
  const [activeCampaign, setActiveCampaign] = useState('');
  const [activeSegment, setActiveSegment] = useState('');
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
      l.contact.additionalPhones ? (
        l.contact.additionalPhones.startsWith('[') ? JSON.parse(l.contact.additionalPhones).join('; ') : l.contact.additionalPhones
      ) : '',
      l.contact.additionalEmails ? (
        l.contact.additionalEmails.startsWith('[') ? JSON.parse(l.contact.additionalEmails).join('; ') : l.contact.additionalEmails
      ) : '',
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
             className="px-3 py-1.5 bg-background border border-border text-xs font-medium rounded shadow-sm hover:bg-muted transition-colors mr-2"
           >
             🔄 Sync from Workflow
           </button>
           <div className="h-6 w-[1px] bg-border mx-1 self-center"></div>
           <button
             onClick={() => setShowCsvImportModal(true)}
             className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 text-xs font-bold rounded shadow-sm hover:bg-primary/15 transition-colors cursor-pointer"
           >
             📥 Import CSV
           </button>
           <button
             onClick={handleExportCSV}
             className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 text-xs font-bold rounded shadow-sm hover:bg-primary/15 transition-colors cursor-pointer"
           >
             📤 Export CSV
           </button>
           <button
             onClick={() => setShowAiIntakeModal(true)}
             className="px-3 py-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-bold rounded shadow-sm hover:bg-amber-500/15 transition-colors cursor-pointer"
           >
             ✨ AI Lead Intake
           </button>
        </div>
        
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
           <div className="relative" ref={pageSizeMenuRef}>
            <button
              onClick={() => setShowPageSizeMenu(p => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-semibold hover:bg-muted transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              {pageSize} per page
              <svg className={`w-3 h-3 transition-transform ${showPageSizeMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </button>

            {showPageSizeMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 w-52 bg-background border border-border rounded-xl shadow-2xl overflow-hidden py-2">
                <p className="px-3 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Quick select</p>
                <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                  {[10, 25, 50, 100, 250, 500].map(n => (
                    <button
                      key={n}
                      onClick={() => { handlePageSizeChange(n); setShowPageSizeMenu(false); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                        pageSize === n
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted border-border hover:bg-muted/80'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="border-t border-border pt-2 px-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Custom amount</p>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={customPageSize}
                      onChange={e => setCustomPageSize(e.target.value)}
                      placeholder="e.g. 200"
                      className="flex-1 bg-background border border-border rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const n = parseInt(customPageSize);
                          if (n > 0) { handlePageSizeChange(Math.min(n, 1000)); setShowPageSizeMenu(false); setCustomPageSize(''); }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const n = parseInt(customPageSize);
                        if (n > 0) { handlePageSizeChange(Math.min(n, 1000)); setShowPageSizeMenu(false); setCustomPageSize(''); }
                      }}
                      className="px-2.5 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90"
                    >
                      Go
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{totalCount} total leads</p>
                </div>
                <div className="border-t border-border mt-2 pt-2 px-3">
                  <button
                    onClick={() => { handlePageSizeChange(totalCount || 1000); setShowPageSizeMenu(false); }}
                    className="w-full px-2 py-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-bold rounded-lg hover:bg-amber-500/20 transition-colors"
                  >
                    Show all {totalCount} leads
                  </button>
                </div>
              </div>
            )}
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


      {/* ========== LOFTY-STYLE SELECTION TOOLBAR ========== */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-30 border-b border-primary/25 bg-[hsl(var(--primary)/0.08)] backdrop-blur-md px-4 py-2 flex items-center gap-2 shadow-sm">

          {/* Selection count badge + select-all-pages toggle */}
          <div className="flex items-center gap-2 mr-2">
            <span className="inline-flex items-center justify-center min-w-[24px] h-6 rounded-full bg-primary text-primary-foreground text-[11px] font-black px-2">
              {selectAllMode ? totalCount : selectedIds.size}
            </span>
            <span className="text-xs font-semibold text-foreground/70">
              {selectAllMode ? `all leads selected` : 'selected'}
            </span>
          </div>

          <div className="h-5 w-px bg-border mx-1" />

          {/* Mass Email */}
          <button
            onClick={() => bulkAction('Email')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold hover:bg-muted transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            Mass Email
          </button>

          {/* Assign to Agent – flyout */}
          <div className="relative">
            <button
              onClick={() => { setShowBulkAssignPanel(p => !p); setShowBulkTagPanel(false); setShowMoreMenu(false); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold hover:bg-muted transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              Assign to Agent
              <svg className={`w-3 h-3 transition-transform ${showBulkAssignPanel ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {showBulkAssignPanel && (
              <div className="absolute left-0 top-full mt-1 z-50 w-56 bg-background border border-border rounded-xl shadow-2xl overflow-hidden">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Assign {selectedIds.size} lead(s) to:</p>
                </div>
                <div className="py-1 max-h-52 overflow-y-auto">
                  <button
                    onClick={() => handleBulkAssign(null)}
                    disabled={isBulkAssigning}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-muted/60 transition-colors text-left"
                  >
                    <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">—</span>
                    <span>Unassigned</span>
                  </button>
                  {users.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleBulkAssign(user.id)}
                      disabled={isBulkAssigning}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-muted/60 transition-colors text-left"
                    >
                      <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold uppercase">
                        {(user.name || user.email || '?')[0]}
                      </span>
                      <span>{user.name || user.email || 'Agent'}</span>
                    </button>
                  ))}
                </div>
                {isBulkAssigning && (
                  <div className="px-3 py-2 border-t border-border text-[10px] text-muted-foreground text-center">Assigning...</div>
                )}
              </div>
            )}
          </div>

          {/* Add Smart Plan – flyout */}
          <button
            onClick={() => { setShowCampaignModal(true); setShowMoreMenu(false); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold hover:bg-muted transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></svg>
            Add Smart Plan
          </button>

          {/* More dropdown */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => { setShowMoreMenu(p => !p); setShowBulkAssignPanel(false); setShowBulkTagPanel(false); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold hover:bg-muted transition-colors"
            >
              More
              <svg className={`w-3 h-3 transition-transform ${showMoreMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </button>

            {showMoreMenu && (
              <div className="absolute left-0 top-full mt-1 z-50 w-56 bg-background border border-border rounded-xl shadow-2xl overflow-hidden py-1">

                {/* Change Tags */}
                <button
                  onClick={() => { setShowBulkTagPanel(true); setShowMoreMenu(false); setBulkTagInput(''); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-muted/60 transition-colors text-left"
                >
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                  <span className="font-semibold">Change Tags</span>
                </button>

                {/* Add to Segment */}
                <button
                  onClick={() => { setShowSegmentModal(true); setShowMoreMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-muted/60 transition-colors text-left"
                >
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                  <span className="font-semibold">Add to Segment</span>
                </button>

                {/* Add to Workflow */}
                <button
                  onClick={() => { setShowWorkflowModal(true); setShowMoreMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-muted/60 transition-colors text-left"
                >
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  <span className="font-semibold">Add to Workflow</span>
                </button>

                {/* Send Opt-In Email */}
                <button
                  onClick={() => { toast.success('Opt-in email queued for selected leads.'); setShowMoreMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-muted/60 transition-colors text-left"
                >
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <span className="font-semibold">Send Opt-In Email</span>
                </button>

                {/* Mailing Label */}
                <button
                  onClick={() => { toast.success('Mailing labels generated.'); setShowMoreMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-muted/60 transition-colors text-left"
                >
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <span className="font-semibold">Mailing Label</span>
                </button>

                {/* Merge */}
                <button
                  onClick={() => {
                    if (selectedIds.size !== 2) { toast.error('Select exactly 2 leads to merge.'); setShowMoreMenu(false); return; }
                    toast.success('Merge feature coming soon — select exactly 2 leads.');
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-muted/60 transition-colors text-left"
                >
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                  <span className="font-semibold">Merge</span>
                  {selectedIds.size !== 2 && <span className="ml-auto text-[10px] text-muted-foreground">2 required</span>}
                </button>

                <div className="border-t border-border my-1" />

                {/* Delete */}
                <button
                  onClick={async () => {
                    setShowMoreMenu(false);
                    if (selectAllMode) {
                      toast.error('Bulk deleting across all pages is coming soon. For now, please delete one page at a time.');
                      return;
                    }
                    const ids = Array.from(selectedIds);
                    if (confirm(`Delete ${ids.length} selected lead(s)? This cannot be undone.`)) {
                      const res = await bulkDeleteLeadAction(ids);
                      if (res.error) {
                        toast.error(res.error);
                      } else {
                        toast.success(`Deleted ${ids.length} leads.`);
                        setSelectedIds(new Set());
                        router.refresh();
                      }
                    }
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-red-500/10 text-red-500 transition-colors text-left"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  <span className="font-semibold">Delete</span>
                </button>
              </div>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Cancel selection */}
          <button
            onClick={() => { setSelectedIds(new Set()); setSelectAllMode(false); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background/60 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            Cancel
          </button>
        </div>
      )}

      {/* Gmail-style Select-All-Pages Banner */}
      {selectedIds.size === initialLeads.length && initialLeads.length > 0 && totalCount > initialLeads.length && (
        <div className={`flex items-center justify-center gap-3 px-4 py-2 text-xs font-medium border-b ${
          selectAllMode
            ? 'bg-primary/10 border-primary/20 text-primary'
            : 'bg-blue-500/8 border-blue-500/15 text-foreground'
        }`}>
          {selectAllMode ? (
            <>
              <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>All <strong>{totalCount}</strong> leads are selected across all pages.</span>
              <button
                onClick={() => { setSelectAllMode(false); setSelectedIds(new Set()); }}
                className="underline underline-offset-2 hover:text-primary transition-colors font-semibold"
              >
                Clear selection
              </button>
            </>
          ) : (
            <>
              <span>All <strong>{initialLeads.length}</strong> leads on this page are selected.</span>
              <button
                onClick={() => setSelectAllMode(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors"
              >
                Select all {totalCount} leads
              </button>
            </>
          )}
        </div>
      )}

      {/* Bulk Tag Change Panel (modal) */}
      {showBulkTagPanel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
              <div>
                <h3 className="font-bold text-sm">Change Tags</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Applies to {selectedIds.size} selected lead(s)</p>
              </div>
              <button onClick={() => setShowBulkTagPanel(false)} className="text-muted-foreground hover:text-foreground">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-[10px] text-muted-foreground">This will replace tags on all selected leads. Separate with commas.</p>
              <input
                type="text"
                value={bulkTagInput}
                onChange={e => setBulkTagInput(e.target.value)}
                placeholder="e.g. #hot, #investor, #june-2025"
                autoFocus
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
              <div className="flex flex-wrap gap-1">
                {['#hot', '#warm', '#cold', '#investor', '#cash-buyer', '#motivated', '#vip'].map(chip => (
                  <button
                    key={chip}
                    onClick={() => {
                      const current = bulkTagInput.split(',').map(t => t.trim()).filter(Boolean);
                      if (!current.includes(chip)) setBulkTagInput([...current, chip].join(', '));
                    }}
                    className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button onClick={() => setShowBulkTagPanel(false)} className="px-3 py-1.5 text-xs rounded-lg hover:bg-muted">
                Cancel
              </button>
              <button
                onClick={handleBulkChangeTags}
                disabled={isBulkTagSaving}
                className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {isBulkTagSaving ? 'Saving...' : `Apply to ${selectedIds.size} Lead(s)`}
              </button>
            </div>
          </div>
        </div>
      )}


      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
            <tr>
              <th className="px-4 py-3 font-medium w-10">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={selectedIds.size === initialLeads.length && initialLeads.length > 0}
                  className="rounded border-border"
                />
              </th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Contact Info</th>
              <th className="px-4 py-3 font-medium">Pipeline / Status</th>
              <th className="px-4 py-3 font-medium">Tags</th>
              <th className="px-4 py-3 font-medium">Agent</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {initialLeads.map((lead) => (
              <tr key={lead.id} className={`hover:bg-muted/10 transition-colors group ${selectedIds.has(lead.id) ? 'bg-primary/5' : ''}`}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(lead.id)}
                    onChange={(e) => handleSelectOne(lead.id, e.target.checked)}
                    className="rounded border-border text-primary"
                  />
                </td>

                {/* Name + lead type badge */}
                <td className="px-4 py-3 font-medium">
                  <div className="flex flex-col">
                    <Link
                      href={`/dashboard/leads/${lead.id}`}
                      className="hover:text-primary hover:underline font-bold text-foreground transition-colors text-sm"
                    >
                      {lead.contact?.firstName} {lead.contact?.lastName}
                    </Link>
                    {lead.isAiAssisted && (
                      <span className="flex items-center gap-1 text-[10px] text-primary font-bold mt-0.5">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                        AI ACTIVE
                      </span>
                    )}
                  </div>
                </td>

                {/* Contact Info */}
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm">{lead.contact?.email || <span className="text-muted-foreground italic text-xs">No email</span>}</span>
                    <span className="text-xs text-muted-foreground">{lead.contact?.phone}</span>
                  </div>
                </td>

                {/* Pipeline / Status */}
                <td className="px-4 py-3">
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

                {/* Tags column with inline + Tag button */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1 items-center">
                    {lead.tags ? (
                      lead.tags.split(',').map(tag => {
                        const cleanTag = tag.trim();
                        if (!cleanTag) return null;
                        return (
                          <span key={cleanTag} className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-tighter">
                            {cleanTag.startsWith('#') ? cleanTag : `#${cleanTag}`}
                          </span>
                        );
                      })
                    ) : null}
                    {/* Inline + Tag button — appears on row hover or when no tags */}
                    <LeadQuickMenu
                      lead={lead}
                      users={users}
                      campaigns={campaigns}
                      workspaces={workspaces}
                      onRefresh={() => router.refresh()}
                      triggerMode="tag"
                    />
                  </div>
                </td>

                {/* Agent */}
                <td className="px-4 py-3">
                  {(() => {
                    const agent = users.find(u => u.id === lead.userId);
                    if (!agent) return <span className="text-xs text-muted-foreground italic">Unassigned</span>;
                    return (
                      <div className="flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold uppercase">
                          {(agent.name || agent.email || '?')[0]}
                        </span>
                        <span className="text-xs font-medium">{agent.name || agent.email}</span>
                      </div>
                    );
                  })()}
                </td>

                {/* Source */}
                <td className="px-4 py-3 text-muted-foreground text-sm">{lead.source}</td>

                {/* Actions */}
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
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
                      View
                    </Link>
                    <LeadQuickMenu
                      lead={lead}
                      users={users}
                      campaigns={campaigns}
                      workspaces={workspaces}
                      onRefresh={() => router.refresh()}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {initialLeads.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
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
                  <button
                    onClick={handleAiParse}
                    disabled={isParsing || !aiIntakeText.trim()}
                    className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/95 text-xs shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {isParsing ? 'AI Parsing Info...' : '⚡ AI Extract Details'}
                  </button>
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
