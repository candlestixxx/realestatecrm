'use client';

import { useState } from 'react';
import { 
  Play, BookOpen, CheckCircle, ChevronRight, Settings, Phone, MessageSquare, Mail, Sparkles, Globe, ShieldAlert 
} from 'lucide-react';

type VideoTopic = {
  id: string;
  title: string;
  category: string;
  description: string;
  steps: string[];
  simulationLogs: string[];
};

const VIDEOS: VideoTopic[] = [
  {
    id: 'leads',
    title: 'Lead Management & Smart Routing',
    category: 'Leads & Contacts',
    description: 'Learn how multiple numbers validation, spouse syncing, and automatic round-robin team distribution routes incoming MyPlusLeads.',
    steps: [
      'Navigate to Leads panel to see auto-validated phone number states.',
      'Check detailed timeline logs identifying parsed spouse, co-owner, and property remarks details.',
      'Configure Round-Robin routing in settings to spread new leads among agent profiles.'
    ],
    simulationLogs: [
      '⚡ [System] Lead captured from provider "MyPlusLeads"',
      '🔍 [Validator] Validating phone numbers (+1 586-344-0852: Valid Cell)',
      '👤 [Contact] Co-owner "Jane Ferguson" synchronized and linked.',
      '🔄 [Router] Applying team assignment rule: Assign to "Harry Lum"',
      '📝 [Timeline] Logged Note: Detailed Summary synced from MyPlusLeads.'
    ]
  },
  {
    id: 'campaigns',
    title: 'Smart Plans & Drip Campaigns',
    category: 'Automations',
    description: 'Set up automated email sequences, text message touches, and task checklists that activate when specific tags match.',
    steps: [
      'Go to Campaigns and click Create Campaign.',
      'Create step sequences with custom delay intervals (e.g. Day 1: Send SMS, Day 3: Call task).',
      'Select multiple leads in the table and enroll them in a Smart Plan mass action.'
    ],
    simulationLogs: [
      '🤖 [Campaign] Active Plan "New Expired Outreach" triggered.',
      '⏳ [Delay] Pausing sequence for 2 hours...',
      '✉️ [SMTP] Sending template "First Intro Email" to Taylor Ferguson...',
      '📱 [SMS] Sending automated SMS: "Hi Taylor, is this property still available?"',
      '✅ [Campaign] Step 1 complete. Next action scheduled for Day 3.'
    ]
  },
  {
    id: 'instagen',
    title: 'INSTA GEN "NEW" AI Landing Page Creator',
    category: 'Websites & Landing Pages',
    description: 'Prompt a full landing page like Gemini, upload images, select networks checklist, and publish to generate public URLs.',
    steps: [
      'Open Landing Page Portal and select INSTA GEN "NEW".',
      'Click the floating "+" button to insert Guided Valuation or Open House prompts.',
      'Check the social distribution checklist (YouTube, Facebook, GMB, Reddit).',
      'Click Publish to get your live portal link (/portal/site/slug).'
    ],
    simulationLogs: [
      '✨ [AI] Processing prompt: "Generate page for 8485 Sherman Ave with valuation widget"',
      '🎨 [Canvas] Assembled block: Header Layout',
      '📸 [Media] Simulated photo upload: Added premium home showcase graphic',
      '🔗 [Publish] Public page generated: http://localhost:3000/portal/site/8485-sherman-ave',
      '📢 [Social] Shared post simulated on Google Business Profile & YouTube.'
    ]
  },
  {
    id: 'textcodes',
    title: 'SMS Sign Riders & Keyword Capture',
    category: 'Marketing',
    description: 'Configure SMS text keywords for yard signs that text prospects list prices and photos back instantly.',
    steps: [
      'Navigate to SMS Text Codes in the marketing submenus.',
      'Create a keyword (e.g. 8485SHERMAN) and select your broker number.',
      'Write the auto-reply text template containing the landing page URL.',
      'Text keyword from any mobile phone to test lead capture.'
    ],
    simulationLogs: [
      '💬 [SMS Engine] Incoming text message to (586) 555-0190: "8485SHERMAN"',
      '👤 [Lead Capture] Creating new Lead: "Owner of 8485 Sherman Ave" (Phone: +1 586-555-0199)',
      '✉️ [Reply] Sending reply: "Thanks for inquiring! View list price & photos: http://localhost:3000/portal/site/8485-sherman"',
      '📈 [Analytics] SMS Code "8485SHERMAN" total hits updated to 15.'
    ]
  }
];

