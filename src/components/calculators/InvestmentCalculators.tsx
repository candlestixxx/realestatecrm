'use client';
// Buyer + seller investment calculator for client presentations.
// Why: agents need one screen that answers "is this a good investment?"
// for both sides. Buyer tab covers homebuyer affordability + investor
// DSCR/cap-rate/cash-on-cash. Seller tab covers net proceeds + ROI.
// Embeddable: also rendered by tenant sites via CALCULATOR block.

import { useMemo, useState } from 'react';
import { analyzeBuyer, analyzeSeller, fmtUSD, fmtPct, buyerPriceForDSCR, buyerPriceForCashOnCash, buyerPriceForAffordability, buyerPriceForPayment, sellerPriceForNet, priceGame, estimatedAnnualTax, taxRatePctFromRecord, integrityPrice, fiveYearPath } from '@/lib/calculators';
import { useEffect, useRef } from 'react';
import { Home, Calculator as CalcIcon, Landmark, KeyRound, Target, ImagePlus, Search, Check, Loader2 } from 'lucide-react';

type Mode = 'buyer' | 'seller';

const VERDICT_STYLE: Record<string, string> = {
  strong: 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300',
  good: 'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  fair: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  risky: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
};

function NumField(props: { label: string; value: number; onChange: (v: number) => void; prefix?: string; suffix?: string; step?: number; hint?: string }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{props.label}</span>
      <div className="flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 focus-within:border-primary">
        {props.prefix ? <span className="text-xs text-muted-foreground">{props.prefix}</span> : null}
        <input
          type="number"
          value={Number.isFinite(props.value) ? props.value : 0}
          step={props.step ?? 100}
          onChange={(e) => props.onChange(Number(e.target.value))}
          className="w-full bg-transparent text-sm font-semibold outline-none"
        />
        {props.suffix ? <span className="text-xs text-muted-foreground">{props.suffix}</span> : null}
      </div>
      {props.hint ? <span className="block text-[11px] text-muted-foreground">{props.hint}</span> : null}
    </label>
  );
}

function Stat(props: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{props.label}</div>
      <div className="text-lg font-extrabold">{props.value}</div>
      {props.sub ? <div className="text-[11px] text-muted-foreground">{props.sub}</div> : null}
    </div>
  );
}

