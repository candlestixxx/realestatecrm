import Link from 'next/link';
import prisma from '@/lib/prisma';

export default async function DashboardHome() {
  const [leadCount, contactCount, taskCount, deals] = await Promise.all([
    prisma.lead.count(),
    prisma.contact.count(),
    prisma.task.count({ where: { status: { not: 'DONE' } } }),
    prisma.deal.findMany({ where: { stage: { not: 'CLOSED_WON' } } }),
  ]);

  const activePipelineValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your business and daily tasks.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/leads?status=NEW"
          className="p-6 bg-background border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow block"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Leads</p>
              <h3 className="text-2xl font-bold mt-2">{leadCount}</h3>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
        </Link>

        <Link
          href="/deals"
          className="p-6 bg-background border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow block"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Pipeline</p>
              <h3 className="text-2xl font-bold mt-2">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                }).format(activePipelineValue)}
              </h3>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </Link>

        <Link
          href="/tasks?status=TODO"
          className="p-6 bg-background border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow block"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tasks Due</p>
              <h3 className="text-2xl font-bold mt-2">{taskCount}</h3>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
          </div>
        </Link>

        <Link
          href="/contacts"
          className="p-6 bg-background border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow block"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
              <h3 className="text-2xl font-bold mt-2">{contactCount}</h3>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                />
              </svg>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
