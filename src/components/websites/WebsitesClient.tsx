'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { createLandingPageAction, updateLandingPageBlocksAction, deleteLandingPageAction } from '@/lib/actions/website';
import AICreatorTab from './AICreatorTab';
import AnalyticsTab from './AnalyticsTab';
import SEOBlogTab from './SEOBlogTab';
import SocialAgentTab from './SocialAgentTab';
import { Plus, Search, ChevronRight, LayoutGrid, Sparkles, BarChart3, Settings, Globe, FileText, ArrowLeft, Trash, Copy, BookOpen, Share2 } from 'lucide-react';

type LandingPageBlock = {
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
  links?: { label: string; href: string }[];
};

type LandingPageData = {
  id: string;
  slug: string;
  title: string;
  subdomain: string | null;
  blocks: string;
  createdAt: Date;
};

export default function WebsitesClient({
  landingPages,
  workspaceId,
}: {
  landingPages: LandingPageData[];
  workspaceId: string;
}) {
  const [activeTab, setActiveTab] = useState<'ai-creator' | 'traditional' | 'seo-blog' | 'social-agent' | 'analytics'>('ai-creator');
  const [isCreating, setIsCreating] = useState(false);
  
  // Builder state
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<LandingPageBlock[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'traditional') {
      setActiveTab('traditional');
    } else if (tabParam === 'ai-creator') {
      setActiveTab('ai-creator');
      setEditingPageId(null);
    } else if (tabParam === 'seo-blog') {
      setActiveTab('seo-blog');
      setEditingPageId(null);
    } else if (tabParam === 'social-agent') {
      setActiveTab('social-agent');
      setEditingPageId(null);
    } else if (tabParam === 'analytics') {
      setActiveTab('analytics');
      setEditingPageId(null);
    }
  }, [searchParams]);

  const handleCreatePage = async (formData: FormData) => {
    const res = await createLandingPageAction(formData);
    if (res && res.error) {
      toast.error(res.error);
    } else {
      toast.success('Landing Page template initialized!');
      setIsCreating(false);
      router.refresh();
      if (res.landingPageId) {
        handleEditPage({
          id: res.landingPageId,
          title: formData.get('title') as string,
          slug: formData.get('slug') as string,
          subdomain: formData.get('subdomain') as string || null,
          blocks: '[]',
          createdAt: new Date(),
        });
      }
    }
  };

  const handleEditPage = (page: LandingPageData) => {
    setEditingPageId(page.id);
    try {
      setBlocks(page.blocks ? JSON.parse(page.blocks) : []);
    } catch {
      setBlocks([]);
    }
    setActiveTab('traditional');
  };

  const handleAddBlock = (type: LandingPageBlock['type']) => {
    const newBlock: LandingPageBlock = {
      id: Math.random().toString(36).substring(7),
      type,
    };

    if (type === 'HEADER') {
      newBlock.title = 'Featured Listing Highlight';
      newBlock.subtitle = 'Schedule a walkthrough session before the upcoming open house events.';
    } else if (type === 'VIDEO') {
      newBlock.title = 'Watch Property Virtual Walkthrough';
      newBlock.videoUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
    } else if (type === 'PROPERTY') {
      newBlock.address = '412 Lakeview Dr, Metro Detroit, MI';
      newBlock.price = 385000;
      newBlock.beds = 4;
      newBlock.baths = 3;
      newBlock.remarks = 'Bright open floor plan with custom lighting, updated deck, and spacious rooms.';
    } else if (type === 'LEAD_CAPTURE') {
      newBlock.ctaText = 'Claim Free Market Assessment Report';
    } else if (type === 'LINKS') {
      newBlock.title = 'Useful Marketing Links';
      newBlock.links = [{ label: 'View Virtual Tour Brochure', href: '#' }];
    }

    setBlocks([...blocks, newBlock]);
  };

  const handleRemoveBlock = (index: number) => {
    setBlocks(blocks.filter((_, idx) => idx !== index));
  };

  const handleBlockChange = (index: number, field: keyof LandingPageBlock, value: any) => {
    const updated = [...blocks];
    updated[index] = { ...updated[index], [field]: value };
    setBlocks(updated);
  };

  const handleSaveBlocks = async () => {
    if (!editingPageId) return;
    setIsSaving(true);
    try {
      const res = await updateLandingPageBlocksAction(editingPageId, JSON.stringify(blocks));
      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success('Landing page blocks saved successfully!');
        setEditingPageId(null);
        router.refresh();
      }
    } catch {
      toast.error('Failed to save blocks.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyPage = async (page: LandingPageData, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const formData = new FormData();
      formData.set('title', `${page.title} (Copy)`);
      formData.set('slug', `${page.slug}-copy-${Math.floor(Math.random() * 1000)}`);
      formData.set('subdomain', page.subdomain ? `${page.subdomain}-copy` : '');
      const res = await createLandingPageAction(formData);
      if (res && res.error) {
        toast.error(res.error);
        return;
      }
      if (res.landingPageId) {
        await updateLandingPageBlocksAction(res.landingPageId, page.blocks);
        toast.success('Landing page duplicated successfully!');
        router.refresh();
      }
    } catch (err: any) {
      toast.error('Failed to duplicate page: ' + err.message);
    }
  };

  const handleDeletePage = async (pageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this landing page? This cannot be undone.')) {
      return;
    }
    try {
      const res = await deleteLandingPageAction(pageId);
      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success('Landing page deleted.');
        if (editingPageId === pageId) {
          setEditingPageId(null);
        }
        router.refresh();
      }
    } catch (err: any) {
      toast.error('Failed to delete page: ' + err.message);
    }
  };

  const filteredPages = landingPages.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const editingPage = landingPages.find((p) => p.id === editingPageId);

  return (
    <div className="flex bg-background rounded-3xl border border-border/60 overflow-hidden min-h-[700px] text-foreground">
      
      {/* Left Sidebar - Google Gemini Style */}
      <aside className="w-64 bg-muted/30 border-r border-border/60 flex flex-col shrink-0">
        
        {/* New Page Header Option */}
        <div className="p-4 border-b border-border/40">
          <button
            onClick={() => setIsCreating(true)}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Page / Chat
          </button>
        </div>

        {/* Sidebar Search option */}
        <div className="px-4 py-3 relative">
          <Search className="w-3.5 h-3.5 absolute left-7 top-5.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pages..."
            className="w-full bg-background border border-border/60 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none"
          />
        </div>

        {/* Saved pages history list */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 py-2">
          <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider px-3 block mb-2">History & Recents</span>
          {filteredPages.map(page => (
            <button
              key={page.id}
              onClick={() => handleEditPage(page)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between group cursor-pointer ${
                editingPageId === page.id
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'hover:bg-muted/65 text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{page.title}</span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => handleCopyPage(page, e)}
                  className="p-1 hover:bg-muted text-muted-foreground hover:text-indigo-500 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Duplicate Landing Page"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => handleDeletePage(page.id, e)}
                  className="p-1 hover:bg-muted text-muted-foreground hover:text-rose-500 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Delete Landing Page"
                >
                  <Trash className="w-3 h-3" />
                </button>
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
              </div>
            </button>
          ))}
          {filteredPages.length === 0 && (
            <span className="text-[10px] text-muted-foreground italic px-3 py-4 block text-center">No matching pages</span>
          )}
        </div>
      </aside>

      {/* Main Workspace Panel */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Portal Header with dynamic switcher tabs */}
        <div className="px-6 py-4 border-b border-border/40 bg-muted/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-xl font-black tracking-tight flex items-center gap-1.5">
              LANDING PAGE PORTAL
            </h1>
            <p className="text-xs text-muted-foreground">Build, prompt, and share targeted county campaigns</p>
          </div>

          {/* Switcher Tab Buttons */}
          <div className="flex bg-muted/60 border border-border/60 rounded-xl p-1 gap-1 text-[11px] font-black uppercase tracking-wider">
            <button
              onClick={() => { setEditingPageId(null); setActiveTab('ai-creator'); }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'ai-creator' && !editingPageId
                  ? 'bg-background text-indigo-500 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> INSTA GEN "NEW"
            </button>
            <button
              onClick={() => {
                if (!editingPageId && landingPages.length > 0) {
                  handleEditPage(landingPages[0]);
                } else {
                  setActiveTab('traditional');
                }
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'traditional' || editingPageId
                  ? 'bg-background text-indigo-500 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Traditional Builder
            </button>
            <button
              onClick={() => { setEditingPageId(null); setActiveTab('seo-blog'); }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'seo-blog'
                  ? 'bg-background text-indigo-500 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> SEO & Blog Creator
            </button>
            <button
              onClick={() => { setEditingPageId(null); setActiveTab('social-agent'); }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'social-agent'
                  ? 'bg-background text-indigo-500 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" /> Social Studio
            </button>
            <button
              onClick={() => { setEditingPageId(null); setActiveTab('analytics'); }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-background text-indigo-500 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Analytics
            </button>
          </div>
        </div>

        {/* Tab workspace renders */}
        <div className="flex-1 p-6 overflow-y-auto">
          
          {/* 1. INSTA GEN AI TAB */}
          {activeTab === 'ai-creator' && !editingPageId && (
            <AICreatorTab workspaceId={workspaceId} />
          )}

          {/* 1.2 SEO & BLOG CREATOR TAB */}
          {activeTab === 'seo-blog' && !editingPageId && (
            <SEOBlogTab workspaceId={workspaceId} />
          )}

          {/* 1.3 SOCIAL STUDIO TAB */}
          {activeTab === 'social-agent' && !editingPageId && (
            <SocialAgentTab workspaceId={workspaceId} />
          )}

          {/* 2. ANALYTICS TAB */}
          {activeTab === 'analytics' && !editingPageId && (
            <AnalyticsTab />
          )}

          {/* 3. TRADITIONAL LOFTY BUILDER VIEW */}
          {(activeTab === 'traditional' || editingPageId) && (
            <>
              {editingPage ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-foreground">
                  
                  {/* Lofty Blocks library layout sidebar */}
                  <div className="lg:col-span-4 bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-5">
                    <div className="flex justify-between items-center pb-2 border-b border-border/40">
                      <h3 className="font-extrabold text-xs uppercase text-muted-foreground tracking-wider">Lofty Canvas Blocks</h3>
                      <button
                        onClick={() => { setEditingPageId(null); setActiveTab('ai-creator'); }}
                        className="text-[10px] bg-muted hover:bg-muted/80 px-2 py-1 rounded border border-border font-bold uppercase transition-colors"
                      >
                        Exit
                      </button>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Build and deploy templates using predefined responsive elements for Macomb, Oakland, and Wayne counties.
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button onClick={() => handleAddBlock('HEADER')} className="p-3.5 border border-border hover:border-indigo-500/50 hover:bg-indigo-500/5 rounded-xl text-center text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer">
                        <span>📢</span> Header Block
                      </button>
                      <button onClick={() => handleAddBlock('VIDEO')} className="p-3.5 border border-border hover:border-indigo-500/50 hover:bg-indigo-500/5 rounded-xl text-center text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer">
                        <span>🎥</span> Video Tour
                      </button>
                      <button onClick={() => handleAddBlock('PROPERTY')} className="p-3.5 border border-border hover:border-indigo-500/50 hover:bg-indigo-500/5 rounded-xl text-center text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer">
                        <span>🏠</span> MLS Listings
                      </button>
                      <button onClick={() => handleAddBlock('LEAD_CAPTURE')} className="p-3.5 border border-border hover:border-indigo-500/50 hover:bg-indigo-500/5 rounded-xl text-center text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer">
                        <span>📥</span> Lead capture
                      </button>
                    </div>

                    <div className="pt-4 border-t border-border/40 flex flex-col gap-2 shrink-0">
                      <button
                        disabled={isSaving}
                        onClick={handleSaveBlocks}
                        className="w-full py-2 bg-indigo-600 text-white text-xs font-black uppercase rounded-lg hover:bg-indigo-500 transition-colors shadow shadow-indigo-500/20 cursor-pointer"
                      >
                        {isSaving ? 'Publishing...' : 'Save & Publish Page'}
                      </button>
                    </div>
                  </div>

                  {/* Visual canvas grid */}
                  <div className="lg:col-span-8 bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-border/40">
                      <h2 className="font-extrabold text-base">Editing Lofty Canvas: {editingPage.title}</h2>
                      <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 rounded-md px-2.5 py-0.5 font-bold uppercase tracking-wider">
                        Active Workspace
                      </span>
                    </div>

                    <div className="space-y-4 min-h-[400px]">
                      {blocks.map((block, idx) => (
                        <div key={block.id} className="p-4.5 border border-border/60 rounded-xl bg-muted/15 relative space-y-4 group">
                          <div className="flex justify-between items-center pb-2 border-b border-border/30">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                              Block {idx + 1}: {block.type}
                            </span>
                            <button
                              onClick={() => handleRemoveBlock(idx)}
                              className="text-[10px] text-rose-500 hover:text-rose-600 font-bold opacity-30 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              Remove Block
                            </button>
                          </div>

                          {/* Block input fields */}
                          {block.type === 'HEADER' && (
                            <div className="grid grid-cols-1 gap-3">
                              <input
                                type="text"
                                value={block.title || ''}
                                onChange={(e) => handleBlockChange(idx, 'title', e.target.value)}
                                placeholder="Header Title"
                                className="w-full bg-background border border-border/60 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                              />
                              <input
                                type="text"
                                value={block.subtitle || ''}
                                onChange={(e) => handleBlockChange(idx, 'subtitle', e.target.value)}
                                placeholder="Header Tagline / Subtitle"
                                className="w-full bg-background border border-border/60 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                              />
                            </div>
                          )}

                          {block.type === 'VIDEO' && (
                            <div className="grid grid-cols-1 gap-3">
                              <input
                                type="text"
                                value={block.title || ''}
                                onChange={(e) => handleBlockChange(idx, 'title', e.target.value)}
                                placeholder="Video Headline"
                                className="w-full bg-background border border-border/60 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                              />
                              <input
                                type="text"
                                value={block.videoUrl || ''}
                                onChange={(e) => handleBlockChange(idx, 'videoUrl', e.target.value)}
                                placeholder="YouTube Embed Link"
                                className="w-full bg-background border border-border/60 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                              />
                            </div>
                          )}

                          {block.type === 'PROPERTY' && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  value={block.address || ''}
                                  onChange={(e) => handleBlockChange(idx, 'address', e.target.value)}
                                  placeholder="Property Address"
                                  className="w-full bg-background border border-border/60 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                                />
                                <input
                                  type="number"
                                  value={block.price || ''}
                                  onChange={(e) => handleBlockChange(idx, 'price', Number(e.target.value))}
                                  placeholder="Listing Price ($)"
                                  className="w-full bg-background border border-border/60 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                                />
                              </div>
                              <textarea
                                value={block.remarks || ''}
                                onChange={(e) => handleBlockChange(idx, 'remarks', e.target.value)}
                                placeholder="MLS sync comments and features..."
                                rows={2}
                                className="w-full bg-background border border-border/60 rounded-lg p-3 text-xs resize-none focus:outline-none"
                              />
                            </div>
                          )}

                          {block.type === 'LEAD_CAPTURE' && (
                            <input
                              type="text"
                              value={block.ctaText || ''}
                              onChange={(e) => handleBlockChange(idx, 'ctaText', e.target.value)}
                              placeholder="CTA Button Text"
                              className="w-full bg-background border border-border/60 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                            />
                          )}
                        </div>
                      ))}
                      {blocks.length === 0 && (
                        <div className="py-24 text-center border border-dashed border-border/60 rounded-xl text-muted-foreground italic text-xs">
                          Canvas layout is empty. Click elements on the left side to compile blocks.
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="py-16 text-center border border-dashed border-border/60 rounded-2xl text-muted-foreground text-xs font-semibold space-y-4">
                  <span>No landing page currently loaded in editor.</span>
                  <div>
                    <button
                      onClick={() => setIsCreating(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg uppercase tracking-wider font-black cursor-pointer shadow text-[10px]"
                    >
                      Initialize Landing Page Template
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </main>

      {/* Page creation modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl border border-border shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-lg mb-2">Create Marketing Landing Page</h3>
            <p className="text-xs text-muted-foreground mb-4">Launch a responsive lead-capture website with custom subdomain options.</p>

            <form action={handleCreatePage} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Page Title</label>
                <input required name="title" placeholder="e.g. 123 Elm St Virtual Tour" className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">URL Slug</label>
                <input required name="slug" placeholder="e.g. 123-elm-street" className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Custom Subdomain mapping (Optional)</label>
                <input name="subdomain" placeholder="e.g. valuation.excellegacy.com" className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none" />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-md hover:bg-primary/90 transition-colors shadow-lg"
                >
                  Initialize Canvas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
