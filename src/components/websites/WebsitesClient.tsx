'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createLandingPageAction, updateLandingPageBlocksAction } from '@/lib/actions/website';

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
  const [activeTab, setActiveTab] = useState<'sites' | 'builder'>('sites');
  const [isCreating, setIsCreating] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<LandingPageBlock[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter();

  // Replicated domains list
  const domainSeats = [
    {
      agent: 'Hank Mendez',
      role: 'Broker / Team Leader',
      domain: 'hankmendez.excellegacyrealtyteam.com',
      phone: '586-405-3333',
      email: 'hankrealtyexec@gmail.com',
      status: 'Active & Configured',
    },
    {
      agent: 'Harry Kourlos',
      role: 'Realtor / Broker Associate',
      domain: 'harrykourlos.excellegacyrealtyteam.com',
      phone: '586-883-3333',
      email: 'harryrealtyexec@gmail.com',
      status: 'Active & Configured',
    },
    {
      agent: 'Don Sobieski',
      role: 'Realtor / Listing Agent',
      domain: 'donsobieski.excellegacyrealtyteam.com',
      phone: '586-306-0051',
      email: 'realtordon26@gmail.com',
      status: 'Active & Configured',
    },
  ];

  const handleCreatePage = async (formData: FormData) => {
    const res = await createLandingPageAction(formData);
    if (res && res.error) {
      toast.error(res.error);
    } else {
      toast.success('Landing Page template initialized!');
      setIsCreating(false);
      router.refresh();
      if (res.landingPageId) {
        handleEditPage(landingPages.find((l) => l.id === res.landingPageId) || {
          id: res.landingPageId,
          title: formData.get('title') as string,
          slug: formData.get('slug') as string,
          subdomain: formData.get('subdomain') as string || null,
          blocks: '[]',
          createdAt: new Date(),
        } as any);
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
    setActiveTab('builder');
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
        setActiveTab('sites');
        router.refresh();
      }
    } catch {
      toast.error('Failed to save blocks.');
    } finally {
      setIsSaving(false);
    }
  };

  const editingPage = landingPages.find((p) => p.id === editingPageId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Websites & Marketing</h1>
          <p className="text-muted-foreground">Replicate hosted domains, configure SEO landing pages, and build block layouts.</p>
        </div>
        {activeTab === 'sites' && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm text-sm"
          >
            Create Landing Page
          </button>
        )}
      </div>

      {/* Tabs Selector */}
      {editingPageId === null && (
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('sites')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'sites' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
            }`}
          >
            Website Seats & Landing Pages
          </button>
        </div>
      )}

      {/* Domain Seats & Pages Tab */}
      {activeTab === 'sites' && (
        <div className="space-y-8">
          {/* Replicated Domain Seats */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Configured Host Subdomains (Excel Legacy Seats)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {domainSeats.map((seat, idx) => (
                <div key={idx} className="bg-background border border-border rounded-xl shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      🌐
                    </div>
                    <span className="text-[10px] font-bold text-green-500 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {seat.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{seat.agent}</h3>
                    <p className="text-xs text-muted-foreground">{seat.role}</p>
                    <p className="text-xs text-primary font-semibold mt-2 select-all">{seat.domain}</p>
                  </div>
                  <div className="text-xs space-y-1 text-muted-foreground pt-2 border-t border-border/50">
                    <p>📞 Cell: {seat.phone}</p>
                    <p>✉️ Email: {seat.email}</p>
                  </div>
                  <div className="pt-2">
                    <a
                      href={`/portal/site/agent-${seat.agent.toLowerCase().replace(' ', '-')}`}
                      className="block text-center py-2 bg-muted/65 text-foreground hover:bg-muted text-xs font-semibold rounded-lg border border-border"
                    >
                      Visit Seat Site
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Landing Pages List */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Marketing Landing Pages</h2>
            <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Title</th>
                    <th className="px-6 py-3 font-semibold">Public Link</th>
                    <th className="px-6 py-3 font-semibold">Subdomain Mapping</th>
                    <th className="px-6 py-3 font-semibold">Created</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {landingPages.map((page) => (
                    <tr key={page.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-semibold">{page.title}</td>
                      <td className="px-6 py-4 text-xs text-primary">
                        <a
                          href={`/portal/site/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          /portal/site/{page.slug}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {page.subdomain || 'Revert to main domain'}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(page.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEditPage(page)}
                          className="text-xs text-primary font-bold hover:underline"
                        >
                          Configure Layout Blocks &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                  {landingPages.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground italic">
                        No custom landing pages configured. Click &ldquo;Create Landing Page&rdquo; to start.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Block Layout Builder */}
      {activeTab === 'builder' && editingPage && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls Side Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-background border border-border rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <h3 className="font-bold text-sm uppercase text-muted-foreground">Visual Blocks Library</h3>
                <button
                  onClick={() => {
                    setEditingPageId(null);
                    setActiveTab('sites');
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Close Builder
                </button>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Add blocks sequentially to construct a marketing landing page. Each block can contain embedded videos, MLS listings, and leads generation triggers.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => handleAddBlock('HEADER')}
                  className="p-3 border border-border/70 hover:border-primary/50 hover:bg-primary/5 rounded-xl text-center text-xs font-semibold flex flex-col items-center gap-1.5 transition-all"
                >
                  <span className="text-lg">📢</span>
                  Header Section
                </button>
                <button
                  onClick={() => handleAddBlock('VIDEO')}
                  className="p-3 border border-border/70 hover:border-primary/50 hover:bg-primary/5 rounded-xl text-center text-xs font-semibold flex flex-col items-center gap-1.5 transition-all"
                >
                  <span className="text-lg">🎥</span>
                  Embed Video
                </button>
                <button
                  onClick={() => handleAddBlock('PROPERTY')}
                  className="p-3 border border-border/70 hover:border-primary/50 hover:bg-primary/5 rounded-xl text-center text-xs font-semibold flex flex-col items-center gap-1.5 transition-all"
                >
                  <span className="text-lg">🏠</span>
                  MLS Property sync
                </button>
                <button
                  onClick={() => handleAddBlock('LEAD_CAPTURE')}
                  className="p-3 border border-border/70 hover:border-primary/50 hover:bg-primary/5 rounded-xl text-center text-xs font-semibold flex flex-col items-center gap-1.5 transition-all"
                >
                  <span className="text-lg">📥</span>
                  Lead Capture Form
                </button>
              </div>

              <div className="pt-4 border-t border-border/50 flex flex-col gap-2">
                <button
                  disabled={isSaving}
                  onClick={handleSaveBlocks}
                  className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-lg"
                >
                  {isSaving ? 'Publishing...' : 'Save & Publish Page'}
                </button>
                <button
                  onClick={() => {
                    setEditingPageId(null);
                    setActiveTab('sites');
                  }}
                  className="w-full py-2 bg-muted text-foreground text-xs font-semibold rounded-lg hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          {/* Builder Canvas */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-background border border-border rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-border/50">
                <h2 className="font-bold text-lg">Designing Page: {editingPage.title}</h2>
                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 rounded px-2 py-0.5 font-bold">
                  CANVAS
                </span>
              </div>

              <div className="space-y-4 min-h-[400px]">
                {blocks.map((block, idx) => (
                  <div key={block.id} className="p-4 border border-border rounded-xl bg-muted/10 relative space-y-4 group">
                    <div className="flex justify-between items-center pb-2 border-b border-border/30">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        Block {idx + 1}: {block.type}
                      </span>
                      <button
                        onClick={() => handleRemoveBlock(idx)}
                        className="text-xs text-red-500 hover:text-red-600 font-bold opacity-30 group-hover:opacity-100 transition-opacity"
                      >
                        Remove Block
                      </button>
                    </div>

                    {/* Block Content Editor Form Inputs */}
                    {block.type === 'HEADER' && (
                      <div className="grid grid-cols-1 gap-3">
                        <input
                          type="text"
                          value={block.title || ''}
                          onChange={(e) => handleBlockChange(idx, 'title', e.target.value)}
                          placeholder="Header Title"
                          className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs"
                        />
                        <input
                          type="text"
                          value={block.subtitle || ''}
                          onChange={(e) => handleBlockChange(idx, 'subtitle', e.target.value)}
                          placeholder="Header Subtitle / Tagline"
                          className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs"
                        />
                      </div>
                    )}

                    {block.type === 'VIDEO' && (
                      <div className="grid grid-cols-1 gap-3">
                        <input
                          type="text"
                          value={block.title || ''}
                          onChange={(e) => handleBlockChange(idx, 'title', e.target.value)}
                          placeholder="Video Section Title"
                          className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs"
                        />
                        <input
                          type="text"
                          value={block.videoUrl || ''}
                          onChange={(e) => handleBlockChange(idx, 'videoUrl', e.target.value)}
                          placeholder="YouTube Embed URL (e.g. https://www.youtube.com/embed/...)"
                          className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs"
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
                            placeholder="MLS Listing Address"
                            className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs"
                          />
                          <input
                            type="number"
                            value={block.price || ''}
                            onChange={(e) => handleBlockChange(idx, 'price', Number(e.target.value))}
                            placeholder="Price ($)"
                            className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="number"
                            value={block.beds || ''}
                            onChange={(e) => handleBlockChange(idx, 'beds', Number(e.target.value))}
                            placeholder="Beds Count"
                            className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs"
                          />
                          <input
                            type="number"
                            value={block.baths || ''}
                            onChange={(e) => handleBlockChange(idx, 'baths', Number(e.target.value))}
                            placeholder="Baths Count"
                            className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs"
                          />
                        </div>
                        <textarea
                          value={block.remarks || ''}
                          onChange={(e) => handleBlockChange(idx, 'remarks', e.target.value)}
                          placeholder="MLS Property Remarks / Highlights..."
                          rows={2}
                          className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs resize-none"
                        />
                      </div>
                    )}

                    {block.type === 'LEAD_CAPTURE' && (
                      <div>
                        <input
                          type="text"
                          value={block.ctaText || ''}
                          onChange={(e) => handleBlockChange(idx, 'ctaText', e.target.value)}
                          placeholder="CTA Text for Lead Capture Form Button"
                          className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs"
                        />
                      </div>
                    )}
                  </div>
                ))}

                {blocks.length === 0 && (
                  <div className="py-16 text-center border-2 border-dashed border-border rounded-xl text-muted-foreground italic text-xs">
                    Canvas is empty. Add block types from the left panel.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
                <input name="subdomain" placeholder="e.g. walktours.excellegacy.com" className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none" />
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
