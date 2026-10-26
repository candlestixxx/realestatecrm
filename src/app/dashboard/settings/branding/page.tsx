'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Palette, Save, RotateCcw } from 'lucide-react';

/**
 * Settings → Branding (white-label).
 * Each brokerage workspace carries its own identity — name, logo, colors,
 * portal slug, contact block, email footer — rendered on client-facing
 * surfaces (client portal, e-signing pages, outbound emails) so clients see
 * their brokerage's brand, not ours.
 */

interface Branding {
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  portalSlug: string | null;
  emailFooter: string | null;
  brokeragePhone: string | null;
  brokerageAddress: string | null;
}

const DEFAULTS: Branding = {
  name: '', logoUrl: '', primaryColor: '#2563eb', accentColor: '#d4af37',
  portalSlug: '', emailFooter: '', brokeragePhone: '', brokerageAddress: '',
};

export default function BrandingSettingsPage() {
  const [branding, setBranding] = useState<Branding>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canManage, setCanManage] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [bRes, tRes] = await Promise.all([fetch('/api/branding'), fetch('/api/team')]);
        const bData = await bRes.json();
        if (!bRes.ok) throw new Error(bData.error || 'Failed to load branding');
        setBranding({
          name: bData.branding.name || '',
          logoUrl: bData.branding.logoUrl || '',
          primaryColor: bData.branding.primaryColor || '#2563eb',
          accentColor: bData.branding.accentColor || '#d4af37',
          portalSlug: bData.branding.portalSlug || '',
          emailFooter: bData.branding.emailFooter || '',
          brokeragePhone: bData.branding.brokeragePhone || '',
          brokerageAddress: bData.branding.brokerageAddress || '',
        });
        if (tRes.ok) {
          const tData = await tRes.json();
          setCanManage(['OWNER', 'BROKER', 'ADMIN'].includes(tData.yourRole || ''));
        }
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: branding.name,
          logoUrl: branding.logoUrl || null,
          primaryColor: branding.primaryColor,
          accentColor: branding.accentColor,
          portalSlug: branding.portalSlug || null,
          emailFooter: branding.emailFooter || null,
          brokeragePhone: branding.brokeragePhone || null,
          brokerageAddress: branding.brokerageAddress || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      toast.success('Branding saved — client portal and signing pages updated');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading branding...</div>;

  return (
    <div className="p-6 lg:p-8 space-y-6 text-foreground">
      <div className="border-b border-border/40 pb-4">
        <h1 className="text-2xl font-extrabold flex items-center gap-2"><Palette className="w-6 h-6 text-primary" /> Branding</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your brokerage identity, shown on the client portal, e-signing pages, and outbound emails.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Form */}
        <form onSubmit={save} className="xl:col-span-2 bg-card border border-border/60 rounded-2xl p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block uppercase mb-1">Brokerage Name</label>
              <input type="text" value={branding.name} disabled={!canManage}
                onChange={(e) => setBranding({ ...branding, name: e.target.value })}
                className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-sm disabled:opacity-60" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block uppercase mb-1">Portal Slug</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">/portal/</span>
                <input type="text" value={branding.portalSlug} disabled={!canManage} placeholder="excel-legacy"
                  onChange={(e) => setBranding({ ...branding, portalSlug: e.target.value.toLowerCase() })}
                  className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-sm disabled:opacity-60" />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Lowercase letters, numbers, hyphens. Unique across all workspaces.</p>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground block uppercase mb-1">Logo URL</label>
            <input type="url" value={branding.logoUrl || ''} disabled={!canManage} placeholder="https://yourbrokerage.com/logo.png"
              onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
              className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-sm disabled:opacity-60" />
            <p className="text-[10px] text-muted-foreground mt-1">Any hosted PNG/SVG. Rendered on the client portal and signing pages.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block uppercase mb-1">Primary Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={branding.primaryColor} disabled={!canManage}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-border/60 bg-background cursor-pointer disabled:opacity-60" />
                <input type="text" value={branding.primaryColor} disabled={!canManage}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-sm font-mono disabled:opacity-60" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block uppercase mb-1">Accent Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={branding.accentColor} disabled={!canManage}
                  onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-border/60 bg-background cursor-pointer disabled:opacity-60" />
                <input type="text" value={branding.accentColor} disabled={!canManage}
                  onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                  className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-sm font-mono disabled:opacity-60" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block uppercase mb-1">Phone</label>
              <input type="tel" value={branding.brokeragePhone || ''} disabled={!canManage} placeholder="(586) 555-0100"
                onChange={(e) => setBranding({ ...branding, brokeragePhone: e.target.value })}
                className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-sm disabled:opacity-60" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block uppercase mb-1">Address</label>
              <input type="text" value={branding.brokerageAddress || ''} disabled={!canManage}
                onChange={(e) => setBranding({ ...branding, brokerageAddress: e.target.value })}
                className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-sm disabled:opacity-60" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground block uppercase mb-1">Email Footer</label>
            <textarea value={branding.emailFooter || ''} disabled={!canManage} rows={3}
              placeholder={'Excel Legacy Realty\n123 Main St, Macomb MI\n(586) 555-0100'}
              onChange={(e) => setBranding({ ...branding, emailFooter: e.target.value })}
              className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-sm disabled:opacity-60" />
          </div>

          {canManage ? (
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-60">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Branding'}
              </button>
              <button type="button"
                onClick={() => setBranding({ ...DEFAULTS, name: branding.name, primaryColor: '#2563eb', accentColor: '#d4af37' })}
                className="px-4 py-2 border border-border text-sm font-bold rounded-lg flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4" /> Reset colors
              </button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">You need the Owner, Broker, or Admin role to change branding.</p>
          )}
        </form>

        {/* Live preview of a client-facing surface */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase">Client Portal Preview</h3>
          <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
            <div className="p-4 flex items-center gap-3 border-b border-black/10" style={{ backgroundColor: branding.primaryColor }}>
              {branding.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branding.logoUrl} alt="logo" className="w-9 h-9 rounded-lg object-contain bg-white/90" />
              ) : (
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black" style={{ backgroundColor: branding.accentColor, color: '#1a1a1a' }}>
                  {(branding.name || 'B').slice(0, 1)}
                </div>
              )}
              <div>
                <p className="text-sm font-extrabold text-white">{branding.name || 'Your Brokerage'}</p>
                <p className="text-[10px] text-white/80">Client Portal</p>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <div className="h-2.5 rounded-full bg-muted" />
              <div className="h-2.5 rounded-full bg-muted w-3/4" />
              <button type="button" className="w-full py-2 rounded-lg text-white text-xs font-bold mt-2" style={{ backgroundColor: branding.primaryColor }}>
                View Documents
              </button>
              <div className="p-2.5 rounded-lg border border-border/60 text-[10px] text-muted-foreground">
                {branding.brokerageAddress || 'Brokerage address'}{branding.brokeragePhone && <> · {branding.brokeragePhone}</>}
              </div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/70">
            The same branding renders on e-signing pages. Email footers append to every outbound message from campaigns and transactional mail.
          </p>
        </div>
      </div>
    </div>
  );
}
