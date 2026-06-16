import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';

export default async function WorkflowsPage() {
  const session = await getServerSession(authOptions);
  await requireWorkspaceAccess(session);

  const workflows = [
    {
      id: 'foreclosure-intake',
      title: 'Foreclosure Intake',
      description: 'Process weekly Macomb County foreclosure notices into CRM leads.',
      href: '/workflows/foreclosure-intake',
      icon: '🏠',
      status: 'Ready',
    },
    {
      id: 'offer-draft',
      title: 'Offer Draft',
      description: 'Generate a structured real estate offer draft for a client and property.',
      href: '/workflows/offer-draft',
      icon: '📝',
      status: 'Ready',
    },
    {
      id: 'listing-entry',
      title: 'Listing Entry',
      description: 'Quickly entry property data and prepare it for MLS and marketing.',
      href: '/workflows/listing-entry',
      icon: '📷',
      status: 'Coming Soon',
    },
    {
      id: 'marketing-media',
      title: 'Media Studio',
      description: 'Generate branded property media, social captions, and sync with agent channels.',
      href: '/workflows/marketing-media',
      icon: '🎨',
      status: 'Ready',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
        <p className="text-muted-foreground">Automated business processes and task sequences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((wf) => (
          <div
            key={wf.id}
            className="bg-background border border-border rounded-xl shadow-sm overflow-hidden flex flex-col hover:border-primary/50 transition-colors group"
          >
            <div className="p-6 flex-1">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                {wf.icon}
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                {wf.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {wf.description}
              </p>
            </div>
            <div className="px-6 py-4 bg-muted/20 border-t border-border flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${wf.status === 'Ready' ? 'text-green-500' : 'text-muted-foreground'}`}>
                {wf.status}
              </span>
              <Link
                href={wf.href}
                className={`text-sm font-medium ${wf.status === 'Ready' ? 'text-primary hover:underline' : 'pointer-events-none opacity-50'}`}
              >
                Launch &rarr;
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
