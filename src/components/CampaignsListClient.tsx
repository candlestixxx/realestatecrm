'use client';

import { useState, useMemo } from 'react';
import CampaignEditor from './CampaignEditor';
import { 
  createCampaignAction, 
  toggleCampaignStatusAction, 
  importCampaignTemplateAction,
  bulkEnrollLeadsInCampaignAction,
  deleteCampaignAction
} from '@/lib/actions/campaign';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

type CampaignData = {
  id: string;
  name: string;
  description: string | null;
  steps: string | null;
  isActive: boolean;
  createdAt: Date;
  _count?: { leads: number };
};

type LeadOption = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};

type SegmentOption = {
  id: string;
  name: string;
};

const REAL_ESTATE_TEMPLATES = [
  {
    name: 'ELRT-Pre Foreclosure GPT',
    description: 'When a Seller lead is reassigned, this plan launches a paced outreach campaign designed to re-engage them and move them through the pipeline. It updates the pipeline, then sends an email and automated text.',
    steps: [
      { id: '1', type: 'TASK', delayValue: 0, delayUnit: 'SECOND', content: 'Change Pipeline Stage to Preforeclosure' },
      { id: '2', type: 'EMAIL', delayValue: 5, delayUnit: 'MINUTE', subject: 'Facing Pre Foreclosure?', content: 'Hi, I saw your property notices and wanted to see if we can chat about options to protect your equity...' },
      { id: '3', type: 'SMS', delayValue: 10, delayUnit: 'MINUTE', content: 'Hi, know your options. I specialize in preforeclosure resolutions in Macomb County. Let me know if you want to chat.' },
      { id: '4', type: 'CALL', delayValue: 1, delayUnit: 'DAY', content: 'Call lead to discuss short sale or modification options.' }
    ]
  },
  {
    name: 'New Inbound Buyer Lead Drip',
    description: 'High-touch follow-up sequence for newly registered buyers to qualify their timeline and budget.',
    steps: [
      { id: 's1', type: 'SMS', delayValue: 5, delayUnit: 'MINUTE', content: 'Hi! Thanks for checking out homes on our site. Are you looking to move in the next 30-60 days, or just browsing?' },
      { id: 's2', type: 'EMAIL', delayValue: 1, delayUnit: 'HOUR', subject: 'Here is your custom home search guide', content: 'Hi! I wanted to send over a list of active properties in your preferred area. Let me know what price point you are focusing on.' },
      { id: 's3', type: 'CALL', delayValue: 1, delayUnit: 'DAY', content: 'Qualifying call: Ask about financing/pre-approval and home criteria.' },
      { id: 's4', type: 'EMAIL', delayValue: 3, delayUnit: 'DAY', subject: 'Have you seen these listings yet?', content: 'Checking in to see if any of the recent listings match what you are looking for? Let me know if you want to tour any this weekend.' }
    ]
  },
  {
    name: 'FSBO (For Sale By Owner) Smart Plan',
    description: 'Informative drip campaign highlighting the benefits of working with a professional to secure top dollar.',
    steps: [
      { id: 'fs1', type: 'CALL', delayValue: 1, delayUnit: 'DAY', content: 'Initial contact: Introduce yourself, offer a free CMA valuation packet.' },
      { id: 'fs2', type: 'EMAIL', delayValue: 3, delayUnit: 'DAY', subject: 'Why selling yourself is costing you 6% more', content: 'Statistically, agent-assisted sales fetch 10-15% higher sales prices compared to FSBO listings. Here are the latest NAR stats.' },
      { id: 'fs3', type: 'SMS', delayValue: 5, delayUnit: 'DAY', content: 'Hi! Just wanted to see if you had any questions on the home valuation packet I sent over? Happy to help.' }
    ]
  },
  {
    name: 'Past Client Referral Plan',
    description: 'Long-term drip campaign spanning months and years to stay top-of-mind and request referrals.',
    steps: [
      { id: 'pc1', type: 'EMAIL', delayValue: 3, delayUnit: 'MONTH', subject: 'Happy Homeownership Anniversary!', content: 'Hope you are loving the new place! Just checking in to see if you need any local contractor recommendations.' },
      { id: 'pc2', type: 'CALL', delayValue: 6, delayUnit: 'MONTH', content: 'Referral touch base call: catch up on life and ask if they know anyone looking to buy or sell.' },
      { id: 'pc3', type: 'SMS', delayValue: 12, delayUnit: 'MONTH', content: 'Happy 1-year home anniversary! Time flies. Hope all is well!' }
    ]
  }
];

