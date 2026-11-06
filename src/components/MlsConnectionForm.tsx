'use client';

import React, { useCallback, useEffect, useState } from 'react';

interface Conn {
  id: string; mlsName: string; endpointUrl: string | null; authType: string;
  clientId: string | null; memberMlsId: string | null; organizationId: string | null;
  isActive: boolean; hasToken: boolean; lastSyncAt: string | null;
  lastSyncStatus: string | null; lastError: string | null;
}

export default function MlsConnectionForm() {
  const [conns, setConns] = useState<Conn[]>([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    mlsName: 'MIREALSOURCE', authType: 'SERVER_TOKEN', endpointUrl: '',
    token: '', clientId: '', clientSecret: '', memberMlsId: '', organizationId: '',
  });

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/mls/connections');
      const d = await r.json();
      setConns(d.connections || []);
    } catch { setConns([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setBusy(true); setMsg('');
    try {
      const r = await fetch('/api/mls/connections', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      setMsg(r.ok ? 'MLS connection saved (secret encrypted, never shown again).' : (d.error || 'Save failed'));
      if (r.ok) { setForm(f => ({ ...f, token: '', clientSecret: '' })); load(); }
    } catch { setMsg('Save failed'); }
    setBusy(false);
  };

  const act = async (action: 'test' | 'sync', connectionId?: string) => {
    setBusy(true); setMsg('');
    try {
      const url = action === 'sync' ? '/api/mls/sync' : '/api/mls/connections';
      const method = action === 'sync' ? 'POST' : 'PATCH';
      const body = action === 'sync' ? { connectionId } : { action: 'test', connectionId };
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json();
      setMsg(r.ok ? (action === 'sync' ? `Sync done: ${d.upserted}/${d.fetched} listings upserted.` : 'Connection test passed.') : (d.error || 'Failed'));
      load();
    } catch { setMsg('Request failed'); }
    setBusy(false);
  };

  const brokerSync = async () => {
    setBusy(true); setMsg('');
    try {
      const r = await fetch('/api/mls/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const d = await r.json();
      setMsg(r.ok ? `Broker feed sync: ${d.upserted}/${d.fetched} upserted, ${d.assigned} auto-assigned to agents.` : (d.error || 'Broker sync failed'));
    } catch { setMsg('Broker sync failed'); }
    setBusy(false);
  };

  const del = async (id: string) => {
    setBusy(true);
    await fetch(`/api/mls/connections?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    setBusy(false); load();
  };

  const input = 'w-full border rounded px-3 py-2 text-sm bg-background';
  return (
    <div className="bg-card rounded-lg border p-5 mt-6">
      <h2 className="text-lg font-semibold text-foreground">Connect MLS (per agent)</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Use a RESO Web API server token or OAuth client issued by your MLS/vendor, or register with
        Member ID only to receive listings from the brokerage feed. MLS browser passwords are never
        asked for or stored. Secrets are encrypted and never displayed again.
      </p>

      {conns.length > 0 && (
        <div className="mt-4 space-y-2">
          {conns.map(c => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 border rounded p-3 text-sm">
              <span className="font-medium">{c.mlsName}</span>
              <span className="text-muted-foreground">{c.authType}</span>
              {c.memberMlsId && <span className="text-muted-foreground">Member ID: {c.memberMlsId}</span>}
              <span className="text-muted-foreground">{c.hasToken ? 'token saved' : 'no token'}</span>
              {c.lastSyncStatus && <span className="text-muted-foreground">last sync: {c.lastSyncStatus}</span>}
              <span className="flex gap-2 ml-auto">
                <button type="button" disabled={busy} onClick={() => act('test', c.id)} className="px-3 py-1 border rounded hover:bg-muted/40">Test</button>
                <button type="button" disabled={busy} onClick={() => act('sync', c.id)} className="px-3 py-1 border rounded hover:bg-muted/40">Sync mine</button>
                <button type="button" disabled={busy} onClick={() => del(c.id)} className="px-3 py-1 border rounded hover:bg-muted/40">Disconnect</button>
              </span>
              {c.lastError && <div className="w-full text-xs text-red-600">{c.lastError}</div>}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        <label className="text-sm">MLS
          <select value={form.mlsName} onChange={e => setForm(f => ({ ...f, mlsName: e.target.value }))} className={input}>
            <option value="MIREALSOURCE">MiRealSource</option>
            <option value="REALCOMP">Realcomp</option>
            <option value="OTHER">Other RESO MLS</option>
          </select>
        </label>
        <label className="text-sm">Credential type
          <select value={form.authType} onChange={e => setForm(f => ({ ...f, authType: e.target.value }))} className={input}>
            <option value="SERVER_TOKEN">RESO server token</option>
            <option value="OAUTH_CLIENT">OAuth client ID + secret</option>
            <option value="MEMBER_ID_ONLY">Member ID only (brokerage feed)</option>
          </select>
        </label>
        <label className="text-sm md:col-span-2">RESO Web API base URL
          <input value={form.endpointUrl} onChange={e => setForm(f => ({ ...f, endpointUrl: e.target.value }))} placeholder="https://api.example-mls.com/reso/odata" className={input} />
        </label>
        {form.authType === 'SERVER_TOKEN' && (
          <label className="text-sm md:col-span-2">Server token
            <input type="password" autoComplete="off" value={form.token} onChange={e => setForm(f => ({ ...f, token: e.target.value }))} className={input} />
          </label>
        )}
        {form.authType === 'OAUTH_CLIENT' && (
          <>
            <label className="text-sm">Client ID
              <input value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} className={input} />
            </label>
            <label className="text-sm">Client secret
              <input type="password" autoComplete="off" value={form.clientSecret} onChange={e => setForm(f => ({ ...f, clientSecret: e.target.value }))} className={input} />
            </label>
          </>
        )}
        <label className="text-sm">Your MLS Member ID (List Agent Key)
          <input value={form.memberMlsId} onChange={e => setForm(f => ({ ...f, memberMlsId: e.target.value }))} placeholder="e.g. 123456" className={input} />
        </label>
        <label className="text-sm">MLS Organization ID (OUID, optional)
          <input value={form.organizationId} onChange={e => setForm(f => ({ ...f, organizationId: e.target.value }))} className={input} />
        </label>
      </div>

      <div className="flex flex-wrap gap-3 mt-4">
        <button type="button" disabled={busy} onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Save connection</button>
        <button type="button" disabled={busy} onClick={brokerSync} className="px-4 py-2 border rounded-lg hover:bg-muted/40 disabled:opacity-50">Sync brokerage feed</button>
      </div>
      {msg && <p className="text-sm mt-3 text-foreground">{msg}</p>}
    </div>
  );
}
