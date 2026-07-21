'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  BookOpen, Sparkles, Plus, ArrowLeft, ArrowRight, Save, Eye, ChevronRight, FileText, CheckCircle2, AlertCircle, Settings, RefreshCw
} from 'lucide-react';

export default function SEOBlogTab({ workspaceId }: { workspaceId: string }) {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [showWalkthrough, setShowWalkthrough] = useState(true);
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState('Professional');
  
  // Phase 2 outline structure
  const [title, setTitle] = useState('Top Reasons to Move to Macomb County in 2026');
  const [headings, setHeadings] = useState<string[]>([
    'Introduction: The Growing Real Estate Hub of Metro Detroit',
    '1. High-Performing School Districts & Safe Suburbs',
    '2. Affordability & Diverse Listing Options',
    '3. Parks, Lake St. Clair Access & Local Attractions',
    'Conclusion: Finding Your Dream Property in Macomb County'
  ]);
  const [includeCTA, setIncludeCTA] = useState(true);

  // Phase 3 meta settings
  const [seoTitle, setSeoTitle] = useState('Top Reasons to Move to Macomb County in 2026 | Excel Legacy Realty');
  const [metaDesc, setMetaDesc] = useState('Looking to move to Macomb County, Michigan? Discover the best neighborhood listings, parks, schools, and real estate options with Excel Legacy.');
  const [slug, setSlug] = useState('move-to-macomb-county-2026');
  const [gmbVerification, setGmbVerification] = useState('GMB-VERIFY-8834920');

  const [isGenerating, setIsGenerating] = useState(false);
  const [articles, setArticles] = useState([
    {
      id: 'art-1',
      title: 'St. Clair Shores Lakefront Living Guide',
      slug: 'st-clair-shores-lakefront-guide',
      keywords: 'st clair shores, waterfront listings, macomb county',
      status: 'PUBLISHED',
      createdAt: '2026-07-12'
    },
    {
      id: 'art-2',
      title: 'Warren MI Seller Market Valuation Checklist',
      slug: 'warren-seller-market-valuation',
      keywords: 'home valuation warren, house prices, sell home mi',
      status: 'DRAFT',
      createdAt: '2026-07-10'
    }
  ]);

  const handleGenerateOutline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.error('Please enter an article topic or keyword prompt.');
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setTitle(topic);
      setPhase(2);
      toast.success('AI outline generated! Review and edit the section headings below.');
    }, 1800);
  };

  const handleHeadingChange = (index: number, val: string) => {
    const next = [...headings];
    next[index] = val;
    setHeadings(next);
  };

  const handleAddHeading = () => {
    setHeadings([...headings, 'New Heading Section']);
  };

  const handlePublish = (status: 'DRAFT' | 'PUBLISHED') => {
    const newArt = {
      id: String(Date.now()),
      title: seoTitle || title,
      slug,
      keywords,
      status,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setArticles([newArt, ...articles]);
    toast.success(status === 'PUBLISHED' ? 'SEO Article published successfully!' : 'Article draft saved for later.');
    setPhase(1);
    setTopic('');
    setKeywords('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            ✍️ SEO & Blog Creator
          </h2>
          <p className="text-xs text-muted-foreground font-semibold mt-1">
            Build high-ranking organic content, capture local Michigan search index traffic, and insert lead-capture pages instantly.
          </p>
        </div>

        {/* Phase Indicator */}
        <div className="flex items-center gap-1 bg-muted/50 p-1 border border-border/40 rounded-xl text-[10px] font-black uppercase tracking-wider">
          <span className={`px-2 py-1 rounded-lg ${phase === 1 ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground'}`}>1. Topic</span>
          <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
          <span className={`px-2 py-1 rounded-lg ${phase === 2 ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground'}`}>2. Outline</span>
          <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
          <span className={`px-2 py-1 rounded-lg ${phase === 3 ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground'}`}>3. Meta & Share</span>
        </div>
      </div>

      {/* Walkthrough Instructions */}
      {showWalkthrough && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 relative animate-fadeIn flex flex-col md:flex-row gap-5 shadow-xs">
          <button 
            onClick={() => setShowWalkthrough(false)}
            className="absolute top-3.5 right-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Dismiss walkthrough"
          >
            <span className="text-xs font-black uppercase tracking-wider flex items-center gap-0.5">Dismiss ×</span>
          </button>
          
          <div className="flex-1 space-y-3.5">
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <span>💡 Quickstart: SEO & Blog Creator</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs font-semibold text-muted-foreground leading-relaxed">
              <div className="space-y-1.5 p-3.5 bg-background/50 border border-border/40 rounded-xl">
                <span className="text-[10px] text-indigo-500 uppercase font-black tracking-wider block">Phase 1: Set Target</span>
                <p>Enter your article topic, key phrases, and tone of voice. Let the AI generator draft a high-ranking blog outline for your local market.</p>
              </div>
              <div className="space-y-1.5 p-3.5 bg-background/50 border border-border/40 rounded-xl">
                <span className="text-[10px] text-indigo-500 uppercase font-black tracking-wider block">Phase 2: Refine Outline</span>
                <p>Review the generated section headings. You can add or rephrase headings and toggle the custom lead capture Call-To-Action (CTA).</p>
              </div>
              <div className="space-y-1.5 p-3.5 bg-background/50 border border-border/40 rounded-xl">
                <span className="text-[10px] text-indigo-500 uppercase font-black tracking-wider block">Phase 3: Meta & Publish</span>
                <p>Customize the SEO Search Title, URL slug, and metadata, then publish to your blog and auto-push it to Google My Business.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Phase Composer Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {phase === 1 && (
            <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-5 animate-fadeIn">
              <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h3 className="font-extrabold text-sm text-foreground uppercase tracking-wider">Configure SEO Target</h3>
              </div>

              <form onSubmit={handleGenerateOutline} className="space-y-4 text-xs font-semibold text-muted-foreground">
                <div>
                  <label className="block mb-1 text-[10px] font-black uppercase">Article Topic or Main Concept</label>
                  <textarea
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Neighborhood guide to St. Clair Shores waterfront homes, detailing local parks, average home listings prices, and boat slip access."
                    rows={4}
                    className="w-full bg-background border border-border/60 rounded-xl p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-[10px] font-black uppercase">Target Keywords (Comma Separated)</label>
                    <input
                      type="text"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="e.g. st clair shores, lakefront listings"
                      className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-[10px] font-black uppercase">Tone of Voice</label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Professional">Professional & Authority</option>
                      <option value="Casual">Casual Neighborhood Expert</option>
                      <option value="Analytical">Analytical Market Analyst</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Analyzing Keywords & Compiling Outline...
                    </>
                  ) : (
                    <>
                      Generate SEO Outline <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {phase === 2 && (
            <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-5 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-extrabold text-sm text-foreground uppercase tracking-wider">Review & Edit Article Outline</h3>
                </div>
                <button
                  onClick={() => setPhase(1)}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Go Back
                </button>
              </div>

              <div className="space-y-4 text-xs font-semibold text-muted-foreground">
                <div>
                  <label className="block mb-1 text-[10px] font-black uppercase">Article Main Header (H1)</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-foreground focus:outline-none font-bold"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black uppercase">Section Headings (H2 / Outlines)</label>
                  {headings.map((heading, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="w-5 h-5 rounded-md bg-muted text-[10px] font-black flex items-center justify-center text-muted-foreground">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={heading}
                        onChange={(e) => handleHeadingChange(idx, e.target.value)}
                        className="flex-1 bg-background border border-border/60 rounded-xl px-3 py-2 text-foreground focus:outline-none font-semibold"
                      />
                    </div>
                  ))}
                  <button
                    onClick={handleAddHeading}
                    className="text-[10px] font-black text-indigo-500 hover:text-indigo-600 uppercase flex items-center gap-1 cursor-pointer mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Heading Section
                  </button>
                </div>

                {/* Lead Capture form inclusion toggle */}
                <div className="p-4 bg-muted/30 border border-border/40 rounded-2xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-sm text-foreground">Insert Lead Capture Form block</span>
                    <p className="text-[10px] text-muted-foreground font-medium">Embed a styled contact form automatically inside the final blog template.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeCTA}
                    onChange={(e) => setIncludeCTA(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500"
                  />
                </div>

                <button
                  onClick={() => setPhase(3)}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Configure Meta & Publish <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {phase === 3 && (
            <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-5 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-extrabold text-sm text-foreground uppercase tracking-wider">Publish Meta & Tracking Credentials</h3>
                </div>
                <button
                  onClick={() => setPhase(2)}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Go Back
                </button>
              </div>

              <div className="space-y-4 text-xs font-semibold text-muted-foreground">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-[10px] font-black uppercase">SEO Page Title</label>
                    <input
                      type="text"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-foreground focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-[10px] font-black uppercase">URL Slug Path</label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-[10px] font-black uppercase">SEO Meta Description</label>
                  <textarea
                    value={metaDesc}
                    onChange={(e) => setMetaDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-background border border-border/60 rounded-xl p-3 text-foreground focus:outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-[10px] font-black uppercase">GMB Page Verification Code</label>
                    <input
                      type="text"
                      value={gmbVerification}
                      onChange={(e) => setGmbVerification(e.target.value)}
                      className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-foreground focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-[10px] font-black uppercase">Structured Schema.org Markup</label>
                    <div className="bg-muted/40 p-2 border border-border/40 rounded-xl flex items-center justify-between text-foreground">
                      <span className="text-[10px] font-bold">LocalBusiness & Article Schema</span>
                      <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-black text-[9px]">AUTO READY</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-border/40">
                  <button
                    onClick={() => handlePublish('DRAFT')}
                    className="flex-1 py-3 bg-muted hover:bg-muted/80 text-foreground font-black uppercase tracking-widest text-[10px] rounded-xl transition-all cursor-pointer"
                  >
                    Save Draft
                  </button>
                  <button
                    onClick={() => handlePublish('PUBLISHED')}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Publish Live
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Directory Column */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Article indexing checklists */}
          <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="font-black text-xs text-foreground uppercase tracking-wider border-b border-border/40 pb-2 flex items-center gap-1.5">
              <span>📈 SEO Indexing Checklist</span>
            </h3>

            <div className="space-y-3 text-xs font-semibold text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-foreground">Title Keywords Density</span>
                  <p className="text-[10px] font-medium leading-relaxed">Keywords included in primary title (H1) and meta settings successfully.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-foreground">Sitemap Queued</span>
                  <p className="text-[10px] font-medium leading-relaxed">Auto-queues target slug to rebuild index file next cron cycle.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 animate-pulse">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-foreground">Internal Link Mapping</span>
                  <p className="text-[10px] font-medium leading-relaxed">Awaiting final publishing to inject internal directory link references.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Articles list */}
          <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="font-black text-xs text-foreground uppercase tracking-wider border-b border-border/40 pb-2">
              Recent Blog Articles
            </h3>
            
            <div className="space-y-3">
              {articles.map(art => (
                <div key={art.id} className="p-3 border border-border/40 rounded-xl hover:border-border transition-colors flex flex-col gap-1.5">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-extrabold text-foreground leading-tight line-clamp-1">{art.title}</span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded shrink-0 ${
                      art.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-muted text-muted-foreground'
                    }`}>
                      {art.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                    <span className="font-mono">/{art.slug}</span>
                    <span>{art.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
