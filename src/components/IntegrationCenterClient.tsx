'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  Search, ShieldAlert, Sparkles, Code2, Database, HelpCircle, MailCheck, UserPlus, Sliders, Globe2, CreditCard, ToggleRight, ToggleLeft
} from 'lucide-react';
import { MyPlusLeadsSettingsForm } from '@/components/MyPlusLeadsSettingsForm';

type PartnerProduct = {
  id: string;
  name: string;
  category: string;
  logo: string;
  description: string;
  connected: boolean;
};

const INITIAL_PARTNERS: PartnerProduct[] = [
  {
    id: 'shilo',
    name: 'Shilo.AI',
    category: 'AI Solutions',
    logo: '⚡',
    description: 'Shilo is the intuitive AI assistant built for high-performing real estate teams that listens, coaches, and guides your agents in real time so they can close with confidence.',
    connected: false
  },
  {
    id: 'myplus',
    name: 'MyPlusLeads',
    category: 'Lead Providers',
    logo: '🎯',
    description: 'Sync expired, FSBO, FRBO, and pre-foreclosure listings directly into your round-robin lead queues every morning automatically.',
    connected: true
  },
  {
    id: 'zapier',
    name: 'Zapier',
    category: 'API Services',
    logo: '🧡',
    description: 'Connect Excel Legacy with hundreds of supported services on Zapier. Set up custom triggers for new leads instantly.',
    connected: false
  },
  {
    id: 'apination',
    name: 'API Nation',
    category: 'API Services',
    logo: '🧩',
    description: 'Easily connect your CRM with Google Sheets, Outlook Contacts, dotloop, and DocuSign in just a few clicks.',
    connected: false
  },
  {
    id: 'realcomp',
    name: 'Realcomp MLS Michigan',
    category: 'Data Services',
    logo: '🏢',
    description: 'Realcomp II Ltd. is Michigans largest Multiple Listing Service. Sync live MLS data directly to your listing feeds.',
    connected: true
  }
];

const CATEGORIES = [
  'All',
  'AI Solutions',
  'API Services',
  'Back Office Management',
  'CRM Provider',
  'Data Services',
  'Email/Calendar',
  'Lead Providers',
  'Listing Tools',
  'Marketing',
  'Phone & Texting',
  'Website',
  'E-Sign',
  'Lead Tools'
];

export default function IntegrationCenterClient({
  initialData,
  workspaceId
}: {
  initialData: any;
  workspaceId: string;
}) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [partners, setPartners] = useState<PartnerProduct[]>(INITIAL_PARTNERS);
  
  // MyPlusLeads Configuration modal state
  const [activePartnerConfig, setActivePartnerConfig] = useState<string | null>(null);

  const toggleConnection = (id: string) => {
    if (id === 'myplus') {
      setActivePartnerConfig('myplus');
      return;
    }
    
    setPartners(partners.map(p => {
      if (p.id === id) {
        const nextState = !p.connected;
        toast.success(`${p.name} integration ${nextState ? 'enabled' : 'disabled'}.`);
        return { ...p, connected: nextState };
      }
      return p;
    }));
  };

  const filteredPartners = partners.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-foreground p-6">
      
      {/* Banner Notice Alert */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
          <span className="text-xs font-semibold text-foreground">
            We strongly advise that you select a unique email sending domain for improved deliverability and SPF settings.
          </span>
        </div>
        <button 
          onClick={() => toast.success('Redirecting to domain configuration setup...')}
          className="bg-amber-500 hover:bg-amber-600 text-white font-black uppercase text-[10px] tracking-wider px-4 py-2.5 rounded-xl transition-colors cursor-pointer w-fit shrink-0"
        >
          Configure Domain
        </button>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">Integration Center</h1>
        <p className="text-xs text-muted-foreground font-semibold mt-1">Connect third-party real estate platforms, MLS data feeds, and CRM tools.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
        
        {/* Left Categories Sidebar */}
        <div className="lg:col-span-3 space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider px-3 block mb-2">App Categories</span>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Right Partner List Grid */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Partner Apps or Services..."
              className="w-full bg-card border border-border/60 rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            />
          </div>

          <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground">Partner Products</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPartners.map(p => (
              <div key={p.id} className="bg-card border border-border/60 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-border transition-colors">
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-xl shrink-0">
                        {p.logo}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-foreground leading-tight">{p.name}</h4>
                        <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/60">{p.category}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleConnection(p.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase border cursor-pointer transition-colors ${
                        p.connected
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {p.connected ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                      {p.connected ? 'Active' : 'Configure'}
                    </button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground leading-relaxed font-semibold">{p.description}</p>
                </div>

                <div className="pt-3 border-t border-border/40 flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                  <button 
                    onClick={() => toggleConnection(p.id)}
                    className="text-indigo-500 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    {p.id === 'myplus' ? 'Configure Integration Settings →' : 'Learn More & Install →'}
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* MyPlusLeads Config dialog */}
      {activePartnerConfig === 'myplus' && (
        <div className="fixed inset-0 bg-background/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-border/40 pb-3">
              <h3 className="text-base font-black text-foreground uppercase tracking-wider">
                🎯 Configure MyPlusLeads Integration
              </h3>
              <button 
                onClick={() => setActivePartnerConfig(null)}
                className="text-muted-foreground hover:text-foreground text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto max-h-[480px]">
              <MyPlusLeadsSettingsForm initialData={initialData} workspaceId={workspaceId} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
