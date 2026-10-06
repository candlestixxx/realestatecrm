'use client';
// Document vault — secure storage for contracts, disclosures, and client docs.
// API: /api/vault (GET list, POST create). Presigned S3 uploads.

import { useState, useEffect } from 'react';
import { Lock, Plus, FileText, Download, Trash2, Search, Loader2 } from 'lucide-react';

interface VaultDoc {
  id: string;
  title: string;
  content: string | null;
  createdAt: string;
}

export default function VaultPage() {
  const [docs, setDocs] = useState<VaultDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch('/api/vault').then(r => r.json()).then(d => {
      setDocs(Array.isArray(d) ? d : d.entries || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const doc = await res.json();
        setDocs([doc, ...docs]);
        setForm({ title: '', content: '' });
        setShowCreate(false);
      }
    } finally { setCreating(false); }
  }

  const filtered = docs.filter(d => d.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center mb-4"><h1 className="text-xl font-semibold">Document Vault</h1> <span title="Secure document storage and sharing. Upload contracts, disclosures, inspection reports, and other transaction documents." aria-label="About this section: Secure document storage and sharing. Upload contracts, disclosures, inspection reports, and other transaction documents." className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-[9px] text-gray-500 cursor-help ml-2 align-middle">?</span></div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Lock className="w-6 h-6 text-primary" /> Document Vault
        </h1>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90">
          <Plus className="w-4 h-4" /> New Document
        </button>
      </div>
      <p className="text-muted-foreground mb-4 text-sm">Secure storage for contracts, disclosures, and client documents.</p>

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-4 rounded-lg border p-4 space-y-3">
          <input placeholder="Document title *" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full rounded-md border px-3 py-2 text-sm" />
          <textarea placeholder="Content..." value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full rounded-md border px-3 py-2 text-sm h-24" />
          <div className="flex gap-2">
            <button type="submit" disabled={creating} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50">{creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}</button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-md text-sm border hover:bg-muted">Cancel</button>
          </div>
        </form>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-md border text-sm" />
      </div>

      {loading && <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>}
      {!loading && filtered.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No documents found.</p>}

      <div className="divide-y rounded-lg border">
        {filtered.map(d => (
          <div key={d.id} className="flex items-center gap-3 p-4 hover:bg-muted/50">
            <FileText className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{d.title}</p>
              <p className="text-xs text-muted-foreground">Created {new Date(d.createdAt).toLocaleDateString()}</p>
            </div>
            <button className="p-1.5 hover:bg-muted rounded" title="Download"><Download className="w-4 h-4" /></button>
            <button className="p-1.5 hover:bg-destructive/10 rounded text-destructive" title="Delete"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
