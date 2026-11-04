'use client';
// Buyer + seller investment calculator for client presentations.
// Why: agents need one screen that answers "is this a good investment?"
// for both sides. Buyer tab covers homebuyer affordability + investor
// DSCR/cap-rate/cash-on-cash. Seller tab covers net proceeds + ROI.
// Embeddable: also rendered by tenant sites via CALCULATOR block.

import { useMemo, useState } from 'react';
import { analyzeBuyer, analyzeSeller, fmtUSD, fmtPct } from '@/lib/calculators';

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

  return (
    <div className="space-y-4">
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

      <p className="rounded-xl border border-border bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
        Results are estimates for education only, not financial, tax, or lending advice. Numbers are calculated in this app by Excel Legacy
        Realty Group (RealEstateCRM platform). Agent websites are separate client projects. Requested example
        agentnative-arizona-property.agent-native6794.ch does not resolve in DNS (NXDOMAIN) as of this build, so this is the
        in-CRM version agents can show buyers and sellers right now.
      </p>
    </div>
  );
}
