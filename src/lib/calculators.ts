// Investment calculators - pure math for buyer + seller client presentations.
// Why: dashboard + agent tenant sites need one shared engine so numbers match
// everywhere (CRM view, printed handout, embedded site block). No dependencies.

export interface BuyerInputs {
  price: number;
  downPct: number;
  annualRate: number;
  termYears: number;
  annualTaxRate: number;
  annualInsurance: number;
  hoaMonthly: number;
  closingCostPct: number;
  monthlyRent: number;
  monthlyIncome: number;
  appreciationPct: number;
  holdYears: number;
  maintenancePct: number;
}

export interface BuyerResult {
  loanAmount: number;
  downPayment: number;
  monthlyPI: number;
  monthlyTax: number;
  monthlyInsurance: number;
  totalMonthly: number;
  cashToClose: number;
  dscr: number | null;
  capRate: number | null;
  cashOnCash: number | null;
  onePct: number | null;
  affordabilityPct: number | null;
  futureValue: number;
  equityAtSale: number;
  verdict: 'strong' | 'good' | 'fair' | 'risky';
  verdictLabel: string;
  verdictReason: string;
}

export function monthlyPI(principal: number, annualRate: number, termYears: number): number {
  if (principal <= 0) return 0;
  if (annualRate <= 0) return principal / (termYears * 12);
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

export function analyzeBuyer(i: BuyerInputs): BuyerResult {
  const price = Math.max(0, i.price || 0);
  const downPayment = (price * (i.downPct || 0)) / 100;
  const loanAmount = Math.max(0, price - downPayment);
  const monthlyPIVal = monthlyPI(loanAmount, i.annualRate || 0, i.termYears || 30);
  const monthlyTax = (price * (i.annualTaxRate || 0)) / 100 / 12;
  const monthlyInsurance = (i.annualInsurance || 0) / 12;
  const totalMonthly = monthlyPIVal + monthlyTax + monthlyInsurance + (i.hoaMonthly || 0);
  const cashToClose = downPayment + (price * (i.closingCostPct || 0)) / 100;
  const futureValue = price * Math.pow(1 + (i.appreciationPct || 0) / 100, i.holdYears || 5);
  const equityAtSale = Math.max(0, futureValue - loanAmount);
  const isInvestor = (i.monthlyRent || 0) > 0;
  let dscr: number | null = null;
  let capRate: number | null = null;
  let cashOnCash: number | null = null;
  let onePct: number | null = null;
  let affordabilityPct: number | null = null;
  let verdict: BuyerResult['verdict'] = 'fair';
  let verdictLabel = '';
  let verdictReason = '';
  if (isInvestor) {
    const rent = i.monthlyRent;
    const maintMo = (price * (i.maintenancePct || 0)) / 100 / 12;
    const noiMonthly = rent - monthlyTax - monthlyInsurance - (i.hoaMonthly || 0) - maintMo;
    const annualCashFlow = (rent - totalMonthly - maintMo) * 12;
    dscr = totalMonthly > 0 ? rent / totalMonthly : null;
    capRate = price > 0 ? ((noiMonthly * 12) / price) * 100 : null;
    cashOnCash = cashToClose > 0 ? (annualCashFlow / cashToClose) * 100 : null;
    onePct = price > 0 ? (rent / price) * 100 : null;
    if ((dscr ?? 0) >= 1.25 && (cashOnCash ?? 0) >= 8) {
      verdict = 'strong'; verdictLabel = 'Strong investment';
      verdictReason = 'Rent covers the payment ' + (dscr ?? 0).toFixed(2) + 'x with ' + (cashOnCash ?? 0).toFixed(1) + '% cash-on-cash. Above typical AZ investor bars.';
    } else if ((dscr ?? 0) >= 1.0 && (cashOnCash ?? 0) >= 4) {
      verdict = 'good'; verdictLabel = 'Good investment';
      verdictReason = 'Rent covers costs (' + (dscr ?? 0).toFixed(2) + 'x DSCR, ' + (cashOnCash ?? 0).toFixed(1) + '% cash-on-cash). Works at these assumptions.';
    } else if ((dscr ?? 0) >= 0.9) {
      verdict = 'fair'; verdictLabel = 'Tight - needs upside';
      verdictReason = 'Near break-even (' + (dscr ?? 0).toFixed(2) + 'x). Needs higher rent, bigger down payment, or appreciation to pencil.';
    } else {
      verdict = 'risky'; verdictLabel = 'Not cash-flowing';
      verdictReason = 'Rent only covers ' + ((dscr ?? 0) * 100).toFixed(0) + '% of monthly cost. Negative leverage at these terms.';
    }
  } else {
    affordabilityPct = i.monthlyIncome > 0 ? (totalMonthly / i.monthlyIncome) * 100 : null;
    if (affordabilityPct !== null) {
      if (affordabilityPct <= 28) { verdict = 'strong'; verdictLabel = 'Comfortable buy'; verdictReason = 'Payment is ' + affordabilityPct.toFixed(1) + '% of income - inside the 28% comfort band.'; }
      else if (affordabilityPct <= 36) { verdict = 'good'; verdictLabel = 'Workable buy'; verdictReason = 'Payment is ' + affordabilityPct.toFixed(1) + '% of income - stretch but common with reserves.'; }
      else if (affordabilityPct <= 43) { verdict = 'fair'; verdictLabel = 'Stretch - caution'; verdictReason = 'Payment is ' + affordabilityPct.toFixed(1) + '% of income. Lender max zone; little cushion.'; }
      else { verdict = 'risky'; verdictLabel = 'Over budget'; verdictReason = 'Payment is ' + affordabilityPct.toFixed(1) + '% of income. High risk without more down or lower price.'; }
    } else {
      const gain = futureValue - price;
      if (gain > totalMonthly * 12) { verdict = 'good'; verdictLabel = 'Solid outlook'; verdictReason = 'Projected ' + i.holdYears + '-yr appreciation outpaces a year of payments.'; }
      else { verdict = 'fair'; verdictLabel = 'Check the numbers'; verdictReason = 'Add income or expected rent for a firm verdict.'; }
    }
  }
  return { loanAmount, downPayment, monthlyPI: monthlyPIVal, monthlyTax, monthlyInsurance, totalMonthly, cashToClose, dscr, capRate, cashOnCash, onePct, affordabilityPct, futureValue, equityAtSale, verdict, verdictLabel, verdictReason };
}

export interface SellerInputs {
  marketValue: number;
  mortgageBalance: number;
  commissionPct: number;
  closingCostPct: number;
  repairs: number;
  concessions: number;
  originalPrice: number;
  yearsOwned: number;
}

export interface SellerResult {
  equityGross: number;
  commission: number;
  closingCosts: number;
  totalSellingCosts: number;
  netProceeds: number;
  costPct: number;
  gain: number;
  roiPct: number | null;
  annualizedPct: number | null;
  verdict: 'strong' | 'good' | 'fair' | 'risky';
  verdictLabel: string;
  verdictReason: string;
}

export function analyzeSeller(i: SellerInputs): SellerResult {
  const value = Math.max(0, i.marketValue || 0);
  const mortgage = Math.max(0, i.mortgageBalance || 0);
  const equityGross = value - mortgage;
  const commission = (value * (i.commissionPct || 0)) / 100;
  const closingCosts = (value * (i.closingCostPct || 0)) / 100;
  const totalSellingCosts = commission + closingCosts + (i.repairs || 0) + (i.concessions || 0);
  const netProceeds = value - mortgage - totalSellingCosts;
  const costPct = value > 0 ? (totalSellingCosts / value) * 100 : 0;
  const gain = (i.originalPrice || 0) > 0 ? value - i.originalPrice : netProceeds;
  const roiPct = i.originalPrice > 0 ? (gain / i.originalPrice) * 100 : null;
  const annualizedPct = roiPct !== null && (i.yearsOwned || 0) > 0 ? (Math.pow(1 + roiPct / 100, 1 / i.yearsOwned) - 1) * 100 : null;
  let verdict: SellerResult['verdict'] = 'good';
  let verdictLabel = '';
  let verdictReason = '';
  if (netProceeds < 0) { verdict = 'risky'; verdictLabel = 'Underwater - hold or review'; verdictReason = 'Sale does not clear the mortgage plus costs. Get agent review before listing.'; }
  else if (costPct <= 10 && netProceeds >= equityGross * 0.88) { verdict = 'strong'; verdictLabel = 'Great time to sell'; verdictReason = 'You keep about ' + Math.round(netProceeds).toLocaleString() + ' with lean ' + costPct.toFixed(1) + '% selling costs.'; }
  else if (costPct <= 14) { verdict = 'good'; verdictLabel = 'Worth selling'; verdictReason = 'Net about ' + Math.round(netProceeds).toLocaleString() + ' after ' + costPct.toFixed(1) + '% costs. Solid take-home.'; }
  else { verdict = 'fair'; verdictLabel = 'Sellable - trim costs'; verdictReason = 'Costs eat ' + costPct.toFixed(1) + '% of price. Negotiate commission, repairs, or concessions.'; }
  return { equityGross, commission, closingCosts, totalSellingCosts, netProceeds, costPct, gain, roiPct, annualizedPct, verdict, verdictLabel, verdictReason };
}

// --- HIGHER or LOWER: solve-for-price game ---------------------------------
// Why: in a listing appointment the agent and client play "higher or lower"
// against ONE number - the price where the deal pencils. Instead of arguing
// opinions, both sides move the price up/down and watch profit appear or
// vanish until they land on the same number. These solvers invert the buyer
// and seller math above (closed form, no iteration) so the target price
// updates live as the agent drags any input.

function buyerMonthlyFactor(i: BuyerInputs): { alpha: number; fixed: number } {
  // totalMonthly = price * alpha + fixed  (fixed = insurance + HOA)
  const downPayment = ((i.price || 0) * (i.downPct || 0)) / 100;
  const loanAmount = Math.max(0, (i.price || 0) - downPayment);
  const perDollar = loanAmount > 0 ? monthlyPI(loanAmount, i.annualRate || 0, i.termYears || 30) / loanAmount : 0;
  const alpha = (1 - (i.downPct || 0) / 100) * perDollar + (i.annualTaxRate || 0) / 1200;
  const fixed = (i.annualInsurance || 0) / 12 + (i.hoaMonthly || 0);
  return { alpha, fixed };
}

export function buyerPriceForDSCR(i: BuyerInputs, targetDSCR: number): number | null {
  if (!targetDSCR || targetDSCR <= 0 || !(i.monthlyRent > 0)) return null;
  const { alpha, fixed } = buyerMonthlyFactor(i);
  if (alpha <= 0) return null;
  const p = (i.monthlyRent / targetDSCR - fixed) / alpha;
  return p > 0 ? p : null;
}

export function buyerPriceForCashOnCash(i: BuyerInputs, targetCoCPct: number): number | null {
  if (!(i.monthlyRent > 0)) return null;
  const { alpha, fixed } = buyerMonthlyFactor(i);
  const beta = alpha + (i.maintenancePct || 0) / 1200;
  const gamma = ((i.downPct || 0) + (i.closingCostPct || 0)) / 100;
  const denom = 12 * beta + (targetCoCPct / 100) * gamma;
  if (denom <= 0) return null;
  const p = (12 * (i.monthlyRent - fixed)) / denom;
  return p > 0 ? p : null;
}

export function buyerPriceForPayment(i: BuyerInputs, targetMonthly: number): number | null {
  if (!targetMonthly || targetMonthly <= 0) return null;
  const { alpha, fixed } = buyerMonthlyFactor(i);
  if (alpha <= 0) return null;
  const p = (targetMonthly - fixed) / alpha;
  return p > 0 ? p : null;
}

export function buyerPriceForAffordability(i: BuyerInputs, targetPct: number): number | null {
  if (!targetPct || targetPct <= 0 || !(i.monthlyIncome > 0)) return null;
  return buyerPriceForPayment(i, (i.monthlyIncome * targetPct) / 100);
}

export function sellerPriceForNet(i: SellerInputs, targetNet: number): number | null {
  const keepRate = 1 - ((i.commissionPct || 0) + (i.closingCostPct || 0)) / 100;
  if (keepRate <= 0) return null;
  const p = (targetNet + (i.mortgageBalance || 0) + (i.repairs || 0) + (i.concessions || 0)) / keepRate;
  return p > 0 ? p : null;
}

export type PriceDirection = 'higher' | 'lower' | 'at';

export interface PriceGame {
  direction: PriceDirection;
  gap: number;
  gapPct: number | null;
  label: string;
}

// The game call: is the asking price HIGHER or LOWER than the number where
// everyone wins? 'lower' = price must come down to hit the target,
// 'higher' = there is room to pay/ask more, 'at' = already on the number.
export function priceGame(currentPrice: number, targetPrice: number | null): PriceGame {
  if (targetPrice === null || !isFinite(targetPrice) || targetPrice <= 0) {
    return { direction: 'at', gap: 0, gapPct: null, label: 'Add rent, income, or a target to find the number.' };
  }
  const gap = currentPrice - targetPrice;
  const gapPct = (gap / targetPrice) * 100;
  if (Math.abs(gapPct) < 0.5) return { direction: 'at', gap, gapPct, label: 'AT THE NUMBER - this price already works for everyone.' };
  if (gap > 0) return { direction: 'lower', gap, gapPct, label: 'HIGHER than the number - price needs to come DOWN ' + fmtUSD(Math.abs(gap)) + ' to hit the target.' };
  return { direction: 'higher', gap, gapPct, label: 'LOWER than the number - there is room to go UP ' + fmtUSD(Math.abs(gap)) + ' and still hit the target.' };
}

// Public-record helpers (BS&A / Realcomp payloads from /api/property-data).
// Why: the house layers show county/MLS facts next to the calculator, and
// "Use in calculator" must translate them honestly - estimated annual tax
// uses the same 2.1% of taxable value the prefill-offer endpoint uses.
export function estimatedAnnualTax(taxableValue: number): number {
  if (!taxableValue || taxableValue <= 0) return 0;
  return Math.round(taxableValue * 0.021);
}

export function taxRatePctFromRecord(marketValue: number, taxableValue: number): number | null {
  if (!marketValue || marketValue <= 0 || !taxableValue || taxableValue <= 0) return null;
  return (estimatedAnnualTax(taxableValue) / marketValue) * 100;
}

export function fmtUSD(n: number, digits = 0): string {
  if (!isFinite(n)) return '--';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtPct(n: number | null, digits = 1): string {
  if (n === null || !isFinite(n)) return '--';
  return n.toFixed(digits) + '%';
}
