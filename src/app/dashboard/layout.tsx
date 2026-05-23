import AIChat from '@/components/AIChat';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import SignOutButton from '@/components/SignOutButton';
import { getProjectVersion } from '@/lib/version';
import { CommandPalette } from '@/components/CommandPalette';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

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
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 rounded-md bg-primary/10 text-primary font-medium"
          >
            Dashboard
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            Leads
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            Contacts
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            Deals
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            Workflows
          </a>
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
          <div className="flex-1 flex justify-center px-4">
            <CommandPalette />
          </div>
          <div className="flex items-center gap-4">
            <button className="text-sm font-medium px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              + New Deal
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
      <AIChat />
    </div>
  );
}
