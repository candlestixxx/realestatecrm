'use client';

import { useState, useMemo } from 'react';
import CampaignEditor from './CampaignEditor';
import {
  importCampaignTemplateAction,
  toggleCampaignStatusAction,
  toggleCampaignAutoApplyAction,
  deleteCampaignAction,
  createCampaignAction
} from '@/lib/actions/campaign';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { 
  FolderPlus, 
  Search, 
  Eye, 
  Settings, 
  Trash2, 
  Sparkles,
  Layers,
  Clock,
  Compass,
  FileText,
  Bookmark,
  Share2,
  Mail,
  MessageSquare,
  PhoneCall,
  Activity
} from 'lucide-react';

type SegmentOption = {
  id: string;
  name: string;
};

const REAL_ESTATE_TEMPLATES = [
  {
    name: 'ELRT-Pre Foreclosure GPT',
    description: 'When a Seller lead is reassigned, this plan launches a paced outreach campaign designed to re-engage them and move them through the pipeline. It updates the pipeline, then sends an email and automated text.',
    leadType: 'Equals To: Seller',
    duration: 216,
    scope: 'COMPANY',
    steps: [
      { id: '1', type: 'TASK', delayValue: 0, delayUnit: 'SECOND', content: 'Change Pipeline Stage to Preforeclosure' },
      { id: '2', type: 'EMAIL', delayValue: 5, delayUnit: 'MINUTE', subject: 'Facing Pre Foreclosure?', content: 'Hi, I saw your property notices and wanted to see if we can chat about options to protect your equity...' },
      { id: '3', type: 'SMS', delayValue: 10, delayUnit: 'MINUTE', content: 'Hi, know your options. I specialize in preforeclosure resolutions in Macomb County. Let me know if you want to chat.' },
      { id: '4', type: 'CALL', delayValue: 1, delayUnit: 'DAY', content: 'Call lead to discuss short sale or modification options.' }
    ]
  },
  {
    name: 'ELRT PreForeclosure Campaign',
    description: 'Brokerage-wide preforeclosure campaign to nurture leads facing home foreclosure notices. Sends a paced combination of educational guides and check-ins.',
    leadType: 'Include one of: Buyer, Seller',
    duration: 342,
    scope: 'COMPANY',
    steps: [
      { id: '1', type: 'EMAIL', delayValue: 1, delayUnit: 'DAY', subject: 'Foreclosure Help Packet', content: 'Here is a list of options you can take to stop foreclosure. Don\'t ignore the banks.' },
      { id: '2', type: 'SMS', delayValue: 3, delayUnit: 'DAY', content: 'Hi, just following up to make sure you got the Foreclosure Help PDF I sent you? I\'m here to help.' },
      { id: '3', type: 'CALL', delayValue: 7, delayUnit: 'DAY', content: 'Call lead to offer free CMA evaluation.' }
    ]
  },
  {
    name: 'B-Lead wants to buy after 12 months',
    description: 'Long-term nurture campaign for buyers who are planning to buy a home more than a year from now. Sends soft market updates and quarterly check-ins.',
    leadType: 'Include one of: Buyer',
    duration: 379,
    scope: 'COMPANY',
    steps: [
      { id: '1', type: 'EMAIL', delayValue: 3, delayUnit: 'MONTH', subject: 'Market Trends Update', content: 'Hi! Here is how the housing inventory is looking this quarter. We still have a year to plan, but it\'s good to keep tabs on prices.' },
      { id: '2', type: 'SMS', delayValue: 6, delayUnit: 'MONTH', content: 'Hi! Checking in to see if your timeline is still around next year? Hope all is well.' }
    ]
  },
  {
    name: 'S-Lead wants to sell within 3 months',
    description: 'High-frequency seller campaign for homeowners looking to list their property soon. Pushes market valuations and home prep guides.',
    leadType: 'Include one of: Seller',
    duration: 90,
    scope: 'COMPANY',
    steps: [
      { id: '1', type: 'EMAIL', delayValue: 1, delayUnit: 'DAY', subject: 'Prep your home for listing', content: 'Here are 5 cheap repairs that increase your home value by 10% before listing.' },
      { id: '2', type: 'CALL', delayValue: 3, delayUnit: 'DAY', content: 'Call to set up walk-through and listing consultation.' }
    ]
  },
  {
    name: 'S-Lead wants to sell after 12 months',
    description: 'Long-term nurture campaign for seller prospects planning to list their homes next year.',
    leadType: 'Include one of: Seller',
    duration: 379,
    scope: 'COMPANY',
    steps: [
      { id: '1', type: 'EMAIL', delayValue: 3, delayUnit: 'MONTH', subject: 'Property Valuations in your neighborhood', content: 'Hi! Here is the latest sales report for your zip code. We have plenty of time, but it\'s great to watch the local trend.' }
    ]
  },
  {
    name: 'Dialer List Campaign',
    description: 'Trigger-based campaign to organize leads for active dialer list follow-up sessions.',
    leadType: 'Equals To: Seller',
    duration: 238,
    scope: 'COMPANY',
    steps: [
      { id: '1', type: 'TASK', delayValue: 0, delayUnit: 'SECOND', content: 'Add to Dialer Queue' }
    ]
  },
  {
    name: 'ELRT- Expired GPT',
    description: 'Automated AI-assisted campaign to target expired listings in MLS databases, providing quick value propositions to re-list.',
    leadType: 'Equals To: Seller',
    duration: 417,
    scope: 'COMPANY',
    steps: [
      { id: '1', type: 'SMS', delayValue: 10, delayUnit: 'MINUTE', content: 'Hi, I saw your listing expired. If you still want to sell, I have a custom strategy that works. Let\'s chat!' }
    ]
  },
  {
    name: 'CANCELED: BULK RECONNECT',
    description: 'Re-engage seller leads as soon as they are created. Immediately updates segment to Expireds, then sends an automated text followed by an automated email to initiate contact. After initial outreach, waits 7 days, then sends another text to maintain contact.',
    leadType: 'Include one of: Seller',
    duration: 7,
    scope: 'COMPANY',
    steps: [
      { id: '1', type: 'TASK', delayValue: 0, delayUnit: 'SECOND', content: 'Change Segment to Expireds' },
      { id: '2', type: 'SMS', delayValue: 5, delayUnit: 'MINUTE', content: 'Hi, I wanted to reconnect regarding your listing. Let me know if you have a quick 5 minutes to chat?' },
      { id: '3', type: 'EMAIL', delayValue: 10, delayUnit: 'MINUTE', subject: 'Reconnecting on your listing', content: 'Hi! I saw we lost contact. Here is a custom market plan for your property. Let me know if you still want to get it sold.' },
      { id: '4', type: 'SMS', delayValue: 7, delayUnit: 'DAY', content: 'Hi, just following up to make sure you got my email? Happy to chat whenever you are free.' }
    ]
  }
];

