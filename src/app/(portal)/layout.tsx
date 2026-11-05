import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import PortalSignOut from '@/components/portal/PortalSignOut';
import { getWorkspaceBranding, DEFAULT_BRANDING } from '@/lib/branding';
import { resolveWorkspaceAccess } from '@/lib/workspace-access';

/**
 * Client portal layout — white-label: renders the brokerage's logo, name, and
 * primary color (from workspace branding settings) so clients see their
 * brokerage's portal, not a generic product. Falls back to defaults when no
 * branding is configured.
 */

async function loadBranding() {
  try {
    // Multi-tenant: the signed-in user's workspace carries the brand.
    const session = await getServerSession(authOptions);
    const access = await resolveWorkspaceAccess(session);
    if (access) return getWorkspaceBranding(access.workspaceId);
  } catch { /* fall through to defaults */ }
  return DEFAULT_BRANDING;
}

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const branding = await loadBranding();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-16 border-b border-border bg-background flex items-center justify-between px-4 md:px-8">
        <Link href="/portal" className="flex items-center gap-2.5">
          {branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logoUrl} alt={branding.name} className="w-8 h-8 rounded-md object-contain bg-white/90 border border-border/40" />
          ) : (
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center text-sm font-black text-white"
              style={{ backgroundColor: branding.primaryColor }}
            >
              {branding.name.slice(0, 1)}
            </div>
          )}
          <div className="leading-tight">
            <span className="font-bold text-lg tracking-tight">{branding.name}</span>
            <span className="block text-[10px] text-muted-foreground -mt-0.5">Client Portal</span>
          </div>
        </Link>
        <nav className="flex items-center gap-4">
          {branding.brokeragePhone ? (
            <a href={'tel:' + branding.brokeragePhone} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Support: {branding.brokeragePhone}
            </a>
          ) : (
            <span className="text-sm font-medium text-muted-foreground">Support</span>
          )}
          <PortalSignOut />
        </nav>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8">{children}</main>

      {(branding.brokerageAddress || branding.emailFooter) && (
        <footer className="border-t border-border/40 px-4 md:px-8 py-4 text-[11px] text-muted-foreground">
          {branding.brokerageAddress}
          {branding.emailFooter && <span className="block mt-1 whitespace-pre-line">{branding.emailFooter}</span>}
        </footer>
      )}
    </div>
  );
}
