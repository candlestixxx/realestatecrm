import Link from 'next/link';
import AIChat from '@/components/AIChat';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import SignOutButton from '@/components/SignOutButton';
import { getProjectVersion } from '@/lib/version';
import { CommandPalette } from '@/components/CommandPalette';
import { DashboardHeaderActions } from '@/components/DashboardHeaderActions';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher';
import prisma from '@/lib/prisma';
import SidebarAIAssistant from '@/components/SidebarAIAssistant';

export default async function WorkflowsLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  const workspaces = await prisma.workspace.findMany({
    where: {
      members: {
        some: { userId: access.userId },
      },
    },
  });

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-muted/30 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-sm bg-secondary flex items-center justify-center font-bold text-secondary-foreground text-xs">
                E
              </div>
              <span className="font-semibold text-primary dark:text-foreground">Excel Legacy</span>
            </Link>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {/* Back to CRM Navigation */}
          <div className="px-3 py-1 mb-2">
            <Link
              href="/dashboard/deals"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
            >
              &larr; Back to CRM Pipeline
            </Link>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/leads"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            Leads
          </Link>
          <Link
            href="/dashboard/segments"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            Segments
          </Link>
          <Link
            href="/dashboard/deals"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            Deals
          </Link>
          <Link
            href="/dashboard/tasks"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            Tasks
          </Link>
          <Link
            href="/dashboard/campaigns"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            Campaigns
          </Link>
          <Link
            href="/dashboard/agent-studio"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            Agent Studio
          </Link>
          <Link
            href="/dashboard/workflows"
            className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted text-foreground transition-colors"
          >
            Workflows
          </Link>
          <Link
            href="/dashboard/sync-queue"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-2">
              ↗ Sync Queue
            </span>
          </Link>
          <Link
            href="/dashboard/agent-websites"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            Agent Websites
          </Link>
          <Link
            href="/dashboard/settings/email"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            Email Settings
          </Link>
          <Link
            href="/dashboard/help-center"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            Help Center
          </Link>
        </nav>
        <div className="p-4 border-t border-border">
          <div className="mb-4 text-[10px] text-muted-foreground uppercase tracking-widest text-center">
            Version {getProjectVersion()}
          </div>
          <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-medium">
              {session?.user?.name?.[0] || 'U'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium truncate max-w-[150px]">
                {session?.user?.name || 'User'}
              </span>
              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                {session?.user?.email || 'user@example.com'}
              </span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/deals"
              className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-muted/50 border border-border transition-colors font-medium"
            >
              &larr; Back to CRM
            </Link>
          </div>
          <div className="flex-1 flex items-center justify-between px-4">
            <div className="flex-1 flex justify-center">
              <CommandPalette />
            </div>
            <div className="flex items-center gap-4">
              <WorkspaceSwitcher workspaces={workspaces} activeSlug={access.workspaceSlug} />
              <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-secondary/15 text-secondary border border-secondary/30 uppercase tracking-wider">
                {access.workspaceRole.replace('REALTOR_', '').replace('_', ' ')} Seat
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 ml-4">
            <DashboardHeaderActions />
          </div>
        </header>
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto p-6 bg-background/50">{children}</div>
          <SidebarAIAssistant />
        </div>
      </main>
      <AIChat />
    </div>
  );
}
