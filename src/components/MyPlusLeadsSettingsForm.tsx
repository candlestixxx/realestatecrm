'use client';

import { useState } from 'react';
import { saveMyPlusLeadsCredentialsAction, manualSyncMyPlusLeadsAction } from '@/lib/actions/integrations';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface Props {
  initialData: {
    email?: string;
    password?: string;
    isActive?: boolean;
    lastSyncAt?: Date | null;
  } | null;
  workspaceId: string;
}

export function MyPlusLeadsSettingsForm({ initialData, workspaceId }: Props) {
  const [email, setEmail] = useState(initialData?.email || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  async function handleSave() {
    if (!email || !password) {
      toast.error('Email and password are required.');
      return;
    }
    setIsSaving(true);
    try {
      await saveMyPlusLeadsCredentialsAction({ email, passwordRaw: password, isActive, workspaceId });
      toast.success('MyPlusLeads credentials saved!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save credentials.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSync() {
    setIsSyncing(true);
    const loadingToast = toast.loading('Syncing leads from MyPlusLeads...');
    try {
      const res = await manualSyncMyPlusLeadsAction();
      toast.dismiss(loadingToast);
      const count = res?.results?.[0]?.processedCount ?? 0;
      toast.success(`Sync complete! ${count} new lead(s) imported.`);
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.message || 'Sync failed. Check your credentials.');
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="bg-background border border-border rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <h3 className="font-extrabold text-base flex items-center gap-2">
          ⚡ MyPlusLeads.com Direct API
        </h3>
        <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
          Live Integration
        </span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Enter your MyPlusLeads login credentials. Your account territories and zip codes will be automatically respected.
        New Expired, Canceled, and FSBO leads will be imported every morning and auto-tagged.
      </p>

      {/* Active Toggle */}
      <label className="flex items-center justify-between cursor-pointer select-none">
        <div>
          <p className="text-sm font-semibold text-foreground">Enable Daily Auto-Sync</p>
          <p className="text-xs text-muted-foreground">Pull new listings automatically between 4–7 AM.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsActive(!isActive)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            isActive ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              isActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </label>

      {/* Email */}
      <div className="space-y-1">
        <label className="font-bold text-muted-foreground uppercase text-[10px]">MyPlusLeads Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Password */}
      <div className="space-y-1">
        <label className="font-bold text-muted-foreground uppercase text-[10px]">MyPlusLeads Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <p className="text-[10px] text-muted-foreground">
          Password is encrypted with SHA-1 as required by the MyPlusLeads API — never stored in plain text after sending.
        </p>
      </div>

      {/* Last sync */}
      {initialData?.lastSyncAt && (
        <p className="text-xs text-muted-foreground">
          ✅ Last successful sync: <strong>{new Date(initialData.lastSyncAt).toLocaleString()}</strong>
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border/60">
        <button
          type="button"
          onClick={handleSync}
          disabled={isSyncing || !email || !password}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-xs font-bold hover:bg-muted/30 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSyncing && <Loader2 className="h-3 w-3 animate-spin" />}
          Sync Now
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
          Save Configuration
        </button>
      </div>
    </div>
  );
}
