import test from "node:test";
import assert from "node:assert/strict";

import { analyzeBuyer, analyzeSeller, monthlyPI, fmtUSD } from "../src/lib/calculators.ts";

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

test("fmtUSD formats", () => {
  assert.equal(fmtUSD(450000), "$450,000");
});