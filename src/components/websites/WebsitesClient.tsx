'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createLandingPageAction, updateLandingPageBlocksAction, deleteLandingPageAction } from '@/lib/actions/website';

type LandingPageBlock = {
  id: string;
  type: 'HEADER' | 'VIDEO' | 'PROPERTY' | 'LEAD_CAPTURE' | 'LINKS' | 'SETTINGS' | 'GALLERY';
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
  // settings
  pageStyle?: string;
  leadSource?: string;
  leadType?: string;
  registrationTrigger?: string;
  browsingTime?: number;
  youtubeUrl?: string;
  customVideoUrl?: string;
  videoType?: 'YOUTUBE' | 'UPLOAD';
  image?: string;
  // property specs
  sqft?: number;
  lotSize?: number;
  yearBuilt?: number;
  images?: string[];
  // lead privacy
  allowClosePrior?: boolean;
  leadOwnership?: string;
  assignmentMethod?: string;
  assignedAgent?: string;
  tags?: string[];
  notes?: string;
  sendWelcomeEmail?: boolean;
  sendWelcomeText?: boolean;
  seoTitle?: string;
};

type LandingPageData = {
  id: string;
  slug: string;
  title: string;
  subdomain: string | null;
  blocks: string;
  createdAt: Date;
};

type PropertyListing = {
  id: string;
  mlsNumber: string | null;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  price: number | null;
  bedrooms: number | null;
  bathroomsFull: number | null;
  bathroomsHalf: number | null;
  squareFeet: number | null;
  yearBuilt: number | null;
  propertyType: string | null;
  status: string;
  description: string | null;
  images: string | null;
};