export default function HelpCenterPage() {
  const [activeTopic, setActiveTopic] = useState<VideoTopic>(VIDEOS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const startSimulation = () => {
    setIsPlaying(true);
    setCurrentStep(0);
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= activeTopic.simulationLogs.length - 1) {
          clearInterval(interval);
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1800);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="border-b border-border/40 pb-5">
        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
          📖 CRM Help Center & Training Portal
        </h1>
        <p className="text-sm text-muted-foreground font-semibold mt-1">
          Interactive simulation videos and master operator manuals for the Excel Legacy CRM features.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sidebar Topics */}
        <div className="lg:col-span-1 space-y-3">
          <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider px-2 block mb-1">Select Help Topic</span>
          {VIDEOS.map(video => (
            <button
              key={video.id}
              onClick={() => {
                setActiveTopic(video);
                setIsPlaying(false);
                setCurrentStep(0);
              }}
              className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                activeTopic.id === video.id
                  ? 'bg-primary/5 border-primary/20 text-primary shadow-xs'
                  : 'bg-card border-border/60 hover:border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="text-[9px] font-black uppercase tracking-widest bg-muted px-2 py-0.5 rounded w-fit text-muted-foreground">
                {video.category}
              </span>
              <span className="font-extrabold text-xs">{video.title}</span>
            </button>
          ))}

          {/* Quick Config references */}
          <div className="bg-card border border-border/60 rounded-xl p-4 space-y-3.5 mt-6">
            <span className="text-[10px] font-black text-foreground uppercase tracking-wider block border-b border-border/40 pb-1.5">⚙️ Configuration Quick Links</span>
            
            <div className="space-y-2 text-[11px] font-bold text-muted-foreground">
              <div className="flex justify-between items-center">
                <span>SMTP Personal Email Host:</span>
                <code className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-semibold text-foreground">smtp.gmail.com</code>
              </div>
              <div className="flex justify-between items-center">
                <span>Amazon SES Region:</span>
                <code className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-semibold text-foreground">us-east-1</code>
              </div>
              <div className="flex justify-between items-center">
                <span>Native Call Dialer Protocol:</span>
                <code className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-semibold text-foreground">tel:</code>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Video Simulation Screen */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Visualizer */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col aspect-video relative group">
            
            {/* Overlay simulation */}
            {isPlaying ? (
              <div className="flex-1 flex flex-col justify-end p-6 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent">
                <div className="space-y-2 max-w-lg">
                  <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded uppercase tracking-wider w-fit">
                    ⚡ Live CRM Operations Log Simulation
                  </span>
                  
                  <div className="space-y-1.5 font-mono text-[11px] text-slate-300 min-h-[120px] transition-all">
                    {activeTopic.simulationLogs.slice(0, currentStep + 1).map((log, index) => (
                      <div key={index} className="animate-fadeIn truncate">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-900 space-y-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0 group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 fill-primary" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-slate-200">Interactive Walk-Through Player</h4>
                  <p className="text-[11px] text-slate-400 max-w-sm">
                    Click play to run a live visual console simulation showing this feature in action.
                  </p>
                </div>
                <button
                  onClick={startSimulation}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl transition-all cursor-pointer shadow"
                >
                  Play Simulation
                </button>
              </div>
            )}

            {/* Video Progress Bar */}
            <div className="h-1 bg-slate-800 w-full relative">
              <div 
                className="h-full bg-primary transition-all duration-500" 
                style={{ width: `${((currentStep + (isPlaying ? 1 : 0)) / activeTopic.simulationLogs.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Description & Guide Steps */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-4 shadow-xs">
            <div>
              <h3 className="font-black text-lg text-foreground">{activeTopic.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1 font-semibold">
                {activeTopic.description}
              </p>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-border/40">
              <span className="text-[10px] text-foreground uppercase font-black tracking-wider block">Step-By-Step Instructions:</span>
              <div className="space-y-2 text-xs font-semibold text-muted-foreground">
                {activeTopic.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
