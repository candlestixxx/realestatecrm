'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FileSignature, Plus, Send, Trash2, XCircle, Copy, CheckCircle2, Clock, PenLine } from 'lucide-react';

/**
 * Contracts & E-Signatures
 *
 * Replaces the previous "blockchain smart contracts" page that fabricated
 * txHash/blockNumber with Math.random() and claimed documents were deployed
 * on-chain. This is a real signing workflow: draft -> send -> parties sign via
 * secure links -> completed, with an attribution audit trail (IP, timestamp,
 * typed signature) and a SHA-256 document integrity anchor.
 */

interface SignatureRow {
  id: string;
  partyName: string;
  partyEmail: string;
  role: string;
  status: string;
  signatureText?: string | null;
  ipAddress?: string | null;
  signedAt?: string | null;
  inviteToken: string;
}

interface ContractRow {
  id: string;
  title: string;
  contractType: string;
  status: string;
  terms?: string | null;
  documentHash?: string | null;
  sentAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  signatures: SignatureRow[];
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground border-border',
  SENT: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PARTIALLY_SIGNED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  VOID: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    contractType: 'PURCHASE_AGREEMENT',
    terms: '',
    parties: [{ name: '', email: '', role: 'BUYER' }] as Array<{ name: string; email: string; role: string }>,
  });

  const load = async () => {
    try {
      const res = await fetch('/api/esign');
      const data = await res.json();
      setContracts(res.ok ? data.contracts || [] : []);
    } catch {
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createContract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/esign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          contractType: form.contractType,
          terms: form.terms ? JSON.parse(form.terms) : undefined,
          parties: form.parties.filter(p => p.name && p.email),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create contract');
      toast.success('Contract created (draft)');
      setShowCreate(false);
      setForm({ title: '', contractType: 'PURCHASE_AGREEMENT', terms: '', parties: [{ name: '', email: '', role: 'BUYER' }] });
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const act = async (id: string, action: 'send' | 'void') => {
    try {
      const res = await fetch('/api/esign', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      toast.success(action === 'send' ? 'Contract sent to all parties' : 'Contract voided');
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this draft contract?')) return;
    try {
      const res = await fetch('/api/esign?id=' + encodeURIComponent(id), { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Delete failed');
      toast.success('Contract deleted');
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(window.location.origin + '/sign/' + token);
    toast.success('Signing link copied — send it to the party securely');
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 text-foreground">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <FileSignature className="w-6 h-6 text-primary" /> Contracts &amp; E-Signatures
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Draft agreements, send signing links, and track signatures with a full attribution audit trail.
          </p>
        </div>
        <button type="button" onClick={() => setShowCreate(v => !v)}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg flex items-center gap-1.5 hover:opacity-90">
          <Plus className="w-4 h-4" /> New Contract
        </button>
      </div>

      {showCreate && (
        <form onSubmit={createContract} className="p-5 bg-muted/30 border border-border/60 rounded-2xl space-y-4 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block uppercase mb-1">Title *</label>
              <input type="text" required value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-sm" placeholder="123 Main St — Purchase Agreement" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block uppercase mb-1">Type</label>
              <select value={form.contractType} onChange={(e) => setForm({ ...form, contractType: e.target.value })}
                className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-sm">
                <option value="PURCHASE_AGREEMENT">Purchase Agreement</option>
                <option value="LISTING_AGREEMENT">Listing Agreement</option>
                <option value="LEASE">Lease</option>
                <option value="EARNEST_MONEY">Earnest Money</option>
                <option value="ADDENDUM">Addendum</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground block uppercase mb-1">Terms (JSON, optional)</label>
            <textarea value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })}
              rows={3} placeholder='{"property": "123 Main St", "price": 350000, "closingDate": "2026-03-01"}'
              className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-xs font-mono" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground block uppercase mb-1">Signing Parties *</label>
            <div className="space-y-2">
              {form.parties.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" required placeholder="Full name" value={p.name}
                    onChange={(e) => { const next = [...form.parties]; next[i] = { ...p, name: e.target.value }; setForm({ ...form, parties: next }); }}
                    className="flex-1 bg-background border border-border/60 rounded-lg px-3 py-1.5 text-xs" />
                  <input type="email" required placeholder="Email" value={p.email}
                    onChange={(e) => { const next = [...form.parties]; next[i] = { ...p, email: e.target.value }; setForm({ ...form, parties: next }); }}
                    className="flex-1 bg-background border border-border/60 rounded-lg px-3 py-1.5 text-xs" />
                  <select value={p.role}
                    onChange={(e) => { const next = [...form.parties]; next[i] = { ...p, role: e.target.value }; setForm({ ...form, parties: next }); }}
                    className="bg-background border border-border/60 rounded-lg px-2 py-1.5 text-xs">
                    <option value="BUYER">Buyer</option><option value="SELLER">Seller</option>
                    <option value="AGENT">Agent</option><option value="CO_AGENT">Co-Agent</option><option value="WITNESS">Witness</option>
                  </select>
                  {form.parties.length > 1 && (
                    <button type="button" onClick={() => setForm({ ...form, parties: form.parties.filter((_, j) => j !== i) })}
                      className="text-muted-foreground hover:text-red-500 px-2"><XCircle className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setForm({ ...form, parties: [...form.parties, { name: '', email: '', role: 'BUYER' }] })}
              className="mt-2 text-xs text-primary font-bold hover:underline">+ Add party</button>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg">Create Draft</button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border border-border text-sm font-bold rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading contracts...</p>
      ) : contracts.length === 0 ? (
        <div className="p-10 text-center border border-dashed border-border/60 rounded-2xl">
          <p className="text-muted-foreground text-sm">No contracts yet.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Create a contract, then send signing links to each party.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => (
            <div key={c.id} className="bg-card border border-border/60 rounded-2xl overflow-hidden">
              <div className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={'text-[9px] px-1.5 py-0.5 rounded font-black uppercase border ' + (STATUS_STYLES[c.status] || STATUS_STYLES.DRAFT)}>{c.status.replace('_', ' ')}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase border border-border text-muted-foreground">{c.contractType.replace(/_/g, ' ')}</span>
                  </div>
                  <h3 className="font-bold text-sm text-foreground truncate mt-1.5">{c.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {c.signatures.filter(s => s.status === 'SIGNED').length}/{c.signatures.length} signed
                    {c.completedAt && <> · completed {new Date(c.completedAt).toLocaleDateString()}</>}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                    className="px-3 py-1.5 text-xs font-bold border border-border rounded-lg hover:bg-muted">Details</button>
                  {c.status === 'DRAFT' && (
                    <>
                      <button type="button" onClick={() => act(c.id, 'send')} title="Send to parties"
                        className="px-3 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-lg flex items-center gap-1"><Send className="w-3.5 h-3.5" /> Send</button>
                      <button type="button" onClick={() => remove(c.id)} title="Delete draft"
                        className="p-1.5 text-muted-foreground hover:text-red-500 border border-border rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                    </>
                  )}
                  {(c.status === 'SENT' || c.status === 'PARTIALLY_SIGNED') && (
                    <button type="button" onClick={() => act(c.id, 'void')} title="Void contract"
                      className="px-3 py-1.5 text-xs font-bold border border-red-500/30 text-red-400 rounded-lg">Void</button>
                  )}
                </div>
              </div>

              {expanded === c.id && (
                <div className="border-t border-border/40 p-4 space-y-4 bg-muted/10">
                  {c.terms && (
                    <div>
                      <h4 className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Terms</h4>
                      <pre className="text-xs font-mono bg-background border border-border/40 rounded-lg p-3 overflow-x-auto">{JSON.stringify(JSON.parse(c.terms), null, 2)}</pre>
                    </div>
                  )}
                  <div>
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Signing Parties &amp; Audit Trail</h4>
                    <div className="space-y-2">
                      {c.signatures.map((s) => (
                        <div key={s.id} className="flex items-center justify-between gap-3 p-2.5 bg-background border border-border/40 rounded-lg">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground">{s.partyName} <span className="text-muted-foreground font-normal">({s.role})</span></p>
                            <p className="text-[10px] text-muted-foreground truncate">{s.partyEmail}</p>
                            {s.status === 'SIGNED' && (
                              <p className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Signed {s.signedAt ? new Date(s.signedAt).toLocaleString() : ''}
                                {s.ipAddress && s.ipAddress !== 'unknown' && <> · IP {s.ipAddress}</>}
                              </p>
                            )}
                            {s.status === 'PENDING' && <p className="text-[10px] text-amber-400 mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" /> Awaiting signature</p>}
                            {s.status === 'DECLINED' && <p className="text-[10px] text-red-400 mt-0.5">Declined</p>}
                            {s.signatureText && <p className="text-[10px] text-muted-foreground mt-0.5 font-mono flex items-center gap-1"><PenLine className="w-3 h-3" /> {s.signatureText}</p>}
                          </div>
                          {s.status === 'PENDING' && (c.status === 'SENT' || c.status === 'PARTIALLY_SIGNED') && (
                            <button type="button" onClick={() => copyLink(s.inviteToken)}
                              className="text-xs font-bold text-primary flex items-center gap-1 hover:underline shrink-0">
                              <Copy className="w-3.5 h-3.5" /> Copy signing link
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  {c.documentHash && (
                    <p className="text-[10px] text-muted-foreground/70 font-mono break-all">Integrity anchor (SHA-256 at send): {c.documentHash}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
