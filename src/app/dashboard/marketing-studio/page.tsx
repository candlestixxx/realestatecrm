'use client';

import {} from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Posts This Month', value: '24', icon: '📝' },
          { label: 'Scheduled', value: '8', icon: '📅' },
          { label: 'Active Campaigns', value: '3', icon: '🚀' },
          { label: 'Total Reach', value: '12.4k', icon: '📈' },
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

      {/* Tools Grid */}
      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Tools & Channels</h2>
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

      {/* Recent Activity */}
      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
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
