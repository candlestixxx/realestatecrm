'use client';
// Contract management — generate, deploy, and track real-estate contracts.
// API: /api/contracts (POST with template.type, parties, action).

import { useState } from 'react';
import { FileSignature, Loader2, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const TEMPLATES = [
  { type: 'LEASE', label: 'Lease Agreement', description: 'Residential or commercial lease contract.' },
  { type: 'EARNEST_MONEY', label: 'Earnest Money', description: 'Earnest money deposit agreement.' },
  { type: 'PURCHASE_AGREEMENT', label: 'Purchase Agreement', description: 'Full property purchase contract.' },
];

export default function ContractsPage() {
  const [selected, setSelected] = useState('PURCHASE_AGREEMENT');
  const [parties, setParties] = useState([{ role: 'buyer', name: '', email: '' }, { role: 'seller', name: '', email: '' }]);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleGenerate(action: string) {
    setGenerating(true);
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: { type: selected }, parties, action }),
      });
      const data = await res.json();
      setResult(data.error || data.message || JSON.stringify(data).substring(0, 200));
    } finally { setGenerating(false); }
  }

  return (
    <TooltipProvider>
      <div className="p-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <FileSignature className="w-6 h-6 text-primary" /> Contracts
        </h1>
        <p className="text-muted-foreground mb-6 text-sm">Generate, deploy, and track real-estate contracts on-chain or via e-signature.</p>

        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          {TEMPLATES.map(t => (
            <button key={t.type} onClick={() => setSelected(t.type)}
              className={`rounded-lg border p-4 text-left transition-colors ${selected === t.type ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{t.label}</span>
                <Tooltip><TooltipTrigger><Info className="w-3.5 h-3.5 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent><p className="max-w-xs">{t.description}</p></TooltipContent></Tooltip>
              </div>
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </button>
          ))}
        </div>

        <div className="rounded-lg border p-4 mb-4">
          <h2 className="font-semibold mb-3">Parties</h2>
          {parties.map((p, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 mb-2">
              <input placeholder="Role" value={p.role} onChange={e => { const np = [...parties]; np[i].role = e.target.value; setParties(np); }} className="rounded-md border px-3 py-2 text-sm" />
              <input placeholder="Name *" required value={p.name} onChange={e => { const np = [...parties]; np[i].name = e.target.value; setParties(np); }} className="rounded-md border px-3 py-2 text-sm" />
              <input placeholder="Email" type="email" value={p.email} onChange={e => { const np = [...parties]; np[i].email = e.target.value; setParties(np); }} className="rounded-md border px-3 py-2 text-sm" />
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          {['deploy', 'execute', 'dispute'].map(action => (
            <button key={action} onClick={() => handleGenerate(action)} disabled={generating}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 capitalize">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : action}
            </button>
          ))}
        </div>
        {result && <p className="mt-4 text-sm text-muted-foreground">{result}</p>}
      </div>
    </TooltipProvider>
  );
}
