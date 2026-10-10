'use client';

import { useEffect } from 'react';
import Link from 'next/link';

const TOOLS = [
  {
    icon: '✨',
    title: 'AI Content Studio',
    description: 'Generate posts with AI using brand voice and real-time research.',
    href: '/dashboard/agent-websites?tab=ai-creator',
    color: 'bg-purple-500/10 text-purple-500',
  },
  {
    icon: '📱',
    title: 'Social Studio',
    description: 'Create, schedule, and manage social media posts across platforms.',
    href: '/dashboard/agent-websites?tab=social-agent',
    color: 'bg-pink-500/10 text-pink-500',
  },
  {
    icon: '✍️',
    title: 'SEO & Blog Creator',
    description: 'Write SEO-optimized blog posts and articles that rank.',
    href: '/dashboard/agent-websites?tab=seo-blog',
    color: 'bg-green-500/10 text-green-500',
  },
  {
    icon: '🎬',
    title: 'Media Studio',
    description: 'Create video content, reels, and visual assets.',
    href: '/workflows/marketing-media',
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    icon: '📅',
    title: 'Publishing Calendar',
    description: 'Plan and schedule your content calendar.',
    href: '/dashboard/calendar',
    color: 'bg-orange-500/10 text-orange-500',
  },
  {
    icon: '🏢',
    title: 'Landing Pages',
    description: 'Build high-converting landing pages and property sites.',
    href: '/dashboard/agent-websites?tab=traditional',
    color: 'bg-indigo-500/10 text-indigo-500',
  },
  {
    icon: '📊',
    title: 'Drip Campaigns',
    description: 'Automated multi-step email and SMS campaigns.',
    href: '/dashboard/campaigns',
    color: 'bg-red-500/10 text-red-500',
  },
  {
    icon: '🔗',
    title: 'Social Connections',
    description: 'Connect and manage your social media accounts.',
    href: '/dashboard/social',
    color: 'bg-cyan-500/10 text-cyan-500',
  },
  {
    icon: '💬',
    title: 'Unified Inbox',
    description: 'All conversations from email, SMS, and social in one place.',
    href: '/dashboard/inbox',
    color: 'bg-teal-500/10 text-teal-500',
  },
  {
    icon: '🏷️',
    title: 'SMS Text Codes',
    description: 'Create keyword-based SMS auto-response campaigns.',
    href: '/dashboard/marketing/text-codes',
    color: 'bg-yellow-500/10 text-yellow-500',
  },
];

