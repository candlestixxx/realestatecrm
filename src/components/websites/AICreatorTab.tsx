'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  Sparkles, Send, Play, MapPin, Eye, FileText, Share2, Plus, ChevronDown, CheckSquare, Square, RefreshCw, ArrowLeft, ArrowRight, Save, Image, Video, Paperclip, Settings
} from 'lucide-react';
import { createLandingPageAction, updateLandingPageBlocksAction } from '@/lib/actions/website';
import { useRouter } from 'next/navigation';

type ChatMessage = {
  role: 'user' | 'model';
  content: string;
  media?: string[];
};

type GeneratedBlock = {
  id: string;
  type: 'HEADER' | 'VIDEO' | 'PROPERTY' | 'LEAD_CAPTURE' | 'LINKS';
  title?: string;
  subtitle?: string;
  videoUrl?: string;
  address?: string;
  price?: number;
  beds?: number;
  baths?: number;
  remarks?: string;
  ctaText?: string;
};

export default function AICreatorTab({ workspaceId }: { workspaceId: string }) {
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: 'model',
      content: 'Hello! I am INSTA GEN "NEW". Let me create your next high-converting real estate landing page. Click the "+" button inside the chat box to select guided templates, upload media, or custom lead capture configurations!'
    }
  ]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTitle, setGeneratedTitle] = useState('AI Generated Landing Page');
  const [generatedSlug, setGeneratedSlug] = useState('ai-tour');
  const [blocks, setBlocks] = useState<GeneratedBlock[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Helper dropdown menu state
  const [showHelperMenu, setShowHelperMenu] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<string[]>([]);

  // Publish & Tracking Settings (Phase 3)
  const [subdomain, setSubdomain] = useState('excel-legacy');
  const [fbPixelId, setFbPixelId] = useState('');
  const [gaId, setGaId] = useState('');
  const [gmbVerification, setGmbVerification] = useState('');
  const [customHeaderScripts, setCustomHeaderScripts] = useState('');
  const [customBodyScripts, setCustomBodyScripts] = useState('');

  const [showPublishedModal, setShowPublishedModal] = useState(false);

  const router = useRouter();

  const handleSendPrompt = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim() && uploadedMedia.length === 0) return;

    setChatHistory(prev => [
      ...prev, 
      { role: 'user', content: finalPrompt || 'Uploaded Media Attachments', media: uploadedMedia }
    ]);
    setPrompt('');
    setUploadedMedia([]);
    setShowHelperMenu(false);
    setIsGenerating(true);

    setTimeout(() => {
      let title = 'Excel Legacy Listing presentation';
      let slug = 'instant-tour-' + Math.floor(Math.random() * 1000);
      let newBlocks: GeneratedBlock[] = [];

      const lower = finalPrompt.toLowerCase();
      if (lower.includes('valuation') || lower.includes('home worth')) {
        title = 'Home Valuation Report - Excel Legacy';
        slug = 'michigan-home-valuation';
        newBlocks = [
          {
            id: 'h1',
            type: 'HEADER',
            title: 'What Is Your Michigan Home Actually Worth Today?',
            subtitle: 'Get an instant valuation report based on recent active listings and sales in Macomb & Oakland counties.'
          },
          {
            id: 'lc1',
            type: 'LEAD_CAPTURE',
            ctaText: 'Get My Free Market Valuation Report'
          }
        ];
      } else if (lower.includes('brand') || lower.includes('company') || lower.includes('recruiting')) {
        title = 'Excel Legacy Realty Team Brand Page';
        slug = 'legacy-team-brand';
        newBlocks = [
          {
            id: 'h1',
            type: 'HEADER',
            title: 'Partner with the Excel Legacy Realty Team',
            subtitle: 'Real estate operations built on integrity, local expertise, and cutting-edge CRM marketing tech.'
          },
          {
            id: 'v1',
            type: 'VIDEO',
            title: 'Why Real Estate Agents Partner With Excel Legacy',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
          },
          {
            id: 'lc1',
            type: 'LEAD_CAPTURE',
            ctaText: 'Join the Excel Legacy Team'
          }
        ];
      } else {
        title = 'Exclusive Open House RSVP - Excel Legacy';
        slug = 'open-house-rsvp';
        newBlocks = [
          {
            id: 'h1',
            type: 'HEADER',
            title: 'RSVP: Upcoming Premier Open House Event',
            subtitle: 'Register today to reserve your walkthrough schedule and receive gate codes ahead of the crowd.'
          },
          {
            id: 'p1',
            type: 'PROPERTY',
            address: '56423 Schoenherr Rd, Macomb County, MI 48042',
            price: 425000,
            beds: 4,
            baths: 3,
            remarks: 'Stunning modern chef kitchen, spacious backyard pool deck, open-concept layout.'
          },
          {
            id: 'lc1',
            type: 'LEAD_CAPTURE',
            ctaText: 'Reserve My Open House Tour Slot'
          }
        ];
      }

      setGeneratedTitle(title);
      setGeneratedSlug(slug);
      setBlocks(newBlocks);
      setChatHistory(prev => [
        ...prev,
        {
          role: 'model',
          content: `I have compiled a custom landing page canvas layout titled "${title}" using target parameters. Click the "Verify Outline" button below to review headings, layout blocks, and edit content in Step 2!`
        }
      ]);
      setIsGenerating(false);
      toast.success('Landing page blocks generated successfully!');
    }, 1500);
  };

  const handleBlockChange = (index: number, field: keyof GeneratedBlock, val: any) => {
    const next = [...blocks];
    next[index] = { ...next[index], [field]: val };
    setBlocks(next);
  };

  const handleSavePage = async (status: 'DRAFT' | 'PUBLISHED') => {
    setIsSaving(true);
    const formData = new FormData();
    formData.append('title', generatedTitle);
    formData.append('slug', generatedSlug);
    formData.append('workspaceId', workspaceId);
    formData.append('subdomain', subdomain);

    const res = await createLandingPageAction(formData);
    if (res && res.error) {
      toast.error(res.error);
      setIsSaving(false);
    } else {
      if (!res.landingPageId) {
        toast.error('Page created, but ID was not returned.');
        setIsSaving(false);
        return;
      }
      try {
        await updateLandingPageBlocksAction(res.landingPageId, JSON.stringify(blocks));
        if (status === 'PUBLISHED') {
          setShowPublishedModal(true);
        } else {
          toast.success('Page layout draft saved.');
          setWizardStep(1);
          setBlocks([]);
        }
        router.refresh();
      } catch (e) {
        toast.error('Publish blocks failed.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const selectOption = (opt: string) => {
    setShowHelperMenu(false);
    if (opt === 'VALUATION') {
      handleSendPrompt(undefined, 'Create a Home Valuation page for Oakland county home values');
    } else if (opt === 'BRAND') {
      handleSendPrompt(undefined, 'Create a Company Brand page for Excel Legacy Realty');
    } else if (opt === 'IMAGE') {
      const url = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=350&q=80';
      setUploadedMedia([...uploadedMedia, url]);
      toast.success('Simulated photo attached! Type prompt to finalize.');
    } else if (opt === 'VIDEO') {
      const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      setUploadedMedia([...uploadedMedia, url]);
      toast.success('Simulated video link attached! Type prompt to finalize.');
    }
  };

  return (
    <div className="space-y-6 text-foreground">
      
      {/* Wizard Step Navigation */}
      <div className="flex items-center justify-between bg-muted/30 border border-border/60 rounded-2xl p-4.5">
        <span className="text-xs font-black uppercase text-indigo-500 tracking-wider">INSTA GEN Creator Wizard</span>
        <div className="flex gap-2 text-[10px] font-black uppercase tracking-wider">
          <span className={`px-2 py-1 rounded-lg ${wizardStep === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>1. Prompt & Chat</span>
          <span className={`px-2 py-1 rounded-lg ${wizardStep === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>2. Verify Outline</span>
          <span className={`px-2 py-1 rounded-lg ${wizardStep === 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>3. Meta & Publish</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[580px]">
        
        {/* Left Phase Control Column */}
        <div className="lg:col-span-5 bg-card border border-border/60 rounded-2xl flex flex-col overflow-hidden shadow-sm h-[580px] relative">
          
          {wizardStep === 1 && (
            <>
              {/* Chat history panel */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col max-w-[85%] rounded-2xl p-3.5 text-xs font-semibold leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-primary/10 border border-primary/20 text-foreground ml-auto' 
                        : 'bg-muted/50 border border-border/40 text-muted-foreground'
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">
                      {msg.role === 'user' ? 'Operator' : 'INSTA GEN AI'}
                    </span>
                    <span>{msg.content}</span>
                    {msg.media && msg.media.length > 0 && (
                      <div className="flex gap-1.5 mt-2 overflow-x-auto">
                        {msg.media.map((url, i) => (
                          <img key={i} src={url} alt="Attached asset" className="w-12 h-12 object-cover rounded border border-border" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {isGenerating && (
                  <div className="flex max-w-[85%] rounded-2xl p-3.5 bg-muted/50 border border-border/40 text-muted-foreground animate-pulse text-xs font-semibold items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Compiling layout blocks...
                  </div>
                )}
              </div>

              {/* Uploaded Media Previews */}
              {uploadedMedia.length > 0 && (
                <div className="px-4 py-2 border-t border-border/40 flex gap-2 bg-muted/10">
                  {uploadedMedia.map((url, i) => (
                    <div key={i} className="relative w-10 h-10 border border-border rounded overflow-hidden">
                      <img src={url} alt="To upload preview" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setUploadedMedia(uploadedMedia.filter((_, idx) => idx !== i))}
                        className="absolute top-0 right-0 bg-rose-500 text-white text-[8px] px-1 rounded-bl"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Chat input box */}
              <form onSubmit={(e) => handleSendPrompt(e)} className="p-4 border-t border-border/40 flex gap-2 relative bg-muted/10 items-center">
                <button
                  type="button"
                  onClick={() => setShowHelperMenu(!showHelperMenu)}
                  className="bg-muted hover:bg-muted/80 p-2.5 rounded-xl border border-border/60 text-muted-foreground cursor-pointer flex items-center justify-center shrink-0"
                  title="Insert attachment / Select Template"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {showHelperMenu && (
                  <div className="absolute bottom-full left-4 mb-2 z-50 bg-background border border-border rounded-xl shadow-2xl overflow-hidden py-1.5 w-60 text-xs font-bold text-muted-foreground">
                    <div className="px-3 pb-1 border-b border-border/40 mb-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Guided Templates</span>
                    </div>
                    <button type="button" onClick={() => selectOption('VALUATION')} className="w-full text-left px-4 py-2 hover:bg-muted text-foreground flex items-center gap-1.5 cursor-pointer">
                      📊 Home Valuation Page
                    </button>
                    <button type="button" onClick={() => selectOption('BRAND')} className="w-full text-left px-4 py-2 hover:bg-muted text-foreground flex items-center gap-1.5 cursor-pointer">
                      🏢 Company Brand Page
                    </button>
                    <div className="px-3 py-1.5 border-t border-border/40 mt-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Attach Media Assets</span>
                    </div>
                    <button type="button" onClick={() => selectOption('IMAGE')} className="w-full text-left px-4 py-2 hover:bg-muted text-foreground flex items-center gap-1.5 cursor-pointer">
                      <Image className="w-4 h-4 text-indigo-500" /> Upload Image Photo
                    </button>
                    <button type="button" onClick={() => selectOption('VIDEO')} className="w-full text-left px-4 py-2 hover:bg-muted text-foreground flex items-center gap-1.5 cursor-pointer">
                      <Video className="w-4 h-4 text-rose-500" /> Attach Video Link
                    </button>
                  </div>
                )}

                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask INSTA GEN to generate a brand or squeeze page..."
                  className="flex-1 bg-background border border-border/60 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-foreground"
                />
                
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/95 text-primary-foreground p-2.5 rounded-xl transition-all shadow cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              {blocks.length > 0 && (
                <div className="p-4 bg-indigo-500/5 border-t border-border/40 flex justify-between items-center shrink-0">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider">Outline Compiled!</span>
                  <button
                    onClick={() => setWizardStep(2)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[9px] px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    Verify Outline <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </>
          )}

          {wizardStep === 2 && (
            <div className="flex-1 flex flex-col overflow-hidden animate-fadeIn p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-border/40 pb-2">
                <h3 className="font-extrabold text-sm text-foreground uppercase tracking-wider">Step 2: Modify Block Outlines</h3>
                <button 
                  onClick={() => setWizardStep(1)}
                  className="text-[10px] font-black uppercase text-muted-foreground hover:text-foreground flex items-center gap-0.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 text-xs font-semibold text-muted-foreground pr-1">
                <div>
                  <label className="block mb-1 text-[10px] font-black uppercase">Website Title</label>
                  <input
                    type="text"
                    value={generatedTitle}
                    onChange={(e) => setGeneratedTitle(e.target.value)}
                    className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-foreground focus:outline-none font-bold"
                  />
                </div>

                {blocks.map((block, idx) => (
                  <div key={block.id} className="p-4 border border-border/50 bg-muted/10 rounded-2xl space-y-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500">{block.type} BLOCK</span>
                    
                    {block.type === 'HEADER' && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={block.title || ''}
                          onChange={(e) => handleBlockChange(idx, 'title', e.target.value)}
                          placeholder="Heading title"
                          className="w-full bg-background border border-border/60 rounded-xl px-3 py-1.5 text-foreground focus:outline-none"
                        />
                        <textarea
                          value={block.subtitle || ''}
                          onChange={(e) => handleBlockChange(idx, 'subtitle', e.target.value)}
                          placeholder="Subheading details"
                          rows={2}
                          className="w-full bg-background border border-border/60 rounded-xl p-3 text-foreground focus:outline-none resize-none font-medium"
                        />
                      </div>
                    )}

                    {block.type === 'PROPERTY' && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={block.address || ''}
                          onChange={(e) => handleBlockChange(idx, 'address', e.target.value)}
                          placeholder="Property address"
                          className="w-full bg-background border border-border/60 rounded-xl px-3 py-1.5 text-foreground focus:outline-none font-extrabold"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            value={block.price || ''}
                            onChange={(e) => handleBlockChange(idx, 'price', Number(e.target.value))}
                            placeholder="Price ($)"
                            className="w-full bg-background border border-border/60 rounded-xl px-3 py-1.5 text-foreground focus:outline-none"
                          />
                          <input
                            type="text"
                            value={block.remarks || ''}
                            onChange={(e) => handleBlockChange(idx, 'remarks', e.target.value)}
                            placeholder="Highlights remarks"
                            className="w-full bg-background border border-border/60 rounded-xl px-3 py-1.5 text-foreground focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setWizardStep(3)}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                Configure Tracking & Meta <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="flex-1 flex flex-col overflow-hidden animate-fadeIn p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-border/40 pb-2">
                <h3 className="font-extrabold text-sm text-foreground uppercase tracking-wider">Step 3: Tracking & Publishing</h3>
                <button 
                  onClick={() => setWizardStep(2)}
                  className="text-[10px] font-black uppercase text-muted-foreground hover:text-foreground flex items-center gap-0.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 text-xs font-semibold text-muted-foreground pr-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-[10px] font-black uppercase">Subdomain Prefix</label>
                    <input
                      type="text"
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value)}
                      className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-[10px] font-black uppercase">Slug Path</label>
                    <input
                      type="text"
                      value={generatedSlug}
                      onChange={(e) => setGeneratedSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-[10px] font-black uppercase">Facebook Pixel ID</label>
                    <input
                      type="text"
                      value={fbPixelId}
                      onChange={(e) => setFbPixelId(e.target.value)}
                      placeholder="e.g. 182740924"
                      className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-[10px] font-black uppercase">Google Analytics ID</label>
                    <input
                      type="text"
                      value={gaId}
                      onChange={(e) => setGaId(e.target.value)}
                      placeholder="G-XXXXXXXXXX"
                      className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-[10px] font-black uppercase">Google Business Verification Tag</label>
                  <input
                    type="text"
                    value={gmbVerification}
                    onChange={(e) => setGmbVerification(e.target.value)}
                    placeholder="e.g. GMB-KEY-1002"
                    className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-[10px] font-black uppercase">Custom Header Pixel Scripts</label>
                  <textarea
                    value={customHeaderScripts}
                    onChange={(e) => setCustomHeaderScripts(e.target.value)}
                    placeholder="<script> ... </script>"
                    rows={2}
                    className="w-full bg-background border border-border/60 rounded-xl p-3 text-foreground focus:outline-none resize-none font-mono text-[10px]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-border/40 shrink-0">
                <button
                  onClick={() => handleSavePage('DRAFT')}
                  className="flex-1 py-3 bg-muted hover:bg-muted/80 text-foreground font-black uppercase tracking-widest text-[10px] rounded-xl transition-all cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  onClick={() => handleSavePage('PUBLISHED')}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Publish Page
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Preview Column (Assembles dynamically on block update) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[580px] relative">
          
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-bold">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="font-mono bg-slate-900 px-3 py-1 rounded border border-slate-850">
              {subdomain}.excellegacy.com/{generatedSlug}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-100 select-none bg-slate-900/50">
            {blocks.map(block => (
              <div key={block.id} className="p-5 bg-slate-950/80 border border-slate-850 rounded-2xl space-y-3">
                {block.type === 'HEADER' && (
                  <div className="text-center space-y-2">
                    <h2 className="text-lg font-black text-white">{block.title || 'Brand Presentation Heading'}</h2>
                    <p className="text-[11px] text-slate-400 font-semibold">{block.subtitle}</p>
                  </div>
                )}
                
                {block.type === 'VIDEO' && (
                  <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-rose-400">Featured Tour Video</span>
                    <div className="aspect-video bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center">
                      <Play className="w-8 h-8 text-rose-500 fill-rose-500 animate-pulse" />
                    </div>
                  </div>
                )}

                {block.type === 'PROPERTY' && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-1">
                      <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-black text-white">{block.address || 'MI Area Realcomp Sync Listing'}</span>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{block.remarks}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-[10px] font-black text-indigo-400 uppercase tracking-wider">
                      <span>Price: ${block.price || 350000}</span>
                      <span>Beds: {block.beds || 3}</span>
                      <span>Baths: {block.baths || 2}</span>
                    </div>
                  </div>
                )}

                {block.type === 'LEAD_CAPTURE' && (
                  <div className="space-y-3 pt-2">
                    <div className="space-y-2">
                      <input type="text" disabled placeholder="First Name" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-[10px] opacity-70" />
                      <input type="text" disabled placeholder="Email Address" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-[10px] opacity-70" />
                    </div>
                    <button disabled className="w-full py-2 bg-indigo-600 rounded-lg font-black text-[10px] uppercase tracking-wider text-white opacity-90">
                      {block.ctaText || 'Submit Inbound Contact'}
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            {blocks.length === 0 && (
              <div className="h-full flex items-center justify-center text-slate-500 italic font-semibold text-xs text-center">
                Awaiting prompt input to compile website canvas...
              </div>
            )}
          </div>

        </div>

      </div>

      {showPublishedModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl p-8 space-y-6 relative text-center">
            
            <button
              onClick={() => {
                setShowPublishedModal(false);
                setWizardStep(1);
                setBlocks([]);
              }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-sm cursor-pointer"
            >
              ✕
            </button>

            {/* Checkmark circle */}
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center text-2xl font-black">
                ✓
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-foreground">Your landing page has been published.</h3>
              <p className="text-xs text-muted-foreground font-semibold">Check out these options to expand your landing page marketing power!</p>
            </div>

            {/* Dual Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Option 1: Social Channels */}
              <div className="bg-muted/30 border border-border/40 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2 text-center">
                  <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">Post to your social channels</span>
                  <p className="text-[11px] text-muted-foreground font-semibold leading-relaxed">Direct leads from your social profiles to your new landing page campaign.</p>
                </div>
                <button
                  onClick={() => {
                    setShowPublishedModal(false);
                    setWizardStep(1);
                    setBlocks([]);
                    router.push('/dashboard/agent-websites?tab=social-agent');
                  }}
                  className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-black uppercase text-[10px] tracking-widest py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Post to Social
                </button>
              </div>

              {/* Option 2: Boost post */}
              <div className="bg-muted/30 border border-border/40 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2 text-center">
                  <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">Boost your landing page</span>
                  <p className="text-[11px] text-muted-foreground font-semibold leading-relaxed">A one-time low cost could help you get thousands of impressions from your social channel.</p>
                </div>
                <button
                  onClick={() => {
                    toast.success('Campaign boost initialized successfully!');
                    setShowPublishedModal(false);
                    setWizardStep(1);
                    setBlocks([]);
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-[10px] tracking-widest py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Try Boost Post
                </button>
              </div>

            </div>

            {/* Checkbox reminder */}
            <div className="pt-2 flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
              <input type="checkbox" id="do-not-remind" className="w-4 h-4 accent-indigo-500" />
              <label htmlFor="do-not-remind">Do not remind me again</label>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