export default function WebsitesClient({
  landingPages,
  listings,
  workspaceId,
}: {
  landingPages: LandingPageData[];
  listings: PropertyListing[];
  workspaceId: string;
}) {
  const [activeTab, setActiveTab] = useState<'sites' | 'builder'>('sites');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('feature-listing');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<LandingPageBlock[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All');

  // Left builder settings tab
  const [builderTab, setBuilderTab] = useState<'basic' | 'popup' | 'seo' | 'media' | 'blocks'>('basic');

  // Video uploading simulator
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadedVideoDuration, setUploadedVideoDuration] = useState<number | null>(null);

  // Tags simulation state
  const [tagInput, setTagInput] = useState('');

  const router = useRouter();

  // Template recommendations grid
  const templates = [
    {
      id: 'feature-listing',
      name: 'Feature a Listing',
      desc: 'Showcase a single property with photo galleries, video tours, and lead forms.',
      image: '/toscana_listing.png',
      badge: 'MLS Connected'
    },
    {
      id: 'search-campaign',
      name: 'Listing Search Campaign',
      desc: 'Offer visitor searches with maps and auto lead captures.',
      image: '/manchester_listing.png',
      badge: 'Popular'
    },
    {
      id: 'lead-registration',
      name: 'Lead Registration Form',
      desc: 'Minimalistic premium splash page to register buyer lead information.',
      image: '/greenview_listing.png',
      badge: 'High Conversion'
    },
    {
      id: 'area-intro',
      name: 'Featured Area Introduction',
      desc: 'Introduce local neighborhoods, schools, and city facts.',
      image: '/toscana_listing.png',
      badge: 'SEO Optimized'
    },
    {
      id: 'buyer-guide',
      name: 'Buyer Guide Download',
      desc: 'Offer downloadable guides in exchange for contact information.',
      image: '/manchester_listing.png',
      badge: 'Lead Magnet'
    },
    {
      id: 'seller-guide',
      name: 'Seller Guide Download',
      desc: 'Provide home value estimates and seller conversion lists.',
      image: '/greenview_listing.png',
      badge: 'Seller Leads'
    }
  ];

  const handleCreatePage = async (formData: FormData) => {
    formData.append('template', selectedTemplate);
    const res = await createLandingPageAction(formData);
    if (res && res.error) {
      toast.error(res.error);
    } else {
      toast.success('Landing page created and template initialized!');
      setIsCreating(false);
      router.refresh();
      if (res.landingPageId) {
        const found = landingPages.find((l) => l.id === res.landingPageId);
        if (found) {
          handleEditPage(found);
        } else {
          window.location.reload();
        }
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
    setBuilderTab('basic');
  };

  const handleDeletePage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this landing page?')) return;
    const res = await deleteLandingPageAction(id);
    if (res && res.error) {
      toast.error(res.error);
    } else {
      toast.success('Landing page deleted successfully.');
      router.refresh();
    }
  };

  const handleAddBlock = (type: LandingPageBlock['type'], insertAt?: number) => {
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
      newBlock.sqft = 2200;
      newBlock.lotSize = 7500;
      newBlock.yearBuilt = 2015;
      newBlock.remarks = 'Bright open floor plan with custom lighting, updated deck, and spacious rooms.';
    } else if (type === 'LEAD_CAPTURE') {
      newBlock.ctaText = 'Claim Free Market Assessment Report';
    } else if (type === 'LINKS') {
      newBlock.title = 'Useful Marketing Links';
      newBlock.links = [{ label: 'View Virtual Tour Brochure', href: '#' }];
    } else if (type === 'GALLERY') {
      newBlock.title = 'GALLERY';
      newBlock.images = [
        '/toscana_listing.png',
        '/manchester_listing.png',
        '/greenview_listing.png',
        '/toscana_listing.png',
        '/manchester_listing.png',
        '/greenview_listing.png',
        '/toscana_listing.png',
        '/manchester_listing.png'
      ];
    }

    if (insertAt !== undefined) {
      const updated = [...blocks];
      updated.splice(insertAt, 0, newBlock);
      setBlocks(updated);
    } else {
      setBlocks([...blocks, newBlock]);
    }
    toast.success(`${type} block added!`);
  };

  const handleRemoveBlock = (index: number) => {
    setBlocks(blocks.filter((_, idx) => idx !== index));
    toast.success('Block removed from canvas.');
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...blocks];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    setBlocks(updated);
    toast.success('Block order updated.');
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

  // Simulated 60s video uploader
  const simulateVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size exceeds the 50MB limit.');
      return;
    }

    setIsUploadingVideo(true);
    toast('Analyzing video duration...', { icon: '⏳' });

    setTimeout(() => {
      const simulatedDuration = Math.floor(Math.random() * 70) + 10;
      setIsUploadingVideo(false);

      if (simulatedDuration > 60) {
        toast.error(`Upload failed. Video length is ${simulatedDuration}s (limit: 60s). Please trim your video.`);
        setUploadedVideoDuration(null);
      } else {
        setUploadedVideoDuration(simulatedDuration);
        toast.success(`Success! Video (${simulatedDuration}s) uploaded and optimized.`);

        const settingsIdx = blocks.findIndex(b => b.type === 'SETTINGS');
        if (settingsIdx !== -1) {
          handleBlockChange(settingsIdx, 'customVideoUrl', '/mock-videos/listing-preview.mp4');
          handleBlockChange(settingsIdx, 'videoType', 'UPLOAD');
        }
      }
    }, 2500);
  };

  const editingPage = landingPages.find((p) => p.id === editingPageId);

  // Extract settings
  const settingsBlock = blocks.find(b => b.type === 'SETTINGS') || {
    pageStyle: 'With simple header, no footer',
    leadSource: 'Website',
    leadType: 'Buyer',
    registrationTrigger: 'Require registration based on Browsing Time',
    browsingTime: 8,
    youtubeUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    customVideoUrl: '',
    videoType: 'YOUTUBE',
    allowClosePrior: false,
    leadOwnership: 'Company',
    assignmentMethod: 'Directly Assign',
    assignedAgent: 'Excel Legacy Realty Team',
    tags: ['Troy', 'Via Toscana'],
    notes: '',
    sendWelcomeEmail: true,
    sendWelcomeText: false,
    seoTitle: 'Rare Find! Beautiful Troy Home Hits MLS',
  };

  const updateSettingsField = (field: keyof LandingPageBlock, value: any) => {
    const settingsIdx = blocks.findIndex(b => b.type === 'SETTINGS');
    if (settingsIdx !== -1) {
      handleBlockChange(settingsIdx, field, value);
    } else {
      const newSettings: LandingPageBlock = {
        id: 'settings',
        type: 'SETTINGS',
        [field]: value
      };
      setBlocks([newSettings, ...blocks]);
    }
  };

  // Find listing/header/property data for preview and real-time editing
  const propertyBlockIdx = blocks.findIndex(b => b.type === 'PROPERTY');
  const propertyBlock = propertyBlockIdx !== -1 ? blocks[propertyBlockIdx] : {
    address: '6026 Via Toscana Street, Troy, MI 48085',
    price: 649725,
    beds: 4,
    baths: 3,
    sqft: 2850,
    lotSize: 8500,
    yearBuilt: 2018,
    remarks: 'Stunning luxury colonial home in Troy, Michigan. Features gorgeous open layout, premium chef kitchen, custom deck, and beautifully landscaped yard.',
    image: '/toscana_listing.png'
  };

  const headerBlockIdx = blocks.findIndex(b => b.type === 'HEADER');
  const headerBlock = headerBlockIdx !== -1 ? blocks[headerBlockIdx] : {
    title: '6026 Via Toscana Street',
    subtitle: 'Premium MLS Synced Listing'
  };

  const galleryBlockIdx = blocks.findIndex(b => b.type === 'GALLERY');
  const galleryBlock = galleryBlockIdx !== -1 ? blocks[galleryBlockIdx] : {
    title: 'GALLERY',
    images: [
      '/toscana_listing.png',
      '/manchester_listing.png',
      '/greenview_listing.png',
      '/toscana_listing.png',
      '/manchester_listing.png',
      '/greenview_listing.png',
      '/toscana_listing.png',
      '/manchester_listing.png'
    ]
  };

  const filteredPages = landingPages.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.slug.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedTypeFilter === 'All') return matchesSearch;
    if (selectedTypeFilter === 'MLS') return matchesSearch && (p.slug.endsWith('-promo') || p.title.includes('Promotion') || p.title.includes('Via Toscana') || p.title.includes('Manchester') || p.title.includes('Greenview') || p.title.includes('Alvina'));
    if (selectedTypeFilter === 'Custom') return matchesSearch && !(p.slug.endsWith('-promo') || p.title.includes('Promotion') || p.title.includes('Alvina'));
    return matchesSearch;
  });

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const currentTags = settingsBlock.tags || [];
    if (!currentTags.includes(tagInput.trim())) {
      updateSettingsField('tags', [...currentTags, tagInput.trim()]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (t: string) => {
    const currentTags = settingsBlock.tags || [];
    updateSettingsField('tags', currentTags.filter(item => item !== t));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Websites & Landing Pages
          </h1>
          <p className="text-muted-foreground text-sm">
            Configure custom marketing landing pages, auto-generate pages for live MLS listings, and customize visual options.
          </p>
        </div>
        {activeTab === 'sites' && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/95 transition-all shadow-md text-sm flex items-center gap-2"
          >
            <span>➕</span> Add a New Landing Page
          </button>
        )}
      </div>

      {/* Main Grid View: Templates & Table */}
      {activeTab === 'sites' && (
        <div className="space-y-8">
          {/* Template Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">Create Landing Page Template</h2>
              <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Recommendations
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => {
                    setSelectedTemplate(tpl.id);
                    setIsCreating(true);
                  }}
                  className="bg-card hover:bg-muted/10 border border-border/80 hover:border-primary/40 rounded-xl overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col group"
                >
                  <div className="h-28 bg-muted relative overflow-hidden">
                    <img
                      src={tpl.image}
                      alt={tpl.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="text-[9px] bg-slate-900/80 backdrop-blur-sm text-slate-100 border border-slate-700 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                        {tpl.badge}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h3 className="font-bold text-xs group-hover:text-primary transition-colors">{tpl.name}</h3>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-1">{tpl.desc}</p>
                    </div>
                    <button className="w-full py-1.5 bg-muted/65 text-foreground hover:bg-primary hover:text-primary-foreground text-[10px] font-bold rounded-lg border border-border transition-all">
                      Select Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters and Table Section */}
          <div className="space-y-4 pt-4 border-t border-border/30">
            <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-card border border-border p-4 rounded-xl shadow-sm">
              <div className="relative w-full md:w-80">
                <span className="absolute left-3 top-2.5 text-muted-foreground text-xs">🔍</span>
                <input
                  type="text"
                  placeholder="Search by Page Name or Page URL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  className="bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-none w-full md:w-40"
                >
                  <option value="All">All Page Types</option>
                  <option value="MLS">MLS Synced Listings</option>
                  <option value="Custom">Custom Campaigns</option>
                </select>

                <select
                  className="bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-none w-full md:w-48"
                  defaultValue="excellegacymain"
                >
                  <option value="excellegacymain">excellegacyrealtyteam.com</option>
                  <option value="hank">hankmendez.excellegacyrealtyteam.com</option>
                  <option value="harry">harrykourlos.excellegacyrealtyteam.com</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="text-[10px] text-muted-foreground uppercase bg-muted/40 font-bold border-b border-border">
                    <tr>
                      <th className="px-6 py-4 font-bold">Page Name</th>
                      <th className="px-6 py-4 font-bold">Lead Source</th>
                      <th className="px-6 py-4 font-bold">Page Template</th>
                      <th className="px-6 py-4 font-bold">Creator</th>
                      <th className="px-6 py-4 font-bold text-center">Overview (Last 30 Days)</th>
                      <th className="px-6 py-4 font-bold">Create Time</th>
                      <th className="px-6 py-4 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredPages.map((page) => {
                      const isMls = page.slug.endsWith('-promo') || page.title.includes('Promotion') || page.title.includes('Via Toscana') || page.title.includes('Manchester') || page.title.includes('Greenview') || page.title.includes('Alvina');

                      // Calculate mockup page metrics
                      const baseSeed = page.title.charCodeAt(0) + page.title.charCodeAt(page.title.length - 1);
                      const views = (baseSeed % 40) + 5;
                      const leads = (baseSeed % 8);
                      const convRate = views > 0 ? ((leads / views) * 100).toFixed(0) : '0';

                      return (
                        <tr key={page.id} className="hover:bg-muted/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                              <div>
                                <a
                                  href={`/site/${page.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-semibold text-primary hover:underline block max-w-xs truncate"
                                >
                                  {page.title}
                                </a>
                                <span className="text-[10px] text-muted-foreground">/site/{page.slug}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">Website</td>
                          <td className="px-6 py-4 font-medium">
                            {isMls ? (
                              <span className="text-[10px] bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold">
                                Single Property (Promotion)
                              </span>
                            ) : (
                              <span className="text-[10px] bg-purple-500/10 text-purple-500 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold">
                                Lead Capture splash
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground font-medium">Excel Legacy Realty Team</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-4 text-muted-foreground">
                              <span>👁️ {views}</span>
                              <span>👤 {leads}</span>
                              <span className="font-semibold text-foreground">{convRate}% Conv</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {new Date(page.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => handleEditPage(page)}
                                className="p-1.5 hover:bg-muted rounded text-foreground font-semibold flex items-center gap-1 border border-border/50 hover:border-foreground/20"
                                title="Edit Settings & Visuals"
                              >
                                <span>⚙️</span> Edit
                              </button>
                              <a
                                href={`/site/${page.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 hover:bg-muted rounded text-foreground font-semibold flex items-center gap-1 border border-border/50"
                                title="Live Preview"
                              >
                                <span>🔗</span> Visit
                              </a>
                              <button
                                onClick={() => handleDeletePage(page.id)}
                                className="p-1.5 hover:bg-red-500/10 text-red-500 rounded border border-transparent hover:border-red-500/20"
                                title="Delete Page"
                              >
                                <span>🗑️</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredPages.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground italic">
                          No matching landing pages found. Click &ldquo;Add a New Landing Page&rdquo; or select a template to build one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Block Layout Builder (Split Screen) */}
      {activeTab === 'builder' && editingPage && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Controls Side Panel: Col Span 5 */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              {/* Header inside builder controls */}
              <div className="bg-muted/40 p-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-foreground">Landing Page Editor</h3>
                  <p className="text-[10px] text-muted-foreground truncate max-w-xs">{editingPage.title}</p>
                </div>
                <button
                  onClick={() => {
                    setEditingPageId(null);
                    setActiveTab('sites');
                  }}
                  className="px-2.5 py-1 bg-background hover:bg-muted text-muted-foreground hover:text-foreground text-[10px] border border-border rounded-lg font-bold"
                >
                  Exit Builder
                </button>
              </div>

              {/* Navigation Tabs inside Side Panel */}
              <div className="flex border-b border-border text-[11px] font-semibold bg-muted/15 overflow-x-auto">
                <button
                  onClick={() => setBuilderTab('basic')}
                  className={`flex-1 min-w-[70px] text-center py-2.5 border-b-2 transition-colors ${
                    builderTab === 'basic' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Basic Info
                </button>
                <button
                  onClick={() => setBuilderTab('popup')}
                  className={`flex-1 min-w-[90px] text-center py-2.5 border-b-2 transition-colors ${
                    builderTab === 'popup' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Pop-up Rules
                </button>
                <button
                  onClick={() => setBuilderTab('seo')}
                  className={`flex-1 min-w-[50px] text-center py-2.5 border-b-2 transition-colors ${
                    builderTab === 'seo' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  SEO
                </button>
                <button
                  onClick={() => setBuilderTab('media')}
                  className={`flex-1 min-w-[80px] text-center py-2.5 border-b-2 transition-colors ${
                    builderTab === 'media' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Video & Media
                </button>
                <button
                  onClick={() => setBuilderTab('blocks')}
                  className={`flex-1 min-w-[85px] text-center py-2.5 border-b-2 transition-colors ${
                    builderTab === 'blocks' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Canvas Blocks
                </button>
              </div>

              {/* Tab Content Panels */}
              <div className="p-5 space-y-5">

                {/* 1. Basic Info Panel */}
                {builderTab === 'basic' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Lead Source Name</label>
                        <input
                          type="text"
                          value={settingsBlock.leadSource || 'Website'}
                          onChange={(e) => updateSettingsField('leadSource', e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Lead Persona Type</label>
                        <select
                          value={settingsBlock.leadType || 'Buyer'}
                          onChange={(e) => updateSettingsField('leadType', e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                        >
                          <option value="Buyer">Buyer</option>
                          <option value="Seller">Seller</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">MLS Listing Address</label>
                      <input
                        type="text"
                        value={propertyBlock.address || ''}
                        onChange={(e) => {
                          if (propertyBlockIdx !== -1) {
                            handleBlockChange(propertyBlockIdx, 'address', e.target.value);
                          }
                        }}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>

                    {/* Editable Specs Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">Price ($)</label>
                        <input
                          type="number"
                          value={propertyBlock.price || 0}
                          onChange={(e) => {
                            if (propertyBlockIdx !== -1) {
                              handleBlockChange(propertyBlockIdx, 'price', Number(e.target.value));
                            }
                          }}
                          className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">Beds</label>
                        <input
                          type="number"
                          value={propertyBlock.beds || 3}
                          onChange={(e) => {
                            if (propertyBlockIdx !== -1) {
                              handleBlockChange(propertyBlockIdx, 'beds', Number(e.target.value));
                            }
                          }}
                          className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">Bath</label>
                        <input
                          type="number"
                          value={propertyBlock.baths || 1}
                          onChange={(e) => {
                            if (propertyBlockIdx !== -1) {
                              handleBlockChange(propertyBlockIdx, 'baths', Number(e.target.value));
                            }
                          }}
                          className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">SqFt</label>
                        <input
                          type="number"
                          value={propertyBlock.sqft || 935}
                          onChange={(e) => {
                            if (propertyBlockIdx !== -1) {
                              handleBlockChange(propertyBlockIdx, 'sqft', Number(e.target.value));
                            }
                          }}
                          className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">Lot Size</label>
                        <input
                          type="number"
                          value={propertyBlock.lotSize || 6098}
                          onChange={(e) => {
                            if (propertyBlockIdx !== -1) {
                              handleBlockChange(propertyBlockIdx, 'lotSize', Number(e.target.value));
                            }
                          }}
                          className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">Year Built</label>
                        <input
                          type="number"
                          value={propertyBlock.yearBuilt || 1940}
                          onChange={(e) => {
                            if (propertyBlockIdx !== -1) {
                              handleBlockChange(propertyBlockIdx, 'yearBuilt', Number(e.target.value));
                            }
                          }}
                          className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Remarks Editor */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Remarks / Description</label>
                      <textarea
                        value={propertyBlock.remarks || ''}
                        rows={4}
                        onChange={(e) => {
                          if (propertyBlockIdx !== -1) {
                            handleBlockChange(propertyBlockIdx, 'remarks', e.target.value);
                          }
                        }}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-none resize-none leading-relaxed"
                      />
                    </div>
                  </div>
                )}

                {/* 2. Pop-up Rules Tab */}
                {builderTab === 'popup' && (
                  <div className="space-y-5">
                    <div className="space-y-3.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block">How To Trigger Registration</label>

                      <div className="space-y-2.5">
                        <label className="flex items-center gap-2.5 text-xs font-semibold cursor-pointer">
                          <input
                            type="radio"
                            name="regTrigger"
                            value="Never require registration"
                            checked={settingsBlock.registrationTrigger === 'Never require registration'}
                            onChange={(e) => updateSettingsField('registrationTrigger', e.target.value)}
                            className="text-primary focus:ring-0"
                          />
                          Never require registration
                        </label>

                        <label className="flex items-center gap-2.5 text-xs font-semibold cursor-pointer">
                          <input
                            type="radio"
                            name="regTrigger"
                            value="Require registration based on Page Views"
                            checked={settingsBlock.registrationTrigger === 'Require registration based on Page Views'}
                            onChange={(e) => updateSettingsField('registrationTrigger', e.target.value)}
                            className="text-primary focus:ring-0"
                          />
                          Require registration based on page views
                        </label>

                        <label className="flex items-center gap-2.5 text-xs font-semibold cursor-pointer">
                          <input
                            type="radio"
                            name="regTrigger"
                            value="Require registration based on Browsing Time"
                            checked={settingsBlock.registrationTrigger === 'Require registration based on Browsing Time'}
                            onChange={(e) => updateSettingsField('registrationTrigger', e.target.value)}
                            className="text-primary focus:ring-0"
                          />
                          Require registration based on Browsing Time
                        </label>
                      </div>
                    </div>

                    {settingsBlock.registrationTrigger === 'Require registration based on Browsing Time' && (
                      <div className="space-y-3 pt-3 border-t border-border/50">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-muted-foreground uppercase text-[10px]">Pop-up after browsing for seconds</span>
                          <span className="font-extrabold text-primary text-sm">{settingsBlock.browsingTime || 8}s</span>
                        </div>
                        <input
                          type="range"
                          min="3"
                          max="60"
                          value={settingsBlock.browsingTime || 8}
                          onChange={(e) => updateSettingsField('browsingTime', parseInt(e.target.value))}
                          className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>
                    )}

                    <div className="space-y-3.5 pt-3 border-t border-border/50">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block">Allow pop-up to be closed prior to registration</label>
                      <div className="flex gap-4 items-center">
                        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                          <input
                            type="radio"
                            name="allowClosePrior"
                            checked={settingsBlock.allowClosePrior === true}
                            onChange={() => updateSettingsField('allowClosePrior', true)}
                            className="text-primary focus:ring-0"
                          />
                          Yes
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                          <input
                            type="radio"
                            name="allowClosePrior"
                            checked={settingsBlock.allowClosePrior === false || settingsBlock.allowClosePrior === undefined}
                            onChange={() => updateSettingsField('allowClosePrior', false)}
                            className="text-primary focus:ring-0"
                          />
                          No
                        </label>
                      </div>
                    </div>

                    {/* Lead Privacy and Assignment */}
                    <div className="space-y-3.5 pt-3 border-t border-border/50">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block">Lead Privacy & Assignment</label>

                      <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground block">Lead Ownership</label>
                        <select
                          value={settingsBlock.leadOwnership || 'Company'}
                          onChange={(e) => updateSettingsField('leadOwnership', e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                        >
                          <option value="Company">Company</option>
                          <option value="Agent (Private)">Agent (Private)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground block">Assignment Method</label>
                        <select
                          value={settingsBlock.assignmentMethod || 'Directly Assign'}
                          onChange={(e) => updateSettingsField('assignmentMethod', e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                        >
                          <option value="Directly Assign">Directly Assign</option>
                          <option value="Round Robin">Round Robin / Pool</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground block">Assign to Agent</label>
                        <select
                          value={settingsBlock.assignedAgent || 'Excel Legacy Realty Team'}
                          onChange={(e) => updateSettingsField('assignedAgent', e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                        >
                          <option value="Excel Legacy Realty Team">Excel Legacy Realty Team</option>
                          <option value="Hank Mendez">Hank Mendez</option>
                          <option value="Harry Kourlos">Harry Kourlos</option>
                          <option value="Don Sobieski">Don Sobieski</option>
                        </select>
                      </div>
                    </div>

                    {/* Additional Actions: Tags & Notes */}
                    <div className="space-y-3.5 pt-3 border-t border-border/50">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block">Additional Actions</label>

                      <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground block">Lead Tags</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add Tag..."
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                            className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleAddTag}
                            className="px-3 bg-muted border border-border text-xs rounded-lg font-bold"
                          >
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {(settingsBlock.tags || []).map((t: string) => (
                            <span key={t} className="text-[10px] bg-primary/10 text-primary border border-primary/20 rounded px-2 py-0.5 font-bold flex items-center gap-1">
                              {t}
                              <button type="button" onClick={() => handleRemoveTag(t)} className="text-red-500 font-extrabold">×</button>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground block">Internal Staff Note</label>
                        <textarea
                          placeholder="Note content..."
                          value={settingsBlock.notes || ''}
                          rows={2}
                          onChange={(e) => updateSettingsField('notes', e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none resize-none"
                        />
                      </div>

                      <div className="flex flex-col gap-2 pt-1.5 text-xs font-semibold">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settingsBlock.sendWelcomeEmail !== false}
                            onChange={(e) => updateSettingsField('sendWelcomeEmail', e.target.checked)}
                            className="rounded text-primary focus:ring-0"
                          />
                          Send Welcome Email
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settingsBlock.sendWelcomeText === true}
                            onChange={(e) => updateSettingsField('sendWelcomeText', e.target.checked)}
                            className="rounded text-primary focus:ring-0"
                          />
                          Send Welcome Text
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. SEO Tab */}
                {builderTab === 'seo' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Meta Page Title</label>
                      <input
                        type="text"
                        value={settingsBlock.seoTitle || ''}
                        onChange={(e) => updateSettingsField('seoTitle', e.target.value)}
                        placeholder="e.g. Beautiful Troy Home for Sale"
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Meta Page Description</label>
                      <textarea
                        placeholder="Meta description content..."
                        rows={3}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-none resize-none"
                        defaultValue="Check out this hot live listing synced directly from the MLS search indices. Schedule private walk-through alerts."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">SEO Keywords</label>
                      <input
                        type="text"
                        placeholder="troy listing, mls synced page, real estate agent"
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 4. Video & Media Panel */}
                {builderTab === 'media' && (
                  <div className="space-y-5">
                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3.5 space-y-2">
                      <h4 className="font-bold text-xs text-blue-400">Media Customization Options</h4>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        Increase conversion rates by adding walk-through media. You can either embed a YouTube/Vimeo video link or upload a custom short clip.
                      </p>
                    </div>

                    <div className="flex gap-4 items-center">
                      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="videoType"
                          checked={settingsBlock.videoType === 'YOUTUBE'}
                          onChange={() => updateSettingsField('videoType', 'YOUTUBE')}
                          className="text-primary focus:ring-0"
                        />
                        YouTube Link
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="videoType"
                          checked={settingsBlock.videoType === 'UPLOAD'}
                          onChange={() => updateSettingsField('videoType', 'UPLOAD')}
                          className="text-primary focus:ring-0"
                        />
                        Direct Upload (Up to 60s)
                      </label>
                    </div>

                    {settingsBlock.videoType === 'YOUTUBE' ? (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">YouTube Embed URL</label>
                        <input
                          type="text"
                          value={settingsBlock.youtubeUrl || ''}
                          onChange={(e) => {
                            updateSettingsField('youtubeUrl', e.target.value);
                            const videoIdx = blocks.findIndex(b => b.type === 'VIDEO');
                            if (videoIdx !== -1) {
                              handleBlockChange(videoIdx, 'videoUrl', e.target.value);
                            }
                          }}
                          placeholder="e.g., https://www.youtube.com/embed/dQw4w9WgXcQ"
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                        />
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground">Upload Video (Up to 60 Seconds / Max 50MB)</label>
                          <div className="border-2 border-dashed border-border/80 hover:border-primary/50 rounded-2xl p-6 text-center cursor-pointer transition-all bg-muted/10 relative">
                            <input
                              type="file"
                              accept="video/*"
                              onChange={simulateVideoUpload}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              disabled={isUploadingVideo}
                            />
                            {isUploadingVideo ? (
                              <div className="space-y-2">
                                <div className="animate-spin text-xl">⏳</div>
                                <p className="text-xs font-semibold">Uploading and checking video length...</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="text-2xl text-muted-foreground">📁</div>
                                <p className="text-xs font-semibold text-foreground">Click to upload video file</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {uploadedVideoDuration !== null && (
                          <div className="flex items-center gap-2 text-[10px] bg-green-500/10 text-green-500 border border-green-500/20 px-3 py-2 rounded-lg">
                            <span>✅</span>
                            <span>Simulated verification: <strong>{uploadedVideoDuration} seconds</strong> video successfully validated.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Page Blocks Canvas Ordering */}
                {builderTab === 'blocks' && (
                  <div className="space-y-4">
                    <p className="text-[10px] text-muted-foreground leading-relaxed border-b border-border/50 pb-2">
                      Add, remove, and change the section blocks that build the landing page structure.
                    </p>

                    <div className="space-y-2">
                      {blocks.map((block, idx) => {
                        if (block.type === 'SETTINGS') return null;
                        return (
                          <div key={block.id} className="flex items-center justify-between p-2.5 border border-border bg-muted/10 rounded-xl text-xs font-semibold">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase">
                              <span>🧱</span>
                              <span>Block {idx}: {block.type}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={idx <= 1} // setting block is idx 0
                                onClick={() => handleMoveBlock(idx, 'up')}
                                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                              >
                                🔼
                              </button>
                              <button
                                type="button"
                                disabled={idx === blocks.length - 1}
                                onClick={() => handleMoveBlock(idx, 'down')}
                                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                              >
                                🔽
                              </button>
                              <button
                                onClick={() => handleRemoveBlock(idx)}
                                className="text-[10px] text-red-500 font-bold hover:underline ml-1"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={() => handleAddBlock('HEADER')}
                        className="py-2 border border-border hover:bg-primary/5 hover:text-primary rounded-lg text-center text-[10px] font-bold"
                      >
                        ➕ Header Block
                      </button>
                      <button
                        onClick={() => handleAddBlock('VIDEO')}
                        className="py-2 border border-border hover:bg-primary/5 hover:text-primary rounded-lg text-center text-[10px] font-bold"
                      >
                        ➕ Video Block
                      </button>
                      <button
                        onClick={() => handleAddBlock('PROPERTY')}
                        className="py-2 border border-border hover:bg-primary/5 hover:text-primary rounded-lg text-center text-[10px] font-bold"
                      >
                        ➕ Property Block
                      </button>
                      <button
                        onClick={() => handleAddBlock('GALLERY')}
                        className="py-2 border border-border hover:bg-primary/5 hover:text-primary rounded-lg text-center text-[10px] font-bold"
                      >
                        ➕ Gallery Block
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Action save buttons bottom bar */}
              <div className="p-5 border-t border-border bg-muted/15 flex flex-col gap-2">
                <button
                  disabled={isSaving}
                  onClick={handleSaveBlocks}
                  className="w-full py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/95 transition-all shadow-md"
                >
                  {isSaving ? 'Publishing Updates...' : 'Publish & Update Landing Page'}
                </button>
                <button
                  onClick={() => {
                    setEditingPageId(null);
                    setActiveTab('sites');
                  }}
                  className="w-full py-2 bg-muted text-foreground hover:bg-muted/80 text-xs font-semibold rounded-lg border border-border transition-colors"
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>

          {/* Builder Canvas / Live Preview: Col Span 7 */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Real-Time Page Preview</span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
                <span className="font-semibold text-muted-foreground text-[10px]">LIVE SYNC PREVIEW</span>
              </div>
            </div>

            {/* Simulated Live Web Page Frame */}
            <div className="w-full border border-border rounded-2xl shadow-2xl overflow-hidden bg-slate-950 text-slate-100 flex flex-col h-[780px] relative">

              {/* Browser Mock Navigation Bar */}
              <div className="bg-slate-900 border-b border-slate-800 p-3.5 flex items-center justify-between text-[11px] font-medium text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-red-500/80 rounded-full"></span>
                  <span className="w-2.5 h-2.5 bg-yellow-500/80 rounded-full"></span>
                  <span className="w-2.5 h-2.5 bg-green-500/80 rounded-full"></span>
                </div>
                <div className="bg-slate-950/80 border border-slate-850 px-3 py-1 rounded-md w-72 truncate text-center select-all select-none">
                  excellegacyrealtyteam.com/site/{editingPage.slug}
                </div>
                <span className="text-[10px] text-green-400 font-bold border border-green-500/20 px-2 py-0.5 rounded bg-green-500/10">
                  SECURE
                </span>
              </div>

              {/* Web Page View Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 relative" style={{ scrollBehavior: 'smooth' }}>

                {/* Header Links simulation */}
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-900 pb-3">
                  <div className="flex gap-4">
                    <span>OVERVIEW</span>
                    <span>DETAIL</span>
                    <span>SCHOOL</span>
                    <span>CONTACT</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-200">
                    <span>🏠</span>
                    <span>Excel Legacy Realty Team</span>
                  </div>
                </div>

                {blocks.map((block, idx) => {
                  if (block.type === 'SETTINGS') return null;

                  return (
                    <div key={block.id} className="relative group/canvas border-2 border-transparent hover:border-primary/40 rounded-xl p-2 transition-all">

                      {/* Action overlays on hover over preview blocks */}
                      <div className="absolute top-2 right-2 z-50 opacity-0 group-hover/canvas:opacity-100 transition-opacity flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 shadow-lg">
                        <button
                          onClick={() => handleMoveBlock(idx, 'up')}
                          disabled={idx <= 1}
                          className="p-1 bg-slate-950 hover:bg-slate-850 rounded text-slate-200 text-xs disabled:opacity-20"
                          title="Move block up"
                        >
                          🔼
                        </button>
                        <button
                          onClick={() => handleMoveBlock(idx, 'down')}
                          disabled={idx === blocks.length - 1}
                          className="p-1 bg-slate-950 hover:bg-slate-850 rounded text-slate-200 text-xs disabled:opacity-20"
                          title="Move block down"
                        >
                          🔽
                        </button>
                        <button
                          onClick={() => {
                            if (block.type === 'PROPERTY') setBuilderTab('basic');
                            else if (block.type === 'VIDEO') setBuilderTab('media');
                            else setBuilderTab('blocks');
                          }}
                          className="p-1 bg-slate-950 hover:bg-slate-850 rounded text-slate-200 text-xs"
                          title="Configure Block"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleRemoveBlock(idx)}
                          className="p-1 bg-red-950 hover:bg-red-900 rounded text-red-400 text-xs"
                          title="Delete Block"
                        >
                          🗑️
                        </button>
                      </div>

                      {/* Header Block Render */}
                      {block.type === 'HEADER' && (
                        <div className="text-center py-6 border-b border-slate-900 space-y-2">
                          <h1 className="text-3xl font-black bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent tracking-tight">
                            {block.title || headerBlock.title}
                          </h1>
                          <p className="text-xs text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
                            {block.subtitle || headerBlock.subtitle}
                          </p>
                        </div>
                      )}

                      {/* Property Detail Render */}
                      {block.type === 'PROPERTY' && (
                        <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-5 space-y-4 backdrop-blur-sm relative overflow-hidden">

                          <div className="relative h-48 rounded-lg overflow-hidden bg-slate-950 border border-slate-800">
                            <img
                              src={propertyBlock.image || '/manchester_listing.png'}
                              alt="Listing Image"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-3 left-3 bg-slate-950/70 border border-slate-800 text-slate-100 font-extrabold text-xs px-2.5 py-1 rounded shadow-lg backdrop-blur-sm">
                              {propertyBlock.price ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(propertyBlock.price) : '$139,320'}
                            </div>
                            <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded text-[10px] font-bold text-slate-200">
                              Single Family Home
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-3">
                            <div>
                              <span className="text-[9px] bg-primary/20 text-primary border border-primary/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">
                                Live MLS Connected
                              </span>
                              <h3 className="font-extrabold text-base text-slate-100 mt-1">{propertyBlock.address}</h3>
                            </div>
                          </div>

                          {/* 5-Column specification display */}
                          <div className="grid grid-cols-5 gap-2.5 text-center text-xs font-bold">
                            <div className="bg-slate-950/40 border border-slate-850 p-2.5 rounded-lg flex flex-col justify-between">
                              <span className="block text-base font-black text-slate-100">{propertyBlock.beds || 3}</span>
                              <span className="text-[9px] text-slate-500 uppercase font-bold mt-1">Beds</span>
                            </div>
                            <div className="bg-slate-950/40 border border-slate-850 p-2.5 rounded-lg flex flex-col justify-between">
                              <span className="block text-base font-black text-slate-100">{propertyBlock.baths || 1}</span>
                              <span className="text-[9px] text-slate-500 uppercase font-bold mt-1">Bath</span>
                            </div>
                            <div className="bg-slate-950/40 border border-slate-850 p-2.5 rounded-lg flex flex-col justify-between">
                              <span className="block text-base font-black text-slate-100">{propertyBlock.sqft || 935}</span>
                              <span className="text-[9px] text-slate-500 uppercase font-bold mt-1">SqFt</span>
                            </div>
                            <div className="bg-slate-950/40 border border-slate-850 p-2.5 rounded-lg flex flex-col justify-between">
                              <span className="block text-base font-black text-slate-100">{propertyBlock.lotSize ? propertyBlock.lotSize.toLocaleString() : '6,098'}</span>
                              <span className="text-[9px] text-slate-500 uppercase font-bold mt-1">Lot Size</span>
                            </div>
                            <div className="bg-slate-950/40 border border-slate-850 p-2.5 rounded-lg flex flex-col justify-between">
                              <span className="block text-base font-black text-slate-100">{propertyBlock.yearBuilt || 1940}</span>
                              <span className="text-[9px] text-slate-500 uppercase font-bold mt-1">Year Built</span>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-400 leading-relaxed italic">
                            {propertyBlock.remarks}
                          </p>
                          <p className="text-[9px] text-slate-500 font-bold border-t border-slate-850/50 pt-2">
                            Listed by Real Estate One Inc-Shelby
                          </p>
                        </div>
                      )}

                      {/* Video Block Render */}
                      {block.type === 'VIDEO' && (
                        <div className="space-y-2">
                          {settingsBlock.videoType === 'UPLOAD' && settingsBlock.customVideoUrl ? (
                            <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-850 bg-black shadow-lg">
                              <video src={settingsBlock.customVideoUrl} controls muted className="w-full h-full object-cover" />
                            </div>
                          ) : settingsBlock.youtubeUrl ? (
                            <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-850 bg-black shadow-lg">
                              <iframe
                                src={settingsBlock.youtubeUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ'}
                                title="Walkthrough Video"
                                className="w-full h-full"
                                allowFullScreen
                              ></iframe>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
                              <span>🎥</span>
                              <p className="font-semibold">No Data. Please double-click to configure the Video block.</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* GALLERY Block Render */}
                      {block.type === 'GALLERY' && (
                        <div className="space-y-4 pt-2">
                          <h3 className="text-sm font-black text-slate-300 tracking-wider uppercase text-left border-b border-slate-900 pb-2">
                            {block.title || 'GALLERY'}
                          </h3>
                          <div className="grid grid-cols-4 gap-2">
                            {(block.images || []).map((img, i) => (
                              <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden bg-slate-900 border border-slate-850">
                                <img
                                  src={img}
                                  alt={`Grid item ${i}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Lead Capture Form Render */}
                      {block.type === 'LEAD_CAPTURE' && (
                        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                          <div className="text-center space-y-1">
                            <h3 className="font-bold text-sm text-slate-100">{block.ctaText || 'Register to Connect'}</h3>
                            <p className="text-[10px] text-slate-500">Provide details below to schedule an interactive video walkthrough session.</p>
                          </div>
                          <div className="space-y-2.5">
                            <div className="grid grid-cols-2 gap-3">
                              <input disabled placeholder="First Name" className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-[11px] focus:outline-none cursor-default" />
                              <input disabled placeholder="Last Name" className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-[11px] focus:outline-none cursor-default" />
                            </div>
                            <input disabled placeholder="Email Address" className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-[11px] focus:outline-none cursor-default" />
                            <button className="w-full py-2 bg-primary text-primary-foreground font-bold text-xs rounded shadow-lg select-none">
                              Register to Connect
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Mid-canvas "+ Add Block" Insertion Point */}
                      <div className="absolute -bottom-3 left-0 right-0 flex justify-center opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity z-50">
                        <button
                          type="button"
                          onClick={() => handleAddBlock('GALLERY', idx + 1)}
                          className="px-3 py-1 bg-primary text-primary-foreground font-black border-2 border-slate-950 text-[9px] rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-black/80 transform hover:scale-105 transition-transform"
                        >
                          ➕ Add Block Here
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Floating Chatbot Assistant "Lynn" Mockup */}
              <div className="absolute bottom-6 right-6 z-40 space-y-2 max-w-[280px]">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-2xl space-y-1 animate-in slide-in-from-bottom-3 duration-300">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] bg-primary/20 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-bold">
                      Personal Assistant
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                  </div>
                  <p className="text-[11px] text-slate-200 leading-tight">
                    Hey there! I&apos;m Lynn, your personal real estate assistant. Are you looking to buy, or just exploring your options? Let m...
                  </p>
                </div>
                <div className="flex justify-end">
                  <div className="w-11 h-11 rounded-full bg-primary border-2 border-slate-800 shadow-2xl flex items-center justify-center font-bold text-primary-foreground">
                    👩‍💼
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* Add new page modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl p-6 w-full max-w-lg animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-border mb-4">
              <h3 className="font-extrabold text-base text-foreground">ADD NEW LANDING PAGE</h3>
              <button onClick={() => setIsCreating(false)} className="text-muted-foreground hover:text-foreground font-black text-lg">×</button>
            </div>

            <form action={handleCreatePage} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Page Name *</label>
                  <input required name="title" placeholder="New Page(6)" defaultValue="New Page(6)" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                    Lead Source *
                    <span className="text-muted-foreground cursor-help" title="Identifies lead conversion sources.">❓</span>
                  </label>
                  <input required name="leadSource" defaultValue="Website" placeholder="Website" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">URL *</label>
                <div className="flex rounded-lg border border-border overflow-hidden text-sm">
                  <span className="bg-muted px-3 py-2 text-muted-foreground select-none">excellegacyrealtyteam.com</span>
                  <input required name="slug" defaultValue="/new-page6" placeholder="/new-page6" className="flex-1 bg-background px-3 py-2 focus:outline-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Property Type</label>
                <div className="flex gap-6 items-center pt-1">
                  <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="propertyType"
                      value="for-sale"
                      defaultChecked
                      className="text-primary focus:ring-0"
                    />
                    For Sale
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="propertyType"
                      value="for-sold"
                      className="text-primary focus:ring-0"
                    />
                    For Sold
                  </label>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Property Address *</label>
                  <button
                    type="button"
                    onClick={() => toast('Direct address autocompletion synced through MLS seats!')}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    ➕ Add Manual Listing
                  </button>
                </div>
                <input
                  required
                  name="address"
                  placeholder="Enter street address and select a property"
                  defaultValue="3547 Alvina Avenue, Warren, MI 48091"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
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
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
