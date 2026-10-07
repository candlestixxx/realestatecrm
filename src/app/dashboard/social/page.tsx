'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface SocialAccount {
  id: string;
  platform: string;
  accountName: string;
  isActive: boolean;
  lastSyncAt: string | null;
  createdAt: string;
}

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: '📘', color: 'bg-blue-600' },
  { id: 'instagram', name: 'Instagram', icon: '📸', color: 'bg-pink-500' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'bg-indigo-600' },
  { id: 'twitter', name: 'X (Twitter)', icon: '🐦', color: 'bg-black' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'bg-gray-900' },
  { id: 'gmb', name: 'Google Business', icon: '📍', color: 'bg-green-600' },
];

export default function SocialConnectionsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/social');
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch {
      toast.error('Failed to load social accounts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const connectPlatform = async (platform: string) => {
    setConnecting(platform);
    try {
      // OAuth flow not yet configured for external providers — create a local connection record.
      // When OAuth credentials are added to env vars, replace this with a redirect to the provider.
      const res = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          accountName: `@${platform}_account`,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(`Connected to ${platform} (simulated — OAuth pending).`);
      loadAccounts();
    } catch {
      toast.error(`Failed to connect ${platform}`);
    } finally {
      setConnecting(null);
    }
  };

  const disconnect = async (id: string) => {
    if (!confirm('Disconnect this account?')) return;
    try {
      await fetch(`/api/social?id=${id}`, { method: 'DELETE' });
      toast.success('Account disconnected');
      loadAccounts();
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  const getPlatformInfo = (platform: string) =>
    PLATFORMS.find(p => p.id === platform) || { id: platform, name: platform, icon: '🔗', color: 'bg-gray-500' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Social Connections <span title="Connect social media accounts for automated content publishing. Manage Facebook, Instagram, LinkedIn, and Twitter/X." aria-label="About this section: Connect social media accounts for automated content publishing. Manage Facebook, Instagram, LinkedIn, and Twitter/X." className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-[9px] text-gray-500 cursor-help ml-2 align-middle">?</span></h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your social media accounts for unified publishing and inbox management.
        </p>
      </div>

      {/* Connected Accounts */}
      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Connected Accounts</h2>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 border border-border rounded-xl">
            <div className="text-3xl mb-2">🔗</div>
            <p className="text-sm text-muted-foreground">No accounts connected yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map(account => {
              const info = getPlatformInfo(account.platform);
              return (
                <div key={account.id} className="bg-background border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${info.color} flex items-center justify-center text-xl text-white`}>
                        {info.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{info.name}</h3>
                        <p className="text-xs text-muted-foreground">{account.accountName}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] px-2 py-1 rounded-full font-bold uppercase ${account.isActive ? 'bg-green-500/15 text-green-500' : 'bg-gray-500/15 text-gray-500'}`}>
                      {account.isActive ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {account.lastSyncAt ? `Synced ${new Date(account.lastSyncAt).toLocaleDateString()}` : 'Never synced'}
                    </span>
                    <button onClick={() => disconnect(account.id)}
                      className="text-xs text-red-500 hover:underline">
                      Disconnect
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Platforms */}
      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Add Connection</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {PLATFORMS.map(platform => {
            const isConnected = accounts.some(a => a.platform === platform.id && a.isActive);
            return (
              <button
                key={platform.id}
                onClick={() => !isConnected && connectPlatform(platform.id)}
                disabled={isConnected || connecting === platform.id}
                className={`flex flex-col items-center gap-2 p-4 border rounded-xl transition-all ${
                  isConnected
                    ? 'border-green-500/30 bg-green-500/5 opacity-60 cursor-default'
                    : 'border-border hover:border-secondary hover:bg-muted/30 cursor-pointer'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl ${platform.color} flex items-center justify-center text-2xl text-white`}>
                  {platform.icon}
                </div>
                <span className="text-xs font-bold text-foreground">{platform.name}</span>
                <span className={`text-[9px] font-bold uppercase ${isConnected ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {isConnected ? '✓ Connected' : connecting === platform.id ? 'Connecting...' : 'Connect'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
