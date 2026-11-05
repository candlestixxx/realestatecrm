import test from "node:test";
import assert from "node:assert/strict";

import { analyzeBuyer, analyzeSeller, monthlyPI, fmtUSD, buyerPriceForDSCR, buyerPriceForCashOnCash, buyerPriceForAffordability, sellerPriceForNet, priceGame, estimatedAnnualTax, taxRatePctFromRecord } from "../src/lib/calculators.ts";

test("monthlyPI matches amortization", () => {
  const pi = monthlyPI(360000, 6.5, 30);
  assert.ok(pi > 2270 && pi < 2280);
});

test("investor buyer with strong rent gets strong verdict", () => {
  const r = analyzeBuyer({ price: 450000, downPct: 20, annualRate: 6.5, termYears: 30, annualTaxRate: 0.52, annualInsurance: 1800, hoaMonthly: 0, closingCostPct: 3, monthlyRent: 4200, monthlyIncome: 0, appreciationPct: 3, holdYears: 5, maintenancePct: 1 });
  assert.equal(r.verdict, "strong");
  assert.ok((r.dscr || 0) >= 1.25);
});

test("homebuyer affordability bands", () => {
  const base = { price: 450000, downPct: 20, annualRate: 6.5, termYears: 30, annualTaxRate: 0.52, annualInsurance: 1800, hoaMonthly: 0, closingCostPct: 3, monthlyRent: 0, appreciationPct: 3, holdYears: 5, maintenancePct: 1 };
  const ok = analyzeBuyer(Object.assign({}, base, { monthlyIncome: 12000 }));
  const over = analyzeBuyer(Object.assign({}, base, { monthlyIncome: 4000 }));
  assert.equal(ok.verdict, "strong");
  assert.equal(over.verdict, "risky");
});

test("seller nets proceeds with sane cost pct", () => {
  const s = analyzeSeller({ marketValue: 450000, mortgageBalance: 280000, commissionPct: 5.5, closingCostPct: 2, repairs: 5000, concessions: 0, originalPrice: 340000, yearsOwned: 6 });
  assert.ok(s.netProceeds > 120000);
  assert.ok(s.costPct < 14);
});

test("underwater seller flagged risky", () => {
  const s = analyzeSeller({ marketValue: 250000, mortgageBalance: 280000, commissionPct: 5.5, closingCostPct: 2, repairs: 0, concessions: 0, originalPrice: 300000, yearsOwned: 3 });
  assert.equal(s.verdict, "risky");
  assert.ok(s.netProceeds < 0);
});

test("HIGHER-or-LOWER: price solved for 1.25x DSCR round-trips through analyzeBuyer", () => {
  const base = { price: 450000, downPct: 20, annualRate: 6.5, termYears: 30, annualTaxRate: 0.52, annualInsurance: 1800, hoaMonthly: 0, closingCostPct: 3, monthlyRent: 2800, monthlyIncome: 0, appreciationPct: 3, holdYears: 5, maintenancePct: 1 };
  const p = buyerPriceForDSCR(base, 1.25);
  assert.ok(p !== null && p > 0 && p < 450000);
  const r = analyzeBuyer(Object.assign({}, base, { price: p }));
  assert.ok(Math.abs((r.dscr || 0) - 1.25) < 0.01);
});

test("HIGHER-or-LOWER: cash-on-cash and affordability solvers round-trip", () => {
  const base = { price: 450000, downPct: 20, annualRate: 6.5, termYears: 30, annualTaxRate: 0.52, annualInsurance: 1800, hoaMonthly: 0, closingCostPct: 3, monthlyRent: 2800, monthlyIncome: 10000, appreciationPct: 3, holdYears: 5, maintenancePct: 1 };
  const pc = buyerPriceForCashOnCash(base, 8);
  assert.ok(pc !== null && pc > 0);
  assert.ok(Math.abs((analyzeBuyer(Object.assign({}, base, { price: pc })).cashOnCash || 0) - 8) < 0.1);
  const pa = buyerPriceForAffordability(base, 28);
  assert.ok(pa !== null && pa > 0);
  // affordability verdict only applies in homebuyer mode (rent = 0)
  assert.ok(Math.abs((analyzeBuyer(Object.assign({}, base, { price: pa, monthlyRent: 0 })).affordabilityPct || 0) - 28) < 0.1);
});

test("HIGHER-or-LOWER: seller price solved for target net round-trips", () => {
  const s = { marketValue: 450000, mortgageBalance: 280000, commissionPct: 5.5, closingCostPct: 2, repairs: 5000, concessions: 0, originalPrice: 340000, yearsOwned: 6 };
  const p = sellerPriceForNet(s, 150000);
  assert.ok(p !== null && p > 450000);
  assert.ok(Math.abs(analyzeSeller(Object.assign({}, s, { marketValue: p })).netProceeds - 150000) < 1);
});

test("HIGHER-or-LOWER: game direction and gap", () => {
  assert.equal(priceGame(450000, 400000).direction, "lower");
  assert.equal(priceGame(380000, 400000).direction, "higher");
  assert.equal(priceGame(400000, 400000).direction, "at");
  assert.equal(priceGame(450000, null).gapPct, null);
});

test("public-record helpers: estimated tax and rate from county values", () => {
  assert.equal(estimatedAnnualTax(200000), 4200);
  const r = taxRatePctFromRecord(450000, 200000);
  assert.ok(r !== null && Math.abs(r - 0.9333) < 0.01);
  assert.equal(taxRatePctFromRecord(0, 200000), null);
});

test("fmtUSD formats", () => {
  assert.equal(fmtUSD(450000), "$450,000");
});