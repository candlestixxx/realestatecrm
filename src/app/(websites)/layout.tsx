export default function WebsitesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="website-tenant-layout font-sans text-foreground bg-background antialiased selection:bg-primary selection:text-primary-foreground min-h-screen flex flex-col">
      {/*
        This is the global wrapper for the multi-tenant real estate sites.
        Any Next.js head tags (metadata), Google Tag Manager,
        or GA4 scripts will be injected dynamically here based on the active domain mapping.
      */}
      <main className="flex-grow">{children}</main>

      <footer className="py-8 bg-muted text-muted-foreground text-center text-xs mt-auto">
        <div className="max-w-4xl mx-auto px-6">
          Powered by Excel Legacy Real Estate CRM.
        </div>
      </footer>
    </div>
  );
}