type CampaignsListClientProps = {
  campaigns: any[];
  leads: any[];
  segments: SegmentOption[];
};

export default function CampaignsListClient({
  campaigns,
  leads = [],
  segments = [],
}: CampaignsListClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'plans' | 'library'>('plans');
  const [planSearch, setPlanSearch] = useState('');
  
  // Folders layout state
  const [myFolders, setMyFolders] = useState<string[]>(['Follow-up Folder', 'Lead Gen Sequence']);
  const [companyFolders, setCompanyFolders] = useState<string[]>(['Preforeclosure Folder', 'Expireds List Folder']);
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [newFolderName, setNewFolderName] = useState('');
  const [showAddFolder, setShowAddFolder] = useState(false);

  // Filters
  const [leadTypeFilter, setLeadTypeFilter] = useState<'ALL' | 'BUYER' | 'SELLER'>('ALL');
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  
  // Custom Campaign Form State
  const [isAdding, setIsAdding] = useState(false);

  // Filter campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      // Search term
      if (planSearch && !c.name.toLowerCase().includes(planSearch.toLowerCase())) {
        return false;
      }
      
      // Lead Type category buttons
      let settings: any = {};
      try {
        if (c.steps) {
          const parsed = JSON.parse(c.steps);
          settings = parsed.settings || {};
        }
      } catch (e) {}

      const lType = (settings.leadType || c.leadType || 'BOTH').toUpperCase();
      if (leadTypeFilter === 'BUYER' && !lType.includes('BUYER') && !lType.includes('BOTH')) {
        return false;
      }
      if (leadTypeFilter === 'SELLER' && !lType.includes('SELLER') && !lType.includes('BOTH')) {
        return false;
      }

      // Folder filtering matching mock categorization
      if (selectedFolder === 'Follow-up Folder' && !c.name.toLowerCase().includes('nurture') && !c.name.toLowerCase().includes('connect')) return false;
      if (selectedFolder === 'Preforeclosure Folder' && !c.name.toLowerCase().includes('foreclosure')) return false;
      if (selectedFolder === 'Expireds List Folder' && !c.name.toLowerCase().includes('expired')) return false;

      return true;
    });
  }, [campaigns, planSearch, selectedFolder, leadTypeFilter]);

  const handleImportTemplate = async (template: typeof REAL_ESTATE_TEMPLATES[0]) => {
    const loadingToast = toast.loading(`Importing "${template.name}" template...`);
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
        toast.success(`"${template.name}" successfully added to your active plans!`);
        router.refresh();
      }
    } catch {
      toast.dismiss(loadingToast);
      toast.error('Failed to import campaign.');
    }
  };

  const handleToggleAutoApply = async (id: string, currentStatus: boolean) => {
    try {
      const res = await toggleCampaignAutoApplyAction(id, !currentStatus);
      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success(!currentStatus ? 'Auto Apply Activated' : 'Auto Apply Deactivated');
        router.refresh();
      }
    } catch (e) {
      toast.error('Failed to toggle auto apply.');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this smart plan?')) return;
    try {
      const res = await deleteCampaignAction(id);
      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success('Campaign plan deleted.');
        router.refresh();
      }
    } catch {
      toast.error('Failed to delete campaign.');
    }
  };

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      setMyFolders([...myFolders, newFolderName.trim()]);
      setNewFolderName('');
      setShowAddFolder(false);
      toast.success('Folder created successfully!');
    }
  };

  const activeCampaign = campaigns.find((c) => c.id === activeCampaignId);

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Segment matching Lofty layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4 bg-background">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black text-foreground tracking-tight">Smart Plans</h1>
          
          {/* Tabs switch */}
          <div className="bg-muted/50 border border-border p-1 rounded-lg flex items-center">
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-4 py-1 text-xs font-bold rounded-md transition-all ${
                activeTab === 'plans' 
                  ? 'bg-background text-primary shadow-sm border border-border/30' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Plans
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`px-4 py-1 text-xs font-bold rounded-md transition-all ${
                activeTab === 'library' 
                  ? 'bg-background text-primary shadow-sm border border-border/30' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Library
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/95 transition-colors shadow-sm"
        >
          + Create Smart Plan
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Lofty Folders Sidebar */}
        <div className="lg:col-span-1 bg-background border border-border rounded-2xl p-4 space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by plan name..."
                value={planSearch}
                onChange={(e) => setPlanSearch(e.target.value)}
                className="w-full bg-muted/20 border border-border pl-9 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Folder Lists */}
            <div className="space-y-4">
              <button
                onClick={() => setSelectedFolder('all')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between transition-colors ${
                  selectedFolder === 'all' 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                }`}
              >
                <span>📂 All Smart Plans</span>
                <span className="bg-muted/50 text-[10px] px-1.5 py-0.5 rounded border border-border">
                  {campaigns.length}
                </span>
              </button>

              {/* MY FOLDERS */}
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block px-3 mb-1">
                  My Folders
                </span>
                {myFolders.map((folder, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedFolder(folder)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                      selectedFolder === folder 
                        ? 'bg-secondary/15 text-secondary border border-secondary/20 font-bold' 
                        : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                    }`}
                  >
                    <span className="truncate">📁 {folder}</span>
                  </button>
                ))}
              </div>

              {/* COMPANY FOLDERS */}
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block px-3 mb-1">
                  Company Folders
                </span>
                {companyFolders.map((folder, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedFolder(folder)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                      selectedFolder === folder 
                        ? 'bg-secondary/15 text-secondary border border-secondary/20 font-bold' 
                        : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                    }`}
                  >
                    <span className="truncate">🏢 {folder}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Add Folder inputs */}
          <div className="border-t border-border pt-4">
            {showAddFolder ? (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="New folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowAddFolder(false)} className="px-2 py-1 text-[10px] text-muted-foreground hover:underline">
                    Cancel
                  </button>
                  <button onClick={handleAddFolder} className="px-3 py-1 bg-secondary text-secondary-foreground text-[10px] rounded font-bold hover:bg-secondary/90">
                    Add
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddFolder(true)}
                className="w-full text-left px-3 py-1.5 text-xs text-primary font-bold hover:underline flex items-center gap-1.5"
              >
                <FolderPlus className="w-4 h-4" />
                + Add Folder
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Tab Contents (Plans or Library) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* TAB 1: ACTIVE PLANS TABLE VIEW (Screenshot 2) */}
          {activeTab === 'plans' && (
            <div className="space-y-4">
              
              {/* Category Filter row */}
              <div className="flex items-center justify-between border border-border bg-muted/20 px-4 py-2 rounded-xl text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground mr-2 select-none">Lead Type Filter:</span>
                  <button
                    onClick={() => setLeadTypeFilter('ALL')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase transition-all ${
                      leadTypeFilter === 'ALL'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-background hover:bg-muted text-muted-foreground border border-border'
                    }`}
                  >
                    All Types
                  </button>
                  <button
                    onClick={() => setLeadTypeFilter('BUYER')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase transition-all ${
                      leadTypeFilter === 'BUYER'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-background hover:bg-muted text-muted-foreground border border-border'
                    }`}
                  >
                    Buyer
                  </button>
                  <button
                    onClick={() => setLeadTypeFilter('SELLER')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase transition-all ${
                      leadTypeFilter === 'SELLER'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-background hover:bg-muted text-muted-foreground border border-border'
                    }`}
                  >
                    Seller
                  </button>
                </div>
                <div className="text-[10px] font-bold text-muted-foreground select-none">
                  Total Active: {filteredCampaigns.length} campaigns
                </div>
              </div>

              {/* Table */}
              <div className="bg-background border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border uppercase font-bold text-muted-foreground tracking-wider">
                        <th className="p-3 w-8"><input type="checkbox" className="rounded" /></th>
                        <th className="p-3">Plan Name</th>
                        <th className="p-3">Scope</th>
                        <th className="p-3">Lead Type</th>
                        <th className="p-3 text-center">Duration</th>
                        <th className="p-3">Application Criteria</th>
                        <th className="p-3 text-center">Auto Apply</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
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

                        // Calculate mock durations
                        const durationText = c.duration ? `${c.duration} days` : '0 day';
                        const scopeText = c.scope === 'COMPANY' ? 'Company Plan' : 'Individual Plan';

                        // Format auto apply text
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
                          <tr key={c.id} className="hover:bg-muted/5 transition-colors">
                            <td className="p-3"><input type="checkbox" className="rounded border-border bg-background" /></td>
                            <td className="p-3">
                              <span className="font-bold text-sm text-foreground block">{c.name}</span>
                              <span className="text-[10px] text-muted-foreground line-clamp-1 max-w-[200px]">
                                {c.description || 'No description provided.'}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 border rounded uppercase text-[9px] font-bold ${
                                c.scope === 'COMPANY' 
                                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                                  : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                              }`}>
                                {scopeText}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-muted-foreground">
                              {c.leadType || settings.leadType || 'Buyer'}
                            </td>
                            <td className="p-3 text-center font-bold text-foreground">
                              {durationText}
                            </td>
                            <td className="p-3 font-medium text-muted-foreground max-w-[150px] truncate">
                              {conditionText}
                            </td>
                            <td className="p-3">
                              <div className="flex justify-center items-center">
                                {/* Lofty blue active toggle switch */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleAutoApply(c.id, c.autoApply)}
                                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    c.autoApply ? 'bg-primary' : 'bg-muted'
                                  }`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-sm ring-0 transition duration-200 ease-in-out ${
                                      c.autoApply ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                  />
                                </button>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2.5">
                                <button
                                  onClick={() => setActiveCampaignId(c.id)}
                                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-primary transition-all"
                                  title="View Flowchart Canvas"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setActiveCampaignId(c.id)}
                                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-all"
                                  title="Configure Settings"
                                >
                                  <Settings className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCampaign(c.id)}
                                  className="p-1 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-500 transition-all"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredCampaigns.length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-muted-foreground">
                            No campaigns active. Import some from the **Library** or click **Create Smart Plan**.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIBRARY CARDS VIEW (Screenshot 1) */}
          {activeTab === 'library' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {REAL_ESTATE_TEMPLATES.map((tmpl, idx) => (
                <div
                  key={idx}
                  className="bg-card border border-border hover:border-primary/40 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-black uppercase text-secondary bg-secondary/10 px-2 py-0.5 border border-secondary/20 rounded">
                        {tmpl.leadType}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {tmpl.duration} Days
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="font-extrabold text-base text-foreground line-clamp-1">{tmpl.name}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-3">
                        {tmpl.description}
                      </p>
                    </div>
                    
                    {/* Visual icons grid representing SMS, Email, Tasks sequence */}
                    <div className="bg-muted/10 border border-border/40 p-3 rounded-xl flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        {tmpl.steps.map((s, sIdx) => (
                          <span 
                            key={sIdx}
                            className={`p-1.5 rounded-lg border flex items-center justify-center ${
                              s.type === 'EMAIL' ? 'bg-blue-500/10 text-blue-500 border-blue-500/25' :
                              s.type === 'SMS' ? 'bg-green-500/10 text-green-500 border-green-500/25' :
                              s.type === 'CALL' ? 'bg-amber-500/10 text-amber-500 border-amber-500/25' :
                              'bg-slate-500/10 text-slate-500 border-slate-500/25'
                            }`}
                            title={`Step ${sIdx + 1}: ${s.type}`}
                          >
                            {s.type === 'EMAIL' ? <Mail className="w-3.5 h-3.5" /> :
                             s.type === 'SMS' ? <MessageSquare className="w-3.5 h-3.5" /> :
                             s.type === 'CALL' ? <PhoneCall className="w-3.5 h-3.5" /> :
                             <Activity className="w-3.5 h-3.5" />}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase">
                        {tmpl.steps.length} Steps
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center gap-2 mt-4 border-t border-border/60">
                    <button
                      onClick={() => handleImportTemplate(tmpl)}
                      className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground text-xs font-extrabold rounded-lg hover:bg-secondary/90 transition-all shadow-sm text-center"
                    >
                      Use Template
                    </button>
                    <button
                      onClick={() => {
                        // Mock details preview
                        toast.success(`Opening preview for: ${tmpl.name}`);
                      }}
                      className="p-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
                      title="Preview Steps"
                    >
                      <Eye className="w-4 h-4" />
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
          initialActive={activeCampaign.isActive}
          segments={segments}
          onClose={() => {
            setActiveCampaignId(null);
            router.refresh();
          }}
        />
      )}

      {/* Inline Create Campaign Form Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-background border border-border shadow-xl rounded-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
              <h3 className="font-bold text-md text-foreground">Create New Smart Plan</h3>
              <button onClick={() => setIsAdding(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const res = await createCampaignAction(formData);
                if (res.error) {
                  toast.error(res.error);
                } else {
                  toast.success('Smart Plan created successfully!');
                  setIsAdding(false);
                  router.refresh();
                }
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div className="space-y-1">
                <label className="block font-bold text-muted-foreground uppercase">Campaign Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. ELRT Expired Follow Up"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-muted-foreground uppercase">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Summarize the outreach strategy..."
                  className="w-full bg-background border border-border rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-muted-foreground uppercase">Plan Scope</label>
                  <select name="scope" className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-sm">
                    <option value="COMPANY">Company Plan (Brokerage)</option>
                    <option value="INDIVIDUAL">Individual Plan (Personal)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-muted-foreground uppercase">Lead Type</label>
                  <select name="leadType" className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-sm">
                    <option value="Buyer">Buyer</option>
                    <option value="Seller">Seller</option>
                    <option value="Both">Both (Buyer/Seller)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 border border-border rounded-lg text-xs font-bold text-muted-foreground hover:bg-muted/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/95 transition-colors"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
