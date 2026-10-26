import prisma from './prisma';

/**
 * White-label branding for a workspace (brokerage).
 * Client-facing surfaces — the client portal, e-signing pages, and outbound
 * emails — render with these values so each brokerage's clients see their
 * brand, not ours. Defaults keep everything functional without setup.
 */

export interface WorkspaceBranding {
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  portalSlug: string | null;
  emailFooter: string | null;
  brokeragePhone: string | null;
  brokerageAddress: string | null;
}

export const DEFAULT_BRANDING: WorkspaceBranding = {
  name: 'Excel Legacy Realty',
  logoUrl: null,
  primaryColor: '#2563eb',
  accentColor: '#d4af37',
  portalSlug: null,
  emailFooter: null,
  brokeragePhone: null,
  brokerageAddress: null,
};

const HEX = /^#[0-9a-fA-F]{6}$/;

export function sanitizeColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && HEX.test(value.trim()) ? value.trim() : fallback;
}

export async function getWorkspaceBranding(workspaceId: string): Promise<WorkspaceBranding> {
  try {
    const ws = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        name: true, logoUrl: true, primaryColor: true, accentColor: true,
        portalSlug: true, emailFooter: true, brokeragePhone: true, brokerageAddress: true,
      },
    });
    if (!ws) return DEFAULT_BRANDING;
    return {
      name: ws.name || DEFAULT_BRANDING.name,
      logoUrl: ws.logoUrl || null,
      primaryColor: sanitizeColor(ws.primaryColor, DEFAULT_BRANDING.primaryColor),
      accentColor: sanitizeColor(ws.accentColor, DEFAULT_BRANDING.accentColor),
      portalSlug: ws.portalSlug || null,
      emailFooter: ws.emailFooter || null,
      brokeragePhone: ws.brokeragePhone || null,
      brokerageAddress: ws.brokerageAddress || null,
    };
  } catch {
    return DEFAULT_BRANDING;
  }
}
