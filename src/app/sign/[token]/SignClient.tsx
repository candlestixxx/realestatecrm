'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FileSignature, CheckCircle2, Clock, PenLine, ShieldCheck, XCircle } from 'lucide-react';

/**
 * Public signing view — parties sign via their invite token (no login).
 * Records typed signature + explicit consent + IP/user-agent attribution,
 * exactly like the ESIGN Act basics require: intent, consent, attribution,
 * and a retained record of what was signed.
 */

interface PartyView { name: string; role: string; status: string; signedAt?: string | null; isYou: boolean }
interface ContractView {
  id: string; title: string; contractType: string; status: string;
  terms: any; sentAt: string | null; parties: PartyView[];
}
interface YourParty { name: string; email: string; role: string; status: string }

export default function SignClient({ token }: { token: string }) {
  const [contract, setContract] = useState<ContractView | null>(null);
  const [yourParty, setYourParty] = useState<YourParty | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [signatureText, setSignatureText] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/esign/sign/' + encodeURIComponent(token));
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load');
        setContract(data.contract);
        setYourParty(data.yourParty);
        if (data.yourParty?.name) setSignatureText(data.yourParty.name);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const submit = async (action: 'sign' | 'decline') => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/esign/sign/' + encodeURIComponent(token), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureText, consent, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success(action === 'sign' ? 'Signature recorded' : 'Contract declined');
      // Reload state.
      const refresh = await fetch('/api/esign/sign/' + encodeURIComponent(token));
      const rd = await refresh.json();
      if (refresh.ok) { setContract(rd.contract); setYourParty(rd.yourParty); }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading document...</div>;
  if (error || !contract || !yourParty) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card border border-border/60 rounded-2xl p-8 text-center">
          <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-foreground">Signing link unavailable</h1>
          <p className="text-sm text-muted-foreground mt-2">{error || 'This link is invalid or has expired.'}</p>
        </div>
      </div>
    );
  }

  const alreadyDone = yourParty.status !== 'PENDING';
  const contractLocked = contract.status === 'VOID' || contract.status === 'COMPLETED';

  return (
    <div className="min-h-screen bg-muted/20 p-6 lg:p-10">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="text-center">
          <FileSignature className="w-10 h-10 text-primary mx-auto" />
          <h1 className="text-xl font-extrabold text-foreground mt-2">{contract.title}</h1>
          <p className="text-sm text-muted-foreground">{contract.contractType.replace(/_/g, ' ')} · Sent for electronic signature</p>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-5">
          {contract.terms && (
            <div>
              <h2 className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Document Terms</h2>
              <pre className="text-xs font-mono bg-muted/30 border border-border/40 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(contract.terms, null, 2)}
              </pre>
            </div>
          )}

          <div>
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Parties</h2>
            <div className="space-y-1.5">
              {contract.parties.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded-lg">
                  <span className="text-foreground font-medium">{p.name} <span className="text-muted-foreground">({p.role}){p.isYou && ' — you'}</span></span>
                  <span className={p.status === 'SIGNED' ? 'text-emerald-400 flex items-center gap-1' : p.status === 'DECLINED' ? 'text-red-400' : 'text-amber-400 flex items-center gap-1'}>
                    {p.status === 'SIGNED' ? <><CheckCircle2 className="w-3.5 h-3.5" /> Signed{p.signedAt ? ' ' + new Date(p.signedAt).toLocaleDateString() : ''}</> :
                      p.status === 'DECLINED' ? 'Declined' : <><Clock className="w-3.5 h-3.5" /> Pending</>}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {alreadyDone ? (
            <div className={'p-4 rounded-xl border text-sm text-center ' + (yourParty.status === 'SIGNED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400')}>
              {yourParty.status === 'SIGNED' ? 'You have already signed this document. A signed copy has been recorded.' : 'You declined this document.'}
            </div>
          ) : contractLocked ? (
            <div className="p-4 rounded-xl border bg-muted/30 border-border/40 text-sm text-center text-muted-foreground">
              This contract is {contract.status === 'VOID' ? 'voided' : 'complete'} and no longer accepting signatures.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground block uppercase mb-1">
                  <PenLine className="w-3 h-3 inline mr-1" /> Type your full legal name as your signature
                </label>
                <input type="text" value={signatureText} onChange={(e) => setSignatureText(e.target.value)}
                  className="w-full bg-background border border-border/60 rounded-lg px-4 py-3 text-lg font-serif italic text-foreground"
                  placeholder={yourParty.name} />
                <p className="text-[10px] text-muted-foreground mt-1">Signing as: {yourParty.name} ({yourParty.email})</p>
              </div>

              <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
                <span>
                  <strong className="text-foreground">Electronic signature consent.</strong> I agree that my typed name above constitutes my
                  electronic signature on this document, that it has the same legal effect as a handwritten signature, and that I consent to
                  conduct this transaction electronically. My signature, IP address, and timestamp will be recorded.
                </span>
              </label>

              <div className="flex gap-2">
                <button type="button" onClick={() => submit('sign')} disabled={submitting || !consent || signatureText.trim().length < 3}
                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Sign Document
                </button>
                <button type="button" onClick={() => { if (window.confirm('Decline this contract? This voids the agreement.')) submit('decline'); }}
                  disabled={submitting}
                  className="px-4 py-3 border border-red-500/30 text-red-400 font-bold rounded-lg disabled:opacity-50">
                  Decline
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground/70 text-center max-w-md mx-auto">
          Your signature is recorded with a timestamp and network address for attribution. The document content is fingerprinted
          (SHA-256) when sent; any alteration after sending blocks signing. Retain a copy for your records.
        </p>
      </div>
    </div>
  );
}
