import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import prisma from '@/lib/prisma';
import { seedSegmentsIfEmpty } from '@/lib/actions/segment';
import Link from 'next/link';

export default async function SegmentsPage() {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);
  const workspaceId = access.workspaceId;

  // Auto-seed default segments (Preforeclosures, FSBO, Expireds) if empty
  await seedSegmentsIfEmpty(workspaceId);

  // Fetch segments with lead counts
  const segments = await prisma.segment.findMany({
    where: { workspaceId },
    orderBy: { name: 'asc' },
    include: {
      leads: {
        include: { contact: true },
      },
    },
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-display text-primary dark:text-foreground">Drip Segments</h1>
          <p className="text-muted-foreground">Manage and filter target directories for mass outreach, alerts, and workflows.</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-lg text-xs uppercase tracking-wider">
          + Add New List
        </button>
      </div>

      {/* Segment Manager Cards (Graphic Visuals) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {segments.map((seg) => {
          const pinned = seg.name === 'Preforeclosure' || seg.name === 'FSBO';
          return (
            <div
              key={seg.id}
              className="bg-background border border-border rounded-2xl p-6 shadow-sm relative group hover:border-primary/50 transition-colors flex flex-col justify-between"
            >
              {pinned && (
                <span className="absolute top-4 right-4 text-xs font-bold text-secondary uppercase tracking-widest bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20">
                  📌 Pinned
                </span>
              )}
              <div className="space-y-2">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Segment List</span>
                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  {seg.name}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {seg.description || 'Custom filtered prospect pipeline.'}
                </p>
              </div>

              <div className="pt-6 mt-4 border-t border-border/60 flex items-end justify-between">
                <div>
                  <span className="block text-2xl font-bold text-foreground">{seg.leads.length}</span>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Active Leads</span>
                </div>
                <div className="flex flex-col items-end text-xs text-muted-foreground gap-1">
                  <span>Smart Plans: <strong className="text-foreground">Active</strong></span>
                  <span>Limits: <strong className="text-foreground">1,000 max</strong></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Segment List Details Table */}
      <div className="bg-background border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 className="font-bold text-md text-foreground">Segment Pipelines</h3>
          <input
            type="text"
            placeholder="Search segments..."
            className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-64"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
              <tr>
                <th className="px-6 py-3 font-medium">Segment Name</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium"># of Leads</th>
                <th className="px-6 py-3 font-medium">Total Campaigns</th>
                <th className="px-6 py-3 font-medium">Reminders</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {segments.map((seg) => (
                <tr key={seg.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4 font-bold text-foreground">{seg.name}</td>
                  <td className="px-6 py-4">
                    <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/25 text-[10px] font-semibold">
                      Static / Sync
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{seg.leads.length}</td>
                  <td className="px-6 py-4 text-muted-foreground">1 Active</td>
                  <td className="px-6 py-4 text-muted-foreground">N/A</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button className="text-[11px] font-bold text-primary hover:underline">
                        ✉️ Mass Outreach
                      </button>
                      <button className="text-[11px] font-bold text-primary hover:underline">
                        ⚡ Add Smart Plan
                      </button>
                      <Link
                        href="/dashboard/leads"
                        className="text-xs font-bold text-muted-foreground hover:text-foreground"
                      >
                        Open List &rarr;
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