function MarketingStats() {
  const [stats, setStats] = useState({ posts: 0, campaigns: 0, scheduled: 0, views: 0, likes: 0, shares: 0 });
  const [platforms, setPlatforms] = useState<Array<{ platform: string; views: number; likes: number; shares: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      fetch('http://localhost:3031/posts').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('http://localhost:3031/campaigns').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('http://localhost:3031/analytics').then(r => r.ok ? r.json() : {}).catch(() => ({})),
    ]).then(([postsRes, campaignsRes, analyticsRes]) => {
      const posts = postsRes.status === 'fulfilled' && Array.isArray(postsRes.value) ? postsRes.value : [];
      const campaigns = campaignsRes.status === 'fulfilled' && Array.isArray(campaignsRes.value) ? campaignsRes.value : [];
      const analytics = analyticsRes.status === 'fulfilled' && typeof analyticsRes.value === 'object' ? analyticsRes.value : {};
      setStats({
        posts: posts.length,
        campaigns: campaigns.length,
        scheduled: posts.filter((p: { status?: string }) => p.status === 'SCHEDULED' || p.status === 'scheduled').length,
        views: (analytics as { totalViews?: number }).totalViews || 0,
        likes: (analytics as { totalLikes?: number }).totalLikes || 0,
        shares: (analytics as { totalShares?: number }).totalShares || 0,
      });
      const plats = (analytics as { platforms?: Array<{ platform: string; views: number; likes: number; shares: number }> }).platforms;
      if (Array.isArray(plats)) setPlatforms(plats);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Posts', value: loading ? '...' : String(stats.posts), icon: '📝' },
          { label: 'Scheduled', value: loading ? '...' : String(stats.scheduled), icon: '📅' },
          { label: 'Active Campaigns', value: loading ? '...' : String(stats.campaigns), icon: '🚀' },
          { label: 'Total Views', value: loading ? '...' : stats.views.toLocaleString(), icon: '👁️' },
        ].map(stat => (
          <div key={stat.label} className="bg-background border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className="text-2xl font-extrabold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>
      {!loading && platforms.length > 0 && (
        <div className="bg-background border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📊</span>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Platform Breakdown</span>
            <span title="Per-platform engagement metrics from the Content Planner analytics API." aria-label="About platform breakdown: Per-platform engagement metrics from the Content Planner analytics API." className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-[9px] text-gray-500 cursor-help">?</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {platforms.map(p => (
              <div key={p.platform} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-foreground">{p.platform}</span>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span title="Views" className="cursor-help">{p.views} views</span>
                  <span title="Likes" className="cursor-help">{p.likes} likes</span>
                  <span title="Shares" className="cursor-help">{p.shares} shares</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ContentPlannerNotifications() {
  const [notifs, setNotifs] = useState<Array<{ id: string; message: string; read: boolean; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3031/notifications')
      .then(r => r.ok ? r.json() : [])
      .then((data: Array<{ id: string; message: string; read: boolean; createdAt: string }>) => setNotifs(Array.isArray(data) ? data : []))
      .catch(() => setNotifs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (notifs.length === 0) return null;

  const unread = notifs.filter(n => !n.read);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Content Planner Notifications
          {unread.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">{unread.length}</span>
          )}
        </h2>
        <span title="Notifications from the Content Planner service (port 3031) about campaigns, post publishing, and scheduling recommendations." aria-label="About these notifications: From the Content Planner service about campaigns, post publishing, and scheduling." className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[9px] text-muted-foreground cursor-help">?</span>
      </div>
      <div className="space-y-2">
        {notifs.slice(0, 5).map(n => (
          <div
            key={n.id}
            className={'flex items-start gap-3 rounded-lg border px-3 py-2 ' + (n.read ? 'bg-muted/30 border-border opacity-60' : 'bg-background border-border')}
          >
            <span className="text-sm mt-0.5">{n.read ? '📭' : '📬'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">{n.message}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContentPipeline() {
  const [videos, setVideos] = useState<Array<{ id: string; title: string; createdAt: string }>>([]);
  const [podcasts, setPodcasts] = useState<Array<{ id: string; title: string; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      fetch('http://localhost:3031/video-projects').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('http://localhost:3031/podcasts').then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([vidRes, podRes]) => {
      if (vidRes.status === 'fulfilled' && Array.isArray(vidRes.value)) setVideos(vidRes.value);
      if (podRes.status === 'fulfilled' && Array.isArray(podRes.value)) setPodcasts(podRes.value);
    }).finally(() => setLoading(false));
  }, []);

  if (loading || (videos.length === 0 && podcasts.length === 0)) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Content Pipeline</h2>
        <span title="Recent video projects and podcast episodes from the Content Planner service (port 3031)." aria-label="About Content Pipeline: Recent video projects and podcast episodes from Content Planner." className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[9px] text-muted-foreground cursor-help">?</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {videos.length > 0 && (
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🎬</span>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Video Projects</span>
            </div>
            <div className="space-y-2">
              {videos.slice(0, 3).map(v => (
                <div key={v.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                  <span className="text-sm text-foreground truncate">{v.title}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{new Date(v.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {podcasts.length > 0 && (
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🎙️</span>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Podcast Episodes</span>
            </div>
            <div className="space-y-2">
              {podcasts.slice(0, 3).map(p => (
                <div key={p.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                  <span className="text-sm text-foreground truncate">{p.title}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MarketingStudioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Marketing Studio <span title="Central hub for all marketing tools including campaigns, content planning, social media, text codes, and website builder." aria-label="About this section: Central hub for all marketing tools including campaigns, content planning, social media, text codes, and website builder." className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-[9px] text-gray-500 cursor-help ml-2 align-middle">?</span></h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your central hub for content creation, social media, and marketing automation.
        </p>
      </div>

      {/* Quick Stats */}
      <MarketingStats />

      {/* Tools Grid */}
      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Tools & Channels <span title="Links to all marketing tool pages within the CRM dashboard." aria-label="About Tools and Channels: Links to all marketing tool pages within the CRM dashboard." className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[9px] text-muted-foreground cursor-help ml-1 align-middle">?</span></h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map(tool => (
            <Link
              key={tool.title}
              href={tool.href}
              className="bg-background border border-border rounded-xl p-5 hover:border-secondary/50 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${tool.color} flex-shrink-0`}>
                  {tool.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-secondary transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Content Planner Integration */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Content Planner</h2>
          <span title="Integrated content planning service (port 3003) for social posts, campaigns, brand kits, and analytics. Links open the Content Planner app." aria-label="Content Planner: Integrated content planning service for social posts, campaigns, brand kits, and analytics." className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[9px] text-muted-foreground cursor-help">?</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Posts', desc: 'Create and schedule social media posts.', icon: '📝', href: 'http://localhost:3003/posts' },
            { title: 'Campaigns', desc: 'Manage content marketing campaigns.', icon: '🚀', href: 'http://localhost:3003/campaigns' },
            { title: 'Brand Kits', desc: 'Configure brand voice and style guides.', icon: '🎨', href: 'http://localhost:3003/brand-kits' },
            { title: 'Analytics', desc: 'Track content performance metrics.', icon: '📊', href: 'http://localhost:3003/analytics' },
          ].map(item => (
            <a
              key={item.title}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-background border border-border rounded-xl p-4 hover:border-secondary/50 hover:shadow-md transition-all group"
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <h3 className="text-sm font-bold text-foreground group-hover:text-secondary transition-colors">{item.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Content Planner Notifications */}
      <ContentPlannerNotifications />

      {/* Content Pipeline */}
      <ContentPipeline />

      {/* LegacyLeads Integration */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">LegacyLeads</h2>
          <span title="Lead generation and skip-tracing service (port 3005/3006) for property data, compliance, and credit management." aria-label="LegacyLeads: Lead generation and skip-tracing service for property data, compliance, and credit management." className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[9px] text-muted-foreground cursor-help">?</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Property Search', desc: 'Search MLS listings with advanced filters.', icon: '🏠', href: 'http://localhost:3005' },
            { title: 'Skip Trace', desc: 'Find contact info for property owners.', icon: '🔍', href: 'http://localhost:3005' },
            { title: 'Compliance', desc: 'TCPA compliance and DNC checks.', icon: '🛡️', href: 'http://localhost:3005' },
          ].map(item => (
            <a
              key={item.title}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-background border border-border rounded-xl p-4 hover:border-secondary/50 hover:shadow-md transition-all group"
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <h3 className="text-sm font-bold text-foreground group-hover:text-secondary transition-colors">{item.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions <span title="Shortcuts to common marketing tasks like generating content, scheduling posts, and creating campaigns." aria-label="About Quick Actions: Shortcuts to common marketing tasks." className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[9px] text-muted-foreground cursor-help ml-1 align-middle">?</span></h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/agent-websites?tab=ai-creator"
            className="px-5 py-2.5 bg-secondary text-secondary-foreground text-sm font-bold rounded-lg hover:bg-secondary/90 transition-colors"
          >
            ✨ Generate with AI
          </Link>
          <Link
            href="/dashboard/calendar"
            className="px-5 py-2.5 border border-border text-sm font-bold rounded-lg hover:bg-muted transition-colors text-foreground"
          >
            📅 Schedule Post
          </Link>
          <Link
            href="/dashboard/campaigns"
            className="px-5 py-2.5 border border-border text-sm font-bold rounded-lg hover:bg-muted transition-colors text-foreground"
          >
            🚀 New Campaign
          </Link>
        </div>
      </div>
    </div>
  );
}
