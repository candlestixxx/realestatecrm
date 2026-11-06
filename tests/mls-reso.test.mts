import test from "node:test";
import assert from "node:assert/strict";

import { normalizeResoListing } from "../src/lib/reso-normalize.ts";
import { commissionForListing, buyerConcessionForListing, clampCommissionBps, DEFAULT_COMMISSION_BPS } from "../src/lib/commission.ts";

test("normalizeResoListing maps RESO fields to Listing", () => {
  const n = normalizeResoListing({
    ListingId: "MLS-1", StandardStatus: "Active", ListPrice: 425000,
    StreetNumber: "123", StreetName: "Elm", StreetSuffix: "St",
    City: "Sterling Heights", StateOrProvince: "MI", PostalCode: "48313",
    BedroomsTotal: 4, BathroomsTotalDecimal: 2.5, LivingArea: 2400,
    YearBuilt: 1998, PropertyType: "Residential", PublicRemarks: "Nice",
    ListAgentKey: "AGENT-9", ListingContractDate: "2026-01-15",
    Media: [{ MediaURL: "https://x/1.jpg" }],
  });
  assert.equal(n.mlsNumber, "MLS-1");
  assert.equal(n.status, "ACTIVE");
  assert.equal(n.address, "123 Elm St");
  assert.equal(n.listPrice, 425000);
  assert.equal(n.bedrooms, 4);
  assert.equal(n.bathrooms, 2.5);
  assert.equal(n.listAgentMlsId, "AGENT-9");
  assert.ok(n.photos?.includes("https://x/1.jpg"));
});

test("normalizeResoListing maps Closed to SOLD with ClosePrice", () => {
  const n = normalizeResoListing({ ListingKey: "K2", StandardStatus: "Closed", ClosePrice: 395000, CloseDate: "2026-02-01" });
  assert.equal(n.status, "SOLD");
  assert.equal(n.soldPrice, 395000);
});

test("normalizeResoListing rejects missing listing id", () => {
  assert.throws(() => normalizeResoListing({ ListPrice: 1 }), /Missing ListingId/);
});

test("commission defaults to 3% and honors per-listing override", () => {
  assert.equal(DEFAULT_COMMISSION_BPS, 300);
  assert.equal(commissionForListing({ listPrice: 400000, soldPrice: null, commissionBps: null }), 12000);
  assert.equal(commissionForListing({ listPrice: 400000, soldPrice: null, commissionBps: 250 }), 10000);
  assert.equal(commissionForListing({ listPrice: 400000, soldPrice: 410000, commissionBps: 300 }), 12300);
});

test("buyer concession is separate and bps are clamped", () => {
  assert.equal(buyerConcessionForListing({ listPrice: 400000, buyerConcessionBps: 100 }), 4000);
  assert.equal(clampCommissionBps(99999), 1000);
  assert.equal(clampCommissionBps(-5), 0);
  assert.equal(clampCommissionBps("nope"), 300);
});
