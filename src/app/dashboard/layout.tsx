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
import { OnboardingTour } from '@/components/OnboardingTour';
import { ThemeToggle } from '@/components/ThemeToggle';
import prisma from '@/lib/prisma';
import Script from 'next/script';
import SidebarAIAssistant from '@/components/SidebarAIAssistant';
import { processDueCampaignTasks } from '@/lib/campaign-processor';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  // Auto-process any pending drip campaign steps that are now due
  try {
    await processDueCampaignTasks();
  } catch (e) {
    console.error('Failed processing due drip campaigns in layout:', e);
  }

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
            <div className="w-6 h-6 rounded-sm bg-secondary flex items-center justify-center font-bold text-secondary-foreground text-xs">
              E
            </div>
            <span className="font-semibold text-primary dark:text-foreground">Excel Legacy</span>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
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
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            Workflows
          </Link>
          <Link
            href="/dashboard/sync-queue"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-2">
              ↗ Sync Queue
              <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded-full font-medium">
                MyPlus → Lofty
              </span>
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
            href="/dashboard/settings/integrations"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            Lead Integrations
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
          <div className="md:hidden flex items-center gap-2">
            <div className="w-6 h-6 rounded-sm bg-secondary flex items-center justify-center font-bold text-secondary-foreground text-xs">
              E
            </div>
          </div>
          <div className="flex-1 flex items-center justify-between px-4">
            <div className="flex-1 flex justify-center">
              <CommandPalette />
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
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
          <div className="flex-1 overflow-auto p-6">{children}</div>
          <SidebarAIAssistant />
        </div>
      </main>
      <AIChat />
      <OnboardingTour />
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&libraries=places`}
        strategy="afterInteractive"
      />
    </div>
  );
}
