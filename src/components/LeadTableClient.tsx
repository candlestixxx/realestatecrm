'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import AddTaskModal from './AddTaskModal';
import { addTaskAction } from '@/lib/actions/task';
import { bulkEnrollLeadsInCampaignAction } from '@/lib/actions/campaign';
import { deleteLeadAction, importLeadsBulkAction } from '@/lib/actions/lead';
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
    address?: string | null;
    additionalPhones?: string | null;
    additionalEmails?: string | null;
    spouseName?: string | null;
    spousePhone?: string | null;
    spouseEmail?: string | null;
    familyMembers?: string | null;
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
  const [activeWorkspace, setActiveWorkspace] = useState('');
  const [activeAssignee, setActiveAssignee] = useState('');
  const [activeCampaign, setActiveCampaign] = useState('');
  const [activeSegment, setActiveSegment] = useState('');
  const [isBulkActionPending, setIsBulkActionPending] = useState(false);

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
