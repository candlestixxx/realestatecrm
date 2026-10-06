'use client';
// Websites hub page — parent route for /dashboard/websites/* so the sidebar link resolves.
// The actual site builder lives at /dashboard/websites/builder.

import Link from 'next/link';
import { Globe, Wrench, ArrowRight } from 'lucide-react';

const TOOLS = [
  {
    title: 'Site Builder',
    description: 'Drag-and-drop landing page builder. Create, publish, and manage property websites.',
    href: '/dashboard/websites/builder',
    icon: Wrench,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
];

export default function WebsitesPage() {
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <Globe className="w-6 h-6 text-primary" />
        Websites
      </h1>
      <p className="text-muted-foreground mb-6">
        Build and manage your property and lead-capture websites.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group rounded-lg border p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`rounded-md p-2 ${tool.bg}`}>
                <tool.icon className={`w-5 h-5 ${tool.color}`} />
              </div>
              <h2 className="font-semibold group-hover:text-primary transition-colors">{tool.title}</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{tool.description}</p>
            <span className="text-sm text-primary flex items-center gap-1">
              Open <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
