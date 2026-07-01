import Link from 'next/link';
import AIChat from '@/components/AIChat';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
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

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

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
            <div className="w-6 h-6 rounded-sm bg-secondary flex items-center justify-center font-bold text-secondary-foreground text-xs">
              E
            </div>
            <span className="font-semibold text-primary dark:text-foreground">Excel Legacy</span>
          </div>
        </div>
<<<<<<< Updated upstream
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
            href="/workflows/marketing-media"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            Media Studio
          </Link>
          <Link
            href="/dashboard/agent-websites"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            Agent Websites
          </Link>
          <Link
            href="/dashboard/help-center"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            Help Center
          </Link>

          {/* Grouped Settings section */}
          <div className="pt-4 mt-4 border-t border-border/40">
            <span className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
              ⚙️ Settings
            </span>
            <div className="space-y-1 pl-2">
              <Link
                href="/dashboard/settings/integrations"
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs"
              >
                Lead Integrations
              </Link>
              <Link
                href="/dashboard/settings/email"
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs"
              >
                Email Settings
              </Link>
              <Link
                href="/dashboard/settings/voice"
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs"
              >
                Voice & Speech
              </Link>
              <Link
                href="/dashboard/sync-queue"
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs"
              >
                Sync Queue
              </Link>
            </div>
          </div>
=======
        <nav className="flex-1 px-4 py-6 space-y-4">
          {/* CRM Core */}
          <div className="relative group/menu">
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/40 hover:bg-muted text-foreground font-black text-xs cursor-pointer transition-all border border-border/40 select-none">
              <span className="flex items-center gap-2">🗂️ CRM Core</span>
              <span className="text-[10px] text-muted-foreground/55 font-bold group-hover/menu:translate-x-0.5 transition-transform">→</span>
            </div>
            
            <div className="absolute left-full top-0 ml-2.5 z-50 w-52 bg-background border border-border rounded-xl shadow-2xl overflow-hidden py-1.5 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-150 transform translate-x-2 group-hover/menu:translate-x-0">
              <div className="px-3 pb-1 border-b border-border/40 mb-1">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Core CRM</span>
              </div>
              <Link href="/dashboard" className="block px-4 py-2 hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground">
                Dashboard Overview
              </Link>
              <Link href="/dashboard/leads" className="block px-4 py-2 hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground">
                Leads & Contacts
              </Link>
              <Link href="/dashboard/segments" className="block px-4 py-2 hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground">
                Filtered Segments
              </Link>
              <Link href="/dashboard/deals" className="block px-4 py-2 hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground">
                Deals Pipeline
              </Link>
              <Link href="/dashboard/tasks" className="block px-4 py-2 hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground">
                Task Checklist
              </Link>
              <Link href="/dashboard/reporting" className="block px-4 py-2 hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground">
                Reporting Studio
              </Link>
            </div>
          </div>

          {/* Marketing & Content */}
          <div className="relative group/menu">
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/40 hover:bg-muted text-foreground font-black text-xs cursor-pointer transition-all border border-border/40 select-none">
              <span className="flex items-center gap-2">📢 Marketing & CMS</span>
              <span className="text-[10px] text-muted-foreground/55 font-bold group-hover/menu:translate-x-0.5 transition-transform">→</span>
            </div>
            
            <div className="absolute left-full top-0 ml-2.5 z-50 w-52 bg-background border border-border rounded-xl shadow-2xl overflow-hidden py-1.5 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-150 transform translate-x-2 group-hover/menu:translate-x-0">
              <div className="px-3 pb-1 border-b border-border/40 mb-1">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Marketing</span>
              </div>
              <Link href="/dashboard/campaigns" className="block px-4 py-2 hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground">
                Drip Campaigns
              </Link>
              <Link href="/dashboard/agent-websites" className="block px-4 py-2 hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground">
                Websites & Landing Pages
              </Link>
              <Link href="/workflows/marketing-media" className="block px-4 py-2 hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground">
                Media Studio
              </Link>
              <Link href="/dashboard/marketing/text-codes" className="block px-4 py-2 hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground">
                SMS Text Codes
              </Link>
            </div>
          </div>

          {/* Automations */}
          <div className="relative group/menu">
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/40 hover:bg-muted text-foreground font-black text-xs cursor-pointer transition-all border border-border/40 select-none">
              <span className="flex items-center gap-2">🤖 Automations</span>
              <span className="text-[10px] text-muted-foreground/55 font-bold group-hover/menu:translate-x-0.5 transition-transform">→</span>
            </div>
            
            <div className="absolute left-full top-0 ml-2.5 z-50 w-52 bg-background border border-border rounded-xl shadow-2xl overflow-hidden py-1.5 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-150 transform translate-x-2 group-hover/menu:translate-x-0">
              <div className="px-3 pb-1 border-b border-border/40 mb-1">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Wizards</span>
              </div>
              <Link href="/dashboard/agent-studio" className="block px-4 py-2 hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground">
                Agent Studio (AI)
              </Link>
              <Link href="/dashboard/workflows" className="block px-4 py-2 hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground">
                Workflows (Wizards)
              </Link>
            </div>
          </div>

          {/* Settings */}
          <div className="relative group/menu">
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/40 hover:bg-muted text-foreground font-black text-xs cursor-pointer transition-all border border-border/40 select-none">
              <span className="flex items-center gap-2">⚙️ CRM Settings</span>
              <span className="text-[10px] text-muted-foreground/55 font-bold group-hover/menu:translate-x-0.5 transition-transform">→</span>
            </div>
            
            <div className="absolute left-full top-0 ml-2.5 z-50 w-52 bg-background border border-border rounded-xl shadow-2xl overflow-hidden py-1.5 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-150 transform translate-x-2 group-hover/menu:translate-x-0">
              <div className="px-3 pb-1 border-b border-border/40 mb-1">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Configuration</span>
              </div>
              <Link href="/dashboard/settings/integrations" className="block px-4 py-2 hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground">
                Lead Integrations
              </Link>
              <Link href="/dashboard/settings/routing" className="block px-4 py-2 hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground">
                Lead Routing
              </Link>
              <Link href="/dashboard/settings/email" className="block px-4 py-2 hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground">
                Email Settings
              </Link>
              <Link href="/dashboard/sync-queue" className="block px-4 py-2 hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground">
                Sync Queue Log
              </Link>
            </div>
          </div>

          {/* Support */}
          <div className="pt-2 border-t border-border/20">
            <Link
              href="/dashboard/help-center"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all text-xs font-bold"
            >
              🤝 Help Center
            </Link>
          </div>
>>>>>>> Stashed changes
        </nav>
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