export default function CampaignsListClient({
  campaigns,
  leads = [],
  segments = [],
}: {
  campaigns: CampaignData[];
  leads?: LeadOption[];
  segments?: SegmentOption[];
}) {
  const [activeTab, setActiveTab] = useState<'plans' | 'library'>('plans');
  const [activeEditorId, setActiveEditorId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Folder Navigation State
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [folders, setFolders] = useState<string[]>(['Foreclosure Plan Folder', 'Follow-up folder']);
  const [newFolderName, setNewFolderName] = useState('');
  const [showAddFolder, setShowAddFolder] = useState(false);
  
  // Search and selection
  const [planSearch, setPlanSearch] = useState('');
  
  // Lead Enrollment Modal State
  const [enrollCampaignId, setEnrollCampaignId] = useState<string | null>(null);
  const [leadSearchText, setLeadSearchText] = useState('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [isEnrolling, setIsEnrolling] = useState(false);

  const router = useRouter();

  const activeCampaign = campaigns.find(c => c.id === activeEditorId);

  // Filter campaigns based on search and folders
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(planSearch.toLowerCase()) || 
        (c.description && c.description.toLowerCase().includes(planSearch.toLowerCase()));
      
      if (!matchSearch) return false;

      // Mock folder assignment logic (e.g. if "foreclosure" matches, show in Foreclosure folder)
      if (selectedFolder === 'Foreclosure Plan Folder') {
        return c.name.toLowerCase().includes('foreclosure') || c.name.toLowerCase().includes('elrt');
      }
      if (selectedFolder === 'Follow-up folder') {
        return !c.name.toLowerCase().includes('foreclosure') && !c.name.toLowerCase().includes('elrt');
      }
      return true;
    });
  }, [campaigns, planSearch, selectedFolder]);

  // Filter leads for enrollment modal
  const filteredLeads = useMemo(() => {
    return leads.filter(l => 
      l.name.toLowerCase().includes(leadSearchText.toLowerCase()) || 
      (l.email && l.email.toLowerCase().includes(leadSearchText.toLowerCase())) ||
      (l.phone && l.phone.includes(leadSearchText))
    );
  }, [leads, leadSearchText]);

  const handleCreate = async (formData: FormData) => {
    setError(null);
    const res = await createCampaignAction(formData);
    if (res && res.error) {
      setError(res.error);
    } else {
      toast.success('Drip Campaign created successfully!');
      setIsAdding(false);
      router.refresh();
      if (res.campaignId) {
        setActiveEditorId(res.campaignId);
      }
    }
  };

  const handleToggle = async (campaignId: string, currentStatus: boolean) => {
    try {
      const res = await toggleCampaignStatusAction(campaignId, !currentStatus);
      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Campaign ${!currentStatus ? 'Activated' : 'Paused'}`);
        router.refresh();
      }
    } catch (e) {
      toast.error('Network error toggling status.');
    }
  };

  const handleImportTemplate = async (template: typeof REAL_ESTATE_TEMPLATES[0]) => {
    const loadingToast = toast.loading(`Importing template "${template.name}"...`);
    try {
      const res = await importCampaignTemplateAction(
        template.name,
        template.description,
        JSON.stringify(template.steps)
      );
      toast.dismiss(loadingToast);
      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success(`"${template.name}" added to your Active Plans!`);
        router.refresh();
      }
    } catch {
      toast.dismiss(loadingToast);
      toast.error('Failed to import campaign.');
    }
  };

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      setFolders([...folders, newFolderName.trim()]);
      setNewFolderName('');
      setShowAddFolder(false);
      toast.success('Folder created successfully!');
    }
  };

  // Bulk enrollment execution
  const executeEnrollment = async () => {
    if (!enrollCampaignId) return;
    if (selectedLeadIds.size === 0) {
      toast.error('Please select at least one lead.');
      return;
    }
    
    setIsEnrolling(true);
    try {
      const res = await bulkEnrollLeadsInCampaignAction(Array.from(selectedLeadIds), enrollCampaignId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Successfully enrolled ${selectedLeadIds.size} leads!`);
        setEnrollCampaignId(null);
        setSelectedLeadIds(new Set());
        router.refresh();
      }
    } catch (e) {
      toast.error('Failed to enroll leads.');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleSelectAllLeads = (checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(new Set(filteredLeads.map(l => l.id)));
    } else {
      setSelectedLeadIds(new Set());
    }
  };

  const handleSelectLead = (id: string, checked: boolean) => {
    const next = new Set(selectedLeadIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedLeadIds(next);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/10 p-4 rounded-xl border border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground">Smart Plans & Campaigns</h1>
            <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
              Automation Hub
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Build and manage multi-channel follow-ups (Email, SMS, and Tasks).</p>
        </div>

        {/* Top center plans vs library toggle */}
        <div className="flex items-center gap-4">
          <div className="flex bg-muted/50 p-1 rounded-lg border border-border">
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                activeTab === 'plans' 
                  ? 'bg-background text-primary shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Plans
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                activeTab === 'library' 
                  ? 'bg-background text-primary shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Library
            </button>
          </div>

          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/95 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span className="text-sm">+</span> Create Smart Plan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Folders Sidebar */}
        <div className="lg:col-span-1 bg-background border border-border rounded-xl p-4 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Search Plans</label>
            <input
              type="text"
              placeholder="Search by name..."
              value={planSearch}
              onChange={(e) => setPlanSearch(e.target.value)}
              className="w-full bg-muted/30 border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Folder Categories */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Folders</span>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedFolder('all')}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between ${
                  selectedFolder === 'all' 
                    ? 'bg-primary/10 text-primary' 
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>📂 All Smart Plans</span>
                <span className="bg-muted/40 text-[9px] px-1.5 py-0.5 rounded font-bold">{campaigns.length}</span>
              </button>

              {folders.map((folder, i) => {
                // Mock count
                const count = folder === 'Foreclosure Plan Folder' 
                  ? campaigns.filter(c => c.name.toLowerCase().includes('foreclosure') || c.name.toLowerCase().includes('elrt')).length
                  : campaigns.filter(c => !c.name.toLowerCase().includes('foreclosure') && !c.name.toLowerCase().includes('elrt')).length;

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedFolder(folder)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between ${
                      selectedFolder === folder 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="truncate">📁 {folder}</span>
                    <span className="bg-muted/40 text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ml-1">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Add Folder controls */}
            {showAddFolder ? (
              <div className="space-y-2 pt-2 border-t border-border/50">
                <input
                  type="text"
                  placeholder="New folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded px-2 py-1 text-xs"
                />
                <div className="flex gap-1 justify-end">
                  <button
                    onClick={() => setShowAddFolder(false)}
                    className="px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddFolder}
                    className="px-2 py-0.5 text-[10px] bg-primary text-primary-foreground font-bold rounded"
                  >
                    Add
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddFolder(true)}
                className="w-full py-1 border border-dashed border-border text-center hover:border-slate-500 rounded-lg text-[10px] font-bold text-muted-foreground hover:text-foreground transition-all"
              >
                + Add Folder
              </button>
            )}
          </div>
        </div>

        {/* Main Content Pane */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'plans' ? (
            <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border uppercase font-bold text-muted-foreground tracking-wider">
                      <th className="p-3 w-8"><input type="checkbox" className="rounded" /></th>
                      <th className="p-3">Plan Name</th>
                      <th className="p-3">Scope</th>
                      <th className="p-3">Lead Type</th>
                      <th className="p-3 text-center">Steps</th>
                      <th className="p-3">Auto Apply Conditions</th>
                      <th className="p-3 text-center">Auto Apply</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.map((c) => {
                      let stepCount = 0;
                      let settings: any = {};
                      try {
                        if (c.steps) {
                          const parsed = JSON.parse(c.steps);
                          if (parsed.items) {
                            stepCount = parsed.items.length;
                            settings = parsed.settings || {};
                          } else if (Array.isArray(parsed)) {
                            stepCount = parsed.length;
                          }
                        }
                      } catch (e) {}

                      // Apply triggers formatter
                      let conditionText = 'Manual Enrollment';
                      if (settings.autoApplyTrigger && settings.autoApplyTrigger !== 'NONE') {
                        const trigger = settings.autoApplyTrigger === 'LEAD_CREATED' ? 'Lead Created' :
                                      settings.autoApplyTrigger === 'ASSIGNMENT_CHANGED' ? 'Lead Assigned' : 'Segment Matched';
                        
                        let crit = '';
                        if (settings.autoApplyCriteria) {
                          const seg = segments.find(s => s.id === settings.autoApplyCriteria);
                          crit = seg ? ` (${seg.name})` : '';
                        }
                        conditionText = `${trigger}${crit}`;
                      }

                      return (
                        <tr key={c.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                          <td className="p-3"><input type="checkbox" className="rounded" /></td>
                          <td className="p-3">
                            <span className="font-bold text-sm text-foreground block">{c.name}</span>
                            <span className="text-[10px] text-muted-foreground line-clamp-1 max-w-[200px]">
                              {c.description || 'No description provided.'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="px-1.5 py-0.5 bg-muted text-muted-foreground border border-border rounded uppercase text-[9px] font-bold">
                              {settings.scope || 'Company'}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-muted-foreground">
                            {settings.leadType || 'Both'}
                          </td>
                          <td className="p-3 text-center font-bold text-foreground">
                            {stepCount}
                          </td>
                          <td className="p-3 text-muted-foreground font-medium">
                            {conditionText}
                          </td>
                          <td className="p-3 text-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={c.isActive}
                                onChange={() => handleToggle(c.id, c.isActive)}
                                className="sr-only peer"
                              />
                              <div className="w-7 h-4 bg-muted border border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => setEnrollCampaignId(c.id)}
                              className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all font-bold rounded text-[10px] uppercase"
                            >
                              Run / Enroll
                            </button>
                            <button
                              onClick={() => setActiveEditorId(c.id)}
                              className="px-2 py-1 bg-muted border border-border hover:bg-muted/80 font-bold rounded text-[10px] uppercase text-muted-foreground hover:text-foreground"
                            >
                              👁️ Edit
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`Are you sure you want to delete the Smart Plan "${c.name}"? This action cannot be undone.`)) {
                                  const res = await deleteCampaignAction(c.id);
                                  if (res && res.error) {
                                    toast.error(res.error);
                                  } else {
                                    toast.success('Smart Plan deleted successfully!');
                                    router.refresh();
                                  }
                                }
                              }}
                              className="px-2 py-1 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all font-bold rounded text-[10px] uppercase"
                            >
                              🗑️ Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredCampaigns.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-muted-foreground italic border-b border-border">
                          No active drip plans found. Try changing your search or folder filters!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            // Drip Campaign Library
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {REAL_ESTATE_TEMPLATES.map((tmpl, idx) => (
                <div key={idx} className="bg-background border border-border rounded-xl p-6 flex flex-col justify-between space-y-4 hover:border-slate-600 transition-all shadow-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full uppercase">
                        {tmpl.steps.length} Steps
                      </span>
                      <span className="text-[9px] text-muted-foreground uppercase font-black tracking-wider">
                        Preloaded Template
                      </span>
                    </div>
                    <h3 className="font-extrabold text-base text-foreground">{tmpl.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {tmpl.description}
                    </p>
                    
                    <div className="bg-muted/20 p-3 rounded-lg border border-border/40">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Outreach Sequence:</span>
                      <div className="flex flex-wrap gap-2">
                        {tmpl.steps.map((s, stepIdx) => (
                          <span key={stepIdx} className="text-[9px] px-1.5 py-0.5 bg-background border border-border rounded text-slate-300 font-medium">
                            {stepIdx + 1}. {s.type} ({s.delayValue} {s.delayUnit.toLowerCase()}s)
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleImportTemplate(tmpl)}
                      className="px-4 py-1.5 bg-secondary text-secondary-foreground text-xs font-bold rounded-lg hover:bg-secondary/95 transition-all shadow-sm"
                    >
                      📥 Import Plan to Active
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Campaign Steps Editor Modal */}
      {activeCampaign && (
        <CampaignEditor
          campaignId={activeCampaign.id}
          campaignName={activeCampaign.name}
          initialSteps={activeCampaign.steps}
          segments={segments}
          onClose={() => {
            setActiveEditorId(null);
            router.refresh();
          }}
        />
      )}

      {/* Direct Enroll Leads Modal */}
      {enrollCampaignId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl border border-border shadow-2xl p-6 w-full max-w-lg animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <h3 className="font-black text-lg mb-1">Enroll Leads in Campaign</h3>
            <p className="text-xs text-muted-foreground mb-4">Select leads from your workspace database to run this follow-up sequence.</p>

            <input
              type="text"
              placeholder="Search leads by name, email or phone..."
              value={leadSearchText}
              onChange={(e) => setLeadSearchText(e.target.value)}
              className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary mb-4"
            />

            <div className="flex-1 overflow-y-auto border border-border rounded-lg bg-muted/10 divide-y divide-border">
              {filteredLeads.map((l) => (
                <label key={l.id} className="flex items-center gap-3 p-3 hover:bg-muted/30 cursor-pointer transition-colors text-xs">
                  <input
                    type="checkbox"
                    checked={selectedLeadIds.has(l.id)}
                    onChange={(e) => handleSelectLead(l.id, e.target.checked)}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-foreground block">{l.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {l.email || 'No email'} • {l.phone || 'No phone'}
                    </span>
                  </div>
                </label>
              ))}

              {filteredLeads.length === 0 && (
                <div className="p-8 text-center text-xs text-muted-foreground italic">
                  No matching leads found.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={filteredLeads.length > 0 && selectedLeadIds.size === filteredLeads.length}
                  onChange={(e) => handleSelectAllLeads(e.target.checked)}
                  className="rounded"
                />
                Select All ({filteredLeads.length})
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEnrollCampaignId(null);
                    setSelectedLeadIds(new Set());
                  }}
                  className="px-3 py-1.5 text-xs font-medium hover:bg-muted rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isEnrolling || selectedLeadIds.size === 0}
                  onClick={executeEnrollment}
                  className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded hover:bg-primary/90 transition-colors shadow-lg disabled:opacity-50"
                >
                  {isEnrolling ? 'Enrolling...' : `Enroll Selected (${selectedLeadIds.size})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Creation Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl border border-border shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
            <h3 className="font-extrabold text-lg mb-2 text-foreground">Create Smart Plan</h3>
            <p className="text-xs text-muted-foreground mb-4">Set up an automated sequence of touchpoints to convert prospects.</p>
            {error && <div className="mb-4 p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg">{error}</div>}

            <form action={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Campaign Name</label>
                <input required name="name" placeholder="e.g. Preforeclosure Drip Campaign" className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
                <textarea name="description" rows={3} placeholder="Describe the target audience or drip strategy..." className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-md hover:bg-primary/90 transition-colors shadow-lg"
                >
                  Save & Setup Steps
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
