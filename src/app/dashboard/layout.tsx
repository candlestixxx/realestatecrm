import Link from 'next/link';
import AIChat from '@/components/AIChat';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SignOutButton from '@/components/SignOutButton';
import { getProjectVersion } from '@/lib/version';
import UserProfileDropdown from '@/components/UserProfileDropdown';
import { CommandPalette } from '@/components/CommandPalette';
import { DashboardHeaderActions } from '@/components/DashboardHeaderActions';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher';
import { OnboardingTour } from '@/components/OnboardingTour';
import { ThemeToggle } from '@/components/ThemeToggle';
import prisma from '@/lib/prisma';
import Script from 'next/script';
import CommunicationsHub from '@/components/CommunicationsHub';
import { processDueCampaignTasks } from '@/lib/campaign-processor';
import { startSyncScheduler } from '@/lib/sync-scheduler';
import LeadAlertListener from '@/components/LeadAlertListener';
import NotificationDropdown from '@/components/NotificationDropdown';
import SidebarNav from '@/components/dashboard/SidebarNav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (err) {
    console.warn('Session decryption failed:', err);
  }

  if (!session) {
    redirect('/api/auth/signin');
  }

  // Start MyPlusLeads background sync scheduler if not already started
  try {
    startSyncScheduler();
  } catch (e) {
    console.error('Failed to start sync scheduler:', e);
  }

  // Auto-process any pending drip campaign steps that are now due
  try {
    await processDueCampaignTasks();
  } catch (e) {
    console.error('Failed processing due drip campaigns in layout:', e);
  }

  // Workspace access can throw WorkspaceAccessError (or a Turbopack-duplicated
  // variant that fails instanceof checks). Catch here so the layout never crashes
  // — individual pages handle their own access denials via error.tsx boundaries.
  let workspaces: { id: string; name: string; slug: string }[] = [];
  try {
    const access = await requireWorkspaceAccess(session);
    workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: { userId: access.userId },
        },
      },
    });
  } catch (e) {
    console.error('Workspace access check failed in dashboard layout:', e);
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside aria-label="Main sidebar" className="w-64 border-r border-border bg-muted/30 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-sm bg-secondary flex items-center justify-center font-bold text-secondary-foreground text-xs">
              E
            </div>
            <span className="font-semibold text-primary dark:text-foreground">Excel Legacy</span>
          </div>
        </div>

        <SidebarNav />
        <div className="p-4 border-t border-border bg-muted/10">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest text-center font-bold">
            Version {getProjectVersion()}
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
              <NotificationDropdown />
              <WorkspaceSwitcher workspaces={workspaces} activeSlug={access.workspaceSlug} />
              <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-secondary/15 text-secondary border border-secondary/30 uppercase tracking-wider">
                {access.workspaceRole.replace('REALTOR_', '').replace('_', ' ')} Seat
              </span>
              <UserProfileDropdown 
                userName={session?.user?.name || 'User'} 
                userEmail={session?.user?.email || 'user@excellegacy.com'} 
              />
            </div>
          </div>
          <div className="flex items-center gap-4 ml-4">
            <DashboardHeaderActions />
          </div>
        </header>
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto p-6">{children}</div>
          <CommunicationsHub />
        </div>
      </main>
      <LeadAlertListener />
      <AIChat />
      <OnboardingTour />
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&libraries=places,drawing`}
        strategy="afterInteractive"
      />
    </div>
  );
}
