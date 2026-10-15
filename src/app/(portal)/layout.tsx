export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6 px-4 md:px-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-md"></div>
          <span className="font-bold text-lg tracking-tight">Client Portal</span>
        </div>
        <nav className="flex items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">Support</span>
          <button type="button" className="text-sm font-medium hover:text-primary transition-colors">
            Sign Out
          </button>
        </nav>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8">{children}</main>
    </div>
  );
}
