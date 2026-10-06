'use client';
// Marketing hub page — groups SMS text codes and marketing tools.
// Parent route for /dashboard/marketing/* so the sidebar link resolves.

import Link from 'next/link';
import { MessageSquare, Megaphone, ArrowRight } from 'lucide-react';

const TOOLS = [
  {
    title: 'Text Codes',
    description: 'Create SMS keyword campaigns. Prospects text a code to capture leads automatically.',
    href: '/dashboard/marketing/text-codes',
    icon: MessageSquare,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
];

export default function MarketingPage() {
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <Megaphone className="w-6 h-6 text-primary" />
        Marketing
      </h1>
      <p className="text-muted-foreground mb-6">
        Outbound marketing tools for lead capture and campaigns.
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