export default function InvestmentCalculators(props: { defaultMode?: Mode; compact?: boolean }) {
  const [mode, setMode] = useState<Mode>(props.defaultMode ?? 'buyer');

  // Buyer state — Arizona-friendly defaults
  const [price, setPrice] = useState(450000);
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(6.5);
  const [term, setTerm] = useState(30);
  const [taxRate, setTaxRate] = useState(0.52);
  const [insurance, setInsurance] = useState(1800);
  const [hoa, setHoa] = useState(0);
  const [closePct, setClosePct] = useState(3);
  const [rent, setRent] = useState(2800);
  const [income, setIncome] = useState(10000);
  const [appr, setAppr] = useState(3);
  const [hold, setHold] = useState(5);
  const [maint, setMaint] = useState(1);

  // HIGHER-or-LOWER game state: agent picks the win condition, calculator
  // solves for THE number, both sides watch the gap close in real time.
  const [winBy, setWinBy] = useState<'dscr' | 'coc' | 'afford' | 'payment'>('dscr');
  const [winDSCR, setWinDSCR] = useState(1.25);
  const [winCoC, setWinCoC] = useState(8);
  const [winAff, setWinAff] = useState(28);
  const [winPay, setWinPay] = useState(2800);
  const [targetNet, setTargetNet] = useState(150000);

  // ONE HOUSE, MANY LAYERS: left-rail layers over a single property. Photo +
  // address live on this device (localStorage) for the live appointment and
  // can also be saved onto the matching CRM listing. Public records come
  // from /api/property-data (BS&A first, Realcomp fallback) - never faked:
  // unconfigured providers show an honest "not configured" state.
  type Layer = 'house' | 'numbers' | 'records' | 'mls' | 'number';
  const [layer, setLayer] = useState<Layer>('house');
  const [photo, setPhoto] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [parcel, setParcel] = useState('');
  const [county, setCounty] = useState('macomb');
  const [rec, setRec] = useState<any>(null);
  const [recSource, setRecSource] = useState('');
  const [recMsg, setRecMsg] = useState('');
  const [recBusy, setRecBusy] = useState(false);
  const [mls, setMls] = useState<any[]>([]);
  const [mlsMsg, setMlsMsg] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('elrg-house-v1');
      if (raw) { const h = JSON.parse(raw); if (h.photo) setPhoto(h.photo); if (h.address) setAddress(h.address); if (h.parcel) setParcel(h.parcel); if (h.county) setCounty(h.county); }
    } catch { /* device storage unavailable */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem('elrg-house-v1', JSON.stringify({ photo, address, parcel, county })); } catch { /* photo too large for storage - still shown this session */ }
  }, [photo, address, parcel, county]);

  function onPhotoFile(f: File | undefined) {
    if (!f) return;
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.width * scale); cv.height = Math.round(img.height * scale);
      cv.getContext('2d')?.drawImage(img, 0, 0, cv.width, cv.height);
      setPhoto(cv.toDataURL('image/jpeg', 0.82));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(f);
  }

  async function pullRecords() {
    setRecBusy(true); setRecMsg('');
    try {
      const q = new URLSearchParams({ county, ...(parcel ? { parcel } : { address }) });
      const r = await fetch('/api/property-data?' + q.toString());
      const j = await r.json();
      if (j.success && j.data) { setRec(j.data); setRecSource(j.source || ''); setRecMsg(''); }
      else { setRec(null); setRecMsg(j.error || 'No record returned.'); }
    } catch { setRecMsg('Lookup failed - check connection and try again.'); }
    setRecBusy(false);
  }

  async function pullMls() {
    setMlsMsg('');
    try {
      const r = await fetch('/api/listings');
      const j = await r.json();
      const list = Array.isArray(j) ? j : [];
      const needle = address.trim().toLowerCase();
      setMls(needle ? list.filter((l: any) => String(l.address || '').toLowerCase().includes(needle.split(' ')[0])) : list.slice(0, 6));
      if (!list.length) setMlsMsg('No listings stored in the CRM yet.');
    } catch { setMlsMsg('Could not load CRM listings.'); }
  }

  async function savePhotoToListing(id: string, existing: any) {
    if (!photo) return;
    setSaveMsg('');
    try {
      let prev: string[] = [];
      try { prev = existing?.photos ? JSON.parse(existing.photos) : []; } catch { prev = []; }
      const r = await fetch('/api/listings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, photos: JSON.stringify([photo, ...prev].slice(0, 12)) }) });
      setSaveMsg(r.ok ? 'Photo saved to the listing - the whole team can see it.' : 'Save failed - listing not updated.');
    } catch { setSaveMsg('Save failed - check connection.'); }
  }
  // MLS CONNECTION POINT: the realtor logging into the calculator IS the
  // connection. Their own approved Realcomp credentials (encrypted
  // server-side) unlock live MLS + BS&A/Realist data for every layer, and
  // buyer profiles + criteria feed straight into the numbers.
  const [mlsConn, setMlsConn] = useState<any>(null);
  const [mlsUser, setMlsUser] = useState('');
  const [mlsSecret, setMlsSecret] = useState('');
  const [mlsBusy, setMlsBusy] = useState(false);
  const [mlsTestMsg, setMlsTestMsg] = useState('');
  const [buyers, setBuyers] = useState<any[]>([]);

  async function loadMlsConn() {
    try {
      const r = await fetch('/api/mls/connect');
      if (r.ok) setMlsConn(await r.json()); else setMlsConn({ connected: false, status: 'signed_out' });
    } catch { setMlsConn({ connected: false, status: 'offline' }); }
  }
  async function connectMls() {
    setMlsBusy(true); setMlsTestMsg('');
    try {
      const r = await fetch('/api/mls/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mlsUsername: mlsUser, secret: mlsSecret }) });
      const j = await r.json();
      if (r.ok) { setMlsConn(j); setMlsTestMsg(j.test?.message || ''); setMlsSecret(''); loadBuyers(); }
      else setMlsTestMsg(j.error || 'Connection failed.');
    } catch { setMlsTestMsg('Connection failed - check network.'); }
    setMlsBusy(false);
  }
  async function disconnectMls() {
    await fetch('/api/mls/connect', { method: 'DELETE' }).catch(() => null);
    setMlsConn({ connected: false, status: 'not_connected' }); setBuyers([]);
  }
  async function loadBuyers() {
    try {
      const r = await fetch('/api/mls/buyer-feed');
      if (r.ok) { const j = await r.json(); setBuyers(j.buyers || []); }
    } catch { /* buyers optional in appointment */ }
  }
  useEffect(() => { loadMlsConn(); }, []);
  // Meeting of the minds: RED = seller ask, GREEN = agent integrity price.
  const [sellerAsk, setSellerAsk] = useState(475000);
  const [marketTrend, setMarketTrend] = useState(3);
  // Seller state
  const [value, setValue] = useState(450000);
  const [mortgage, setMortgage] = useState(280000);
  const [commission, setCommission] = useState(5.5);
  const [sellClose, setSellClose] = useState(2);
  const [repairs, setRepairs] = useState(5000);
  const [concess, setConcess] = useState(0);
  const [origPrice, setOrigPrice] = useState(340000);
  const [yrsOwned, setYrsOwned] = useState(6);

  const buyer = useMemo(
    () =>
      analyzeBuyer({
        price, downPct: downPct, annualRate: rate, termYears: term,
        annualTaxRate: taxRate, annualInsurance: insurance, hoaMonthly: hoa,
        closingCostPct: closePct, monthlyRent: rent, monthlyIncome: income,
        appreciationPct: appr, holdYears: hold, maintenancePct: maint,
      }),
    [price, downPct, rate, term, taxRate, insurance, hoa, closePct, rent, income, appr, hold, maint]
  );

  const seller = useMemo(
    () =>
      analyzeSeller({
        marketValue: value, mortgageBalance: mortgage, commissionPct: commission,
        closingCostPct: sellClose, repairs: repairs, concessions: concess,
        originalPrice: origPrice, yearsOwned: yrsOwned,
      }),
    [value, mortgage, commission, sellClose, repairs, concess, origPrice, yrsOwned]
  );

  const buyerInputs = { price, downPct: downPct, annualRate: rate, termYears: term, annualTaxRate: taxRate, annualInsurance: insurance, hoaMonthly: hoa, closingCostPct: closePct, monthlyRent: rent, monthlyIncome: income, appreciationPct: appr, holdYears: hold, maintenancePct: maint };
  const sellerInputs = { marketValue: value, mortgageBalance: mortgage, commissionPct: commission, closingCostPct: sellClose, repairs: repairs, concessions: concess, originalPrice: origPrice, yearsOwned: yrsOwned };
  const buyerTarget = winBy === 'dscr' ? buyerPriceForDSCR(buyerInputs, winDSCR) : winBy === 'coc' ? buyerPriceForCashOnCash(buyerInputs, winCoC) : winBy === 'afford' ? buyerPriceForAffordability(buyerInputs, winAff) : buyerPriceForPayment(buyerInputs, winPay);
  const buyerGame = priceGame(price, buyerTarget);
  const buyerAtTarget = buyerTarget ? analyzeBuyer({ ...buyerInputs, price: Math.round(buyerTarget) }) : null;
  const sellerTarget = sellerPriceForNet(sellerInputs, targetNet);
  const sellerGame = priceGame(value, sellerTarget);
  const sellerAtTarget = sellerTarget ? analyzeSeller({ ...sellerInputs, marketValue: Math.round(sellerTarget) }) : null;
  const mlsFact = mls.length && mls[0]?.listPrice ? Number(mls[0].listPrice) : (rec?.marketValue ? null : null);
  const integrity = integrityPrice({ sellerAsk, mlsPrice: mlsFact, countyMarketValue: rec?.marketValue || null, assessedValue: rec?.assessedValue || null });
  const greenPath = integrity.agentPrice ? fiveYearPath(integrity.agentPrice, marketTrend) : [];
  const redPath = fiveYearPath(sellerAsk, marketTrend);
  const scaleMin = Math.min(sellerAsk, integrity.bandLow || sellerAsk) * 0.94;
  const scaleMax = Math.max(sellerAsk, integrity.bandHigh || sellerAsk) * 1.04;
  const pctOnScale = (v: number) => Math.max(0, Math.min(100, ((v - scaleMin) / Math.max(1, scaleMax - scaleMin)) * 100));  const GAME_STYLE: Record<string, string> = { higher: 'border-blue-500/50 bg-blue-500/10', lower: 'border-red-500/50 bg-red-500/10', at: 'border-green-500/50 bg-green-500/10' };
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <nav className="flex w-16 shrink-0 flex-col gap-1 print:hidden" aria-label="House layers">
          {([
            ['house', Home, 'House'],
            ['numbers', CalcIcon, 'Numbers'],
            ['records', Landmark, 'Records'],
            ['mls', KeyRound, 'MLS'],
            ['number', Target, 'Number'],
          ] as const).map(([key, Icon, label]) => (
            <button key={key} type="button" onClick={() => { setLayer(key); if (key === 'mls' && !mls.length) pullMls(); }} className={'flex flex-col items-center gap-1 rounded-xl border px-1 py-2.5 text-[10px] font-bold ' + (layer === key ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted')}>
              <Icon className="h-5 w-5" />{label}
            </button>
          ))}
          <div className="mt-2 rounded-xl border border-border p-1.5 text-center text-[9px] leading-tight text-muted-foreground">One house.<br />Every layer.</div>
        </nav>
        <div className="min-w-0 flex-1 space-y-4">      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-center">
        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Excel Legacy Realty Group</div>
        <div className="text-xl font-black">HIGHER or LOWER - find the one number everyone agrees on</div>
        <p className="mx-auto mt-1 max-w-2xl text-xs text-muted-foreground">No opinions, just math. Pick what winning means, and we solve for the exact price where the profit works. Then we move the price up or down together until buyer, seller, and agent are all looking at the same number. That is service with integrity: the number we need, proven live.</p>
      </div>      {layer === 'house' && (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-border">
            {photo ? <img src={photo} alt="Property" className="max-h-80 w-full object-cover" /> : <button type="button" onClick={() => fileRef.current?.click()} className="flex h-48 w-full flex-col items-center justify-center gap-2 bg-muted/40 text-muted-foreground hover:bg-muted"><ImagePlus className="h-8 w-8" /><span className="text-xs font-bold">Upload the property photo</span><span className="text-[11px]">Taken at the curb or from the listing - shown live in the appointment</span></button>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPhotoFile(e.target.files?.[0])} />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg border border-border px-3 py-2 text-xs font-bold hover:bg-muted">{photo ? 'Replace photo' : 'Upload photo'}</button>
            {photo ? <button type="button" onClick={() => setPhoto(null)} className="rounded-lg border border-border px-3 py-2 text-xs font-bold hover:bg-muted">Remove</button> : null}
            <span className="self-center text-[11px] text-muted-foreground">Saved on this device for the appointment{mls.length ? ' - and to the listing from the MLS layer.' : '.'}</span>
          </div>
          <label className="block space-y-1"><span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Street address</span><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, Warren, MI" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold outline-none focus:border-primary" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1"><span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Parcel ID (optional)</span><input value={parcel} onChange={(e) => setParcel(e.target.value)} placeholder="12-34-567-890" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold outline-none focus:border-primary" /></label>
            <label className="block space-y-1"><span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">County</span><input value={county} onChange={(e) => setCounty(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold outline-none focus:border-primary" /></label>
          </div>
          <button type="button" disabled={recBusy || (!address && !parcel)} onClick={pullRecords} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50">{recBusy ? 'Pulling public records...' : 'Pull public records (BS&A / MLS)'}</button>
          {recMsg ? <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs">{recMsg}</p> : null}
          {rec ? <p className="rounded-xl border border-green-500/40 bg-green-500/10 p-3 text-xs font-semibold">Record found from {recSource === 'bsa' ? 'BS&A Online (county)' : recSource === 'realcomp' ? 'Realcomp MLS' : recSource}. Open the Records layer to see it - every field, nothing invented.</p> : null}
        </div>
      )}
      {layer === 'records' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between"><h3 className="text-sm font-black uppercase tracking-wider">Public records - county / PRD layer</h3><span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-bold">{rec ? 'SOURCE: ' + (recSource || 'provider').toUpperCase() : 'NO RECORD PULLED'}</span></div>
          {!rec ? <p className="rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">Nothing here yet. Go to the House layer, enter the address or parcel, and pull public records. If BS&A / Realcomp keys are not configured, you will see an honest notice instead of invented numbers - that is by design.</p> : (
            <div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat label="Parcel ID" value={rec.parcelId || '--'} sub={rec.county || ''} />
                <Stat label="Market value" value={rec.marketValue ? fmtUSD(rec.marketValue) : '--'} sub={'Assessed ' + (rec.assessedValue ? fmtUSD(rec.assessedValue) : '--')} />
                <Stat label="Taxable value" value={rec.taxableValue ? fmtUSD(rec.taxableValue) : '--'} sub={'Est. tax ' + fmtUSD(estimatedAnnualTax(rec.taxableValue || 0)) + '/yr'} />
                <Stat label="Last sale" value={rec.lastSalePrice ? fmtUSD(rec.lastSalePrice) : '--'} sub={rec.lastSaleDate || ''} />
                <Stat label="Beds / Baths" value={(rec.bedrooms ?? '--') + ' / ' + (rec.bathrooms ?? '--')} sub={(rec.squareFeet ? Number(rec.squareFeet).toLocaleString() + ' sq ft' : '')} />
                <Stat label="Year built" value={rec.yearBuilt || '--'} sub={rec.propertyType || ''} />
                <Stat label="Lot size" value={rec.lotSize ?? '--'} sub={rec.homestead !== undefined ? 'Homestead: ' + String(rec.homestead) : ''} />
                <Stat label="Owner of record" value={rec.owner || '--'} sub={'Tax year ' + (rec.taxYear || '--')} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {rec.marketValue ? <button type="button" onClick={() => { setPrice(Math.round(rec.marketValue)); setValue(Math.round(rec.marketValue)); setLayer('numbers'); }} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">Use market value in calculator</button> : null}
                {taxRatePctFromRecord(rec.marketValue || 0, rec.taxableValue || 0) ? <button type="button" onClick={() => { const t = taxRatePctFromRecord(rec.marketValue || 0, rec.taxableValue || 0); if (t) setTaxRate(Math.round(t * 100) / 100); setLayer('numbers'); }} className="rounded-lg border border-border px-3 py-2 text-xs font-bold hover:bg-muted">Use county tax in calculator</button> : null}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">Everyone in the room sees the same county facts the agent sees. No hidden numbers - that is the point.</p>
            </div>
          )}
        </div>
      )}
      {layer === 'mls' && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black uppercase tracking-wider">Realtor MLS login - the connection point</span>
              <span className={'rounded-full px-2 py-0.5 text-[10px] font-bold ' + (mlsConn?.connected ? 'bg-green-500/15 text-green-700 dark:text-green-300' : 'border border-border text-muted-foreground')}>{mlsConn?.connected ? 'MLS LIVE' : mlsConn?.status === 'signed_out' ? 'SIGN IN TO CONNECT' : 'NOT CONNECTED'}</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Your approved Realcomp credentials connect MLS listings + BS&A / Realist public records to this calculator. Encrypted on the server - never shown, never stored in this browser.</p>
            {mlsConn?.connected || mlsConn?.status === 'saved_unverified' || mlsConn?.status === 'failed' ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold">Connected as {mlsConn.mlsUsername} ({mlsConn.maskedSecret}) - {mlsConn.status}</span>
                <button type="button" onClick={connectMls} disabled={mlsBusy} className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-bold hover:bg-muted">Re-test</button>
                <button type="button" onClick={disconnectMls} className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-bold hover:bg-muted">Disconnect</button>
                <button type="button" onClick={loadBuyers} className="rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground">Load buyer profiles</button>
              </div>
            ) : (
              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
                <input value={mlsUser} onChange={(e) => setMlsUser(e.target.value)} placeholder="MLS / Realcomp ID" className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold outline-none focus:border-primary" />
                <input type="password" value={mlsSecret} onChange={(e) => setMlsSecret(e.target.value)} placeholder="MLS password / API token" className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold outline-none focus:border-primary" />
                <button type="button" disabled={mlsBusy || !mlsUser || !mlsSecret} onClick={connectMls} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50">{mlsBusy ? 'Connecting...' : 'Connect my MLS'}</button>
              </div>
            )}
            {mlsTestMsg ? <p className="mt-2 text-[11px] font-semibold">{mlsTestMsg}</p> : null}
            {buyers.length ? (
              <div className="mt-3 space-y-2">
                <div className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Buyer profiles - tap to feed criteria into the numbers</div>
                {buyers.map((b: any) => (
                  <div key={b.leadId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background p-2.5">
                    <span className="text-xs font-bold">{b.name} <span className="font-medium text-muted-foreground">- {b.status}{b.criteria ? ' - ' + (b.criteria.city || 'any city') + ' ' + (b.criteria.minPrice ? fmtUSD(Number(b.criteria.minPrice)) : '') + (b.criteria.maxPrice ? ' to ' + fmtUSD(Number(b.criteria.maxPrice)) : '') + (b.criteria.beds ? ' - ' + b.criteria.beds + '+ bd' : '') : ' - no saved criteria'}{b.matchCount !== null && b.matchCount !== undefined ? ' - ' + b.matchCount + ' live matches' : ''}</span></span>
                    {b.criteria?.maxPrice ? <button type="button" onClick={() => { setPrice(Math.round(Number(b.criteria.maxPrice))); setLayer('numbers'); }} className="rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground">Use buyer max in calculator</button> : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex items-center justify-between"><h3 className="text-sm font-black uppercase tracking-wider">MLS layer - CRM listings</h3><button type="button" onClick={pullMls} className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold hover:bg-muted">Refresh</button></div>
          {mlsMsg ? <p className="text-xs text-muted-foreground">{mlsMsg}</p> : null}
          {!mls.length && !mlsMsg ? <p className="rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">Loading matches for this address from the CRM listing book (Realcomp-fed). Stored MLS facts only - status, price, days on market.</p> : null}
          {mls.map((l: any) => (
            <div key={l.id} className="rounded-2xl border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-extrabold">{l.address}{l.city ? ', ' + l.city : ''}</span><span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-bold">{l.status} - MLS# {l.mlsNumber || '--'}</span></div>
              <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat label="List price" value={l.listPrice ? fmtUSD(l.listPrice) : '--'} sub={(l.daysOnMarket ?? '--') + ' days on market'} />
                <Stat label="Beds / Baths" value={(l.bedrooms ?? '--') + ' / ' + (l.bathrooms ?? '--')} sub={(l.squareFeet ? Number(l.squareFeet).toLocaleString() + ' sq ft' : '')} />
                <Stat label="Year / Type" value={l.yearBuilt || '--'} sub={l.propertyType || ''} />
                <Stat label="Sold price" value={l.soldPrice ? fmtUSD(l.soldPrice) : '--'} sub={l.soldDate ? String(l.soldDate).slice(0, 10) : ''} />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {l.listPrice ? <button type="button" onClick={() => { setPrice(Math.round(l.listPrice)); setValue(Math.round(l.listPrice)); setLayer('numbers'); }} className="rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground">Use list price in calculator</button> : null}
                {photo ? <button type="button" onClick={() => savePhotoToListing(l.id, l)} className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-bold hover:bg-muted">Save house photo to this listing</button> : null}
              </div>
            </div>
          ))}
          {saveMsg ? <p className="rounded-xl border border-border bg-muted/40 p-3 text-xs">{saveMsg}</p> : null}
        </div>
      )}
      {layer === 'number' && (
        <div className="space-y-3">
          <h3 className="text-sm font-black uppercase tracking-wider">The Number - where everyone lands</h3>
          <div className="rounded-2xl border border-border p-4">
            <div className="text-xs font-black uppercase tracking-wider">Meeting of the minds - red vs green</div>
            <p className="mt-1 text-xs text-muted-foreground">RED is the seller number. GREEN is the agent price, built only from facts everyone can see: the MLS and the county. If red sits inside the light-green room, you already agree.</p>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              <NumField label="Seller ask (RED)" value={sellerAsk} onChange={setSellerAsk} prefix="$" step={1000} />
              <NumField label="Market growth / yr" value={marketTrend} onChange={setMarketTrend} suffix="%" step={0.5} hint="Today market, 5-yr view" />
              <Stat label="Agent price (GREEN)" value={integrity.agentPrice ? fmtUSD(integrity.agentPrice) : '--'} sub={integrity.bandLow ? 'Fair room ' + fmtUSD(integrity.bandLow) + ' - ' + fmtUSD(integrity.bandHigh || 0) : 'Pull records first'} />
              <Stat label="Gap to green" value={integrity.agentPrice ? fmtUSD(Math.abs(integrity.sellerGap)) : '--'} sub={integrity.position === 'inside' ? 'Inside the room - together' : integrity.position === 'above' ? 'Red is over the room' : integrity.position === 'below' ? 'Red is under - room to rise' : ''} />
            </div>
            {integrity.agentPrice ? (
              <div className="relative mt-6 mb-2 h-10 rounded-full bg-muted" role="img" aria-label="Price scale: seller red number versus agent green price">
                <div className="absolute top-0 h-10 rounded-full bg-green-500/25" style={{ left: pctOnScale(integrity.bandLow || 0) + '%', width: Math.max(2, pctOnScale(integrity.bandHigh || 0) - pctOnScale(integrity.bandLow || 0)) + '%' }} />
                <div className="absolute top-[-6px] h-[52px] w-1.5 rounded bg-green-600" style={{ left: pctOnScale(integrity.agentPrice) + '%' }} title="Green - agent price" />
                <div className="absolute top-[-6px] h-[52px] w-1.5 rounded bg-red-600" style={{ left: pctOnScale(sellerAsk) + '%' }} title="Red - seller ask" />
                <span className="absolute -bottom-5 text-[10px] font-bold text-green-700 dark:text-green-300" style={{ left: pctOnScale(integrity.agentPrice) + '%' }}>GREEN {fmtUSD(integrity.agentPrice)}</span>
                <span className="absolute -top-5 text-[10px] font-bold text-red-600" style={{ left: pctOnScale(sellerAsk) + '%' }}>RED {fmtUSD(sellerAsk)}</span>
              </div>
            ) : null}
            <ul className="mt-6 list-disc space-y-1 pl-5 text-xs leading-relaxed">
              {integrity.reasons.map((r, i) => (<li key={i}>{r}</li>))}
            </ul>
            {integrity.agentPrice ? <button type="button" onClick={() => { if (integrity.agentPrice) { setSellerAsk(integrity.agentPrice); setValue(integrity.agentPrice); } }} className="mt-3 rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white">Meet at the green number</button> : null}
          </div>
          <div className="rounded-2xl border border-border p-4">
            <div className="text-xs font-black uppercase tracking-wider">The next 5 years - from today</div>
            <p className="mt-1 text-xs text-muted-foreground">If the market grows {marketTrend}% a year, here is the simple path. No tricks - same math for red and green.</p>
            <div className="mt-3 grid grid-cols-3 gap-2 md:grid-cols-6">
              {[0, 1, 2, 3, 4, 5].map((y) => (
                <div key={y} className="rounded-xl border border-border p-2 text-center">
                  <div className="text-[10px] font-bold uppercase text-muted-foreground">{y === 0 ? 'Today' : 'Year ' + y}</div>
                  <div className="text-[11px] font-bold text-red-600">{fmtUSD(redPath[y] || sellerAsk)}</div>
                  <div className="text-[11px] font-bold text-green-700 dark:text-green-300">{greenPath[y] ? fmtUSD(greenPath[y]) : '--'}</div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-center gap-4 text-[10px] font-bold"><span className="text-red-600">RED = seller ask path</span><span className="text-green-700 dark:text-green-300">GREEN = agent price path</span></div>
            {integrity.agentPrice ? <p className="mt-2 text-center text-xs font-semibold">In 5 years: red path {fmtUSD(redPath[5])} - green path {fmtUSD(greenPath[5] || 0)}. Buying or selling at green today keeps the profit real, not wished.</p> : null}
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className={'rounded-2xl border p-4 ' + GAME_STYLE[buyerGame.direction]}><div className="text-[11px] font-black uppercase tracking-wider">Buyer side</div><div className="text-2xl font-black">{buyerTarget ? fmtUSD(Math.round(buyerTarget)) : '--'}</div><p className="text-xs">{buyerGame.label}</p>{buyerAtTarget ? <p className="mt-1 text-xs font-semibold">At that price: payment {fmtUSD(buyerAtTarget.totalMonthly)}/mo - verdict: {buyerAtTarget.verdictLabel}.</p> : null}<button type="button" onClick={() => setLayer('numbers')} className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground">Play buyer numbers</button></div>
            <div className={'rounded-2xl border p-4 ' + GAME_STYLE[sellerGame.direction]}><div className="text-[11px] font-black uppercase tracking-wider">Seller side</div><div className="text-2xl font-black">{sellerTarget ? fmtUSD(Math.round(sellerTarget)) : '--'}</div><p className="text-xs">{sellerGame.label}</p>{sellerAtTarget ? <p className="mt-1 text-xs font-semibold">Seller keeps {fmtUSD(sellerAtTarget.netProceeds)} at that price.</p> : null}<button type="button" onClick={() => setLayer('numbers')} className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground">Play seller numbers</button></div>
          </div>
          <p className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">How we got here, in the open: House photo + county record + MLS facts feed the same calculator the client watches. One house, every layer, one number. Excel Legacy Realty Group - service and integrity, proven live.</p>
        </div>
      )}
      {layer === 'numbers' && (<>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('buyer')}
          className={'flex-1 rounded-xl border px-4 py-2.5 text-sm font-bold ' + (mode === 'buyer' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted')}
        >
          Buyer — good investment?
        </button>
        <button
          type="button"
          onClick={() => setMode('seller')}
          className={'flex-1 rounded-xl border px-4 py-2.5 text-sm font-bold ' + (mode === 'seller' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted')}
        >
          Seller — what do I keep?
        </button>
      </div>

      {mode === 'buyer' ? (
        <div>
          <div className={'rounded-2xl border p-4 ' + VERDICT_STYLE[buyer.verdict]}>
            <div className="text-xs font-black uppercase tracking-wider">Verdict — {buyer.verdictLabel}</div>
            <p className="mt-1 text-sm font-medium">{buyer.verdictReason}</p>
          </div>
          <div className={'mt-4 rounded-2xl border p-4 ' + GAME_STYLE[buyerGame.direction]}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black uppercase tracking-wider">Higher or Lower — the game</span>
              <div className="flex flex-wrap gap-1">
                <button type="button" onClick={() => setWinBy('dscr')} className={'rounded-lg px-2 py-1 text-[11px] font-bold ' + (winBy === 'dscr' ? 'bg-primary text-primary-foreground' : 'border border-border')}>Cash-flows (DSCR)</button>
                <button type="button" onClick={() => setWinBy('coc')} className={'rounded-lg px-2 py-1 text-[11px] font-bold ' + (winBy === 'coc' ? 'bg-primary text-primary-foreground' : 'border border-border')}>Cash-on-cash</button>
                <button type="button" onClick={() => setWinBy('afford')} className={'rounded-lg px-2 py-1 text-[11px] font-bold ' + (winBy === 'afford' ? 'bg-primary text-primary-foreground' : 'border border-border')}>% of income</button>
                <button type="button" onClick={() => setWinBy('payment')} className={'rounded-lg px-2 py-1 text-[11px] font-bold ' + (winBy === 'payment' ? 'bg-primary text-primary-foreground' : 'border border-border')}>Monthly payment</button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              {winBy === 'dscr' ? <NumField label="Win at DSCR" value={winDSCR} onChange={setWinDSCR} suffix="x" step={0.05} hint="1.25x = lender-grade" /> : null}
              {winBy === 'coc' ? <NumField label="Win at cash-on-cash" value={winCoC} onChange={setWinCoC} suffix="%" step={0.5} /> : null}
              {winBy === 'afford' ? <NumField label="Win at income share" value={winAff} onChange={setWinAff} suffix="%" step={1} hint="28% = comfort band" /> : null}
              {winBy === 'payment' ? <NumField label="Win at payment" value={winPay} onChange={setWinPay} prefix="$" step={50} /> : null}
              <Stat label="THE number (price we need)" value={buyerTarget ? fmtUSD(Math.round(buyerTarget)) : '--'} sub={buyerGame.label} />
              <Stat label="Asking price now" value={fmtUSD(price)} sub={buyerGame.gapPct !== null ? (buyerGame.gap >= 0 ? '+' : '') + buyerGame.gapPct.toFixed(1) + '% vs the number' : ''} />
              <Stat label="Monthly profit at the number" value={buyerAtTarget ? fmtUSD(rent - buyerAtTarget.totalMonthly - (Math.round(buyerTarget || 0) * maint) / 1200) : '--'} sub={buyerAtTarget ? 'Payment ' + fmtUSD(buyerAtTarget.totalMonthly) + ' at that price' : ''} />
            </div>
            <div className="mt-3 text-center text-2xl font-black">{buyerGame.direction === 'at' ? 'AT THE NUMBER' : buyerGame.direction === 'lower' ? 'HIGHER - bring it down' : 'LOWER - room to go up'}</div>
            <input type="range" min={150000} max={1200000} step={1000} value={price} onChange={(e) => setPrice(Number(e.target.value))} className="mt-2 w-full accent-primary" aria-label="Play the price higher or lower" />
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              {[-25000, -10000, -1000, 1000, 10000, 25000].map((d) => (<button key={d} type="button" onClick={() => setPrice(Math.max(0, price + d))} className="rounded-lg border border-border px-2 py-1 text-[11px] font-bold hover:bg-muted">{d < 0 ? '-' : '+'}{fmtUSD(Math.abs(d))}</button>))}
              {buyerTarget ? <button type="button" onClick={() => setPrice(Math.round(buyerTarget))} className="rounded-lg bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground">Take me to the number</button> : null}
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">Agent: drag the price live. When the banner turns green, buyer, seller, and agent are on the same number - that is the deal.</p>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <NumField label="Purchase price" value={price} onChange={setPrice} prefix="$" hint="AZ median ~ $450k" />
            <NumField label="Expected monthly rent (0 = living in it)" value={rent} onChange={setRent} prefix="$" step={50} hint="Fill rent to switch to investor verdict" />
            <NumField label="Down payment" value={downPct} onChange={setDownPct} suffix="%" step={1} />
            <NumField label="Interest rate" value={rate} onChange={setRate} suffix="%" step={0.125} />
            <NumField label="Loan term" value={term} onChange={setTerm} suffix="yrs" step={5} />
            <NumField label="Monthly take-home pay" value={income} onChange={setIncome} prefix="$" step={100} />
            <NumField label="Property tax rate" value={taxRate} onChange={setTaxRate} suffix="%" step={0.05} hint="AZ effective ~0.5%" />
            <NumField label="Insurance ($/yr)" value={insurance} onChange={setInsurance} prefix="$" step={50} />
            <NumField label="HOA ($/mo)" value={hoa} onChange={setHoa} prefix="$" step={10} />
            <NumField label="Closing costs" value={closePct} onChange={setClosePct} suffix="%" step={0.25} />
            <NumField label="Appreciation (%/yr)" value={appr} onChange={setAppr} suffix="%" step={0.5} />
            <NumField label="Hold period" value={hold} onChange={setHold} suffix="yrs" step={1} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Monthly payment (PITI+HOA)" value={fmtUSD(buyer.totalMonthly)} sub={'P&I ' + fmtUSD(buyer.monthlyPI) + ' + tax ' + fmtUSD(buyer.monthlyTax) + ' + ins ' + fmtUSD(buyer.monthlyInsurance)} />
            <Stat label="Cash to close" value={fmtUSD(buyer.cashToClose)} sub={'Down ' + fmtUSD(buyer.downPayment)} />
            <Stat label="DSCR / Cap / CoC" value={buyer.dscr !== null ? buyer.dscr.toFixed(2) + 'x' : '--'} sub={'Cap ' + fmtPct(buyer.capRate) + ' · CoC ' + fmtPct(buyer.cashOnCash) + ' · 1% ' + fmtPct(buyer.onePct, 2)} />
            <Stat label={'Value in ' + hold + ' yrs'} value={fmtUSD(buyer.futureValue)} sub={'Equity ~' + fmtUSD(buyer.equityAtSale)} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => window.print()} className="rounded-lg border border-border px-4 py-2 text-xs font-bold hover:bg-muted">Print client handout</button>
            <span className="text-[11px] text-muted-foreground self-center">Estimate only — not a loan commitment. Taxes, insurance, HOA vary by parcel.</span>
          </div>
        </div>
      ) : (
        <div>
          <div className={'rounded-2xl border p-4 ' + VERDICT_STYLE[seller.verdict]}>
            <div className="text-xs font-black uppercase tracking-wider">Verdict — {seller.verdictLabel}</div>
            <p className="mt-1 text-sm font-medium">{seller.verdictReason}</p>
          </div>
          <div className={'mt-4 rounded-2xl border p-4 ' + GAME_STYLE[sellerGame.direction]}>
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-black uppercase tracking-wider">Higher or Lower — the game</span><span className="text-[11px] text-muted-foreground">Name the walk-away number, we solve the list price that delivers it.</span></div>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              <NumField label="Seller must walk away with" value={targetNet} onChange={setTargetNet} prefix="$" step={5000} hint="The profit that makes selling worth it" />
              <Stat label="THE number (list price we need)" value={sellerTarget ? fmtUSD(Math.round(sellerTarget)) : '--'} sub={sellerGame.label} />
              <Stat label="Market value now" value={fmtUSD(value)} sub={sellerGame.gapPct !== null ? (sellerGame.gap >= 0 ? '+' : '') + sellerGame.gapPct.toFixed(1) + '% vs the number' : ''} />
              <Stat label="Seller keeps at the number" value={sellerAtTarget ? fmtUSD(sellerAtTarget.netProceeds) : '--'} sub={sellerAtTarget ? 'Costs ' + fmtPct(sellerAtTarget.costPct) + ' at that price' : ''} />
            </div>
            <div className="mt-3 text-center text-2xl font-black">{sellerGame.direction === 'at' ? 'AT THE NUMBER' : sellerGame.direction === 'lower' ? 'HIGHER - bring it down' : 'LOWER - room to go up'}</div>
            <input type="range" min={100000} max={1500000} step={1000} value={value} onChange={(e) => setValue(Number(e.target.value))} className="mt-2 w-full accent-primary" aria-label="Play the list price higher or lower" />
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              {[-25000, -10000, -1000, 1000, 10000, 25000].map((d) => (<button key={d} type="button" onClick={() => setValue(Math.max(0, value + d))} className="rounded-lg border border-border px-2 py-1 text-[11px] font-bold hover:bg-muted">{d < 0 ? '-' : '+'}{fmtUSD(Math.abs(d))}</button>))}
              {sellerTarget ? <button type="button" onClick={() => setValue(Math.round(sellerTarget))} className="rounded-lg bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground">Price it at the number</button> : null}
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">Agent: drag the list price live. Green means the seller keeps their number and the buyer still has a deal - everyone arrives together.</p>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <NumField label="Market value" value={value} onChange={setValue} prefix="$" />
            <NumField label="Mortgage balance" value={mortgage} onChange={setMortgage} prefix="$" />
            <NumField label="Commission" value={commission} onChange={setCommission} suffix="%" step={0.25} />
            <NumField label="Closing costs" value={sellClose} onChange={setSellClose} suffix="%" step={0.25} />
            <NumField label="Repairs / prep" value={repairs} onChange={setRepairs} prefix="$" step={500} />
            <NumField label="Concessions" value={concess} onChange={setConcess} prefix="$" step={500} />
            <NumField label="Original purchase price" value={origPrice} onChange={setOrigPrice} prefix="$" />
            <NumField label="Years owned" value={yrsOwned} onChange={setYrsOwned} suffix="yrs" step={1} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Net proceeds" value={fmtUSD(seller.netProceeds)} sub={'Costs ' + fmtPct(seller.costPct) + ' of price'} />
            <Stat label="Selling costs" value={fmtUSD(seller.totalSellingCosts)} sub={'Commission ' + fmtUSD(seller.commission)} />
            <Stat label="Gross equity" value={fmtUSD(seller.equityGross)} sub={'Before selling costs'} />
            <Stat label="Gain / ROI" value={fmtUSD(seller.gain)} sub={'ROI ' + fmtPct(seller.roiPct) + ' · ' + fmtPct(seller.annualizedPct) + '/yr'} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => window.print()} className="rounded-lg border border-border px-4 py-2 text-xs font-bold hover:bg-muted">Print net sheet</button>
            <span className="text-[11px] text-muted-foreground self-center">Estimate only — payoff, prorations, and taxes confirmed at title.</span>
          </div>
        </div>
      )}

      </>)}
      <p className="rounded-xl border border-border bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
        Results are estimates for education only, not financial, tax, or lending advice. Numbers are calculated in this app by Excel Legacy
        Realty Group (RealEstateCRM platform). Agent websites are separate client projects. Requested example
        agentnative-arizona-property.agent-native6794.ch does not resolve in DNS (NXDOMAIN) as of this build, so this is the
        in-CRM version agents can show buyers and sellers right now.
      </p>
      </div>
    </div>
    </div>
  );
}
