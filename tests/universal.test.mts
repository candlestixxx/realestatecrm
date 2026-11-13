import test from "node:test";
import assert from "node:assert/strict";
import { SECTOR_PACKS, getSectorPack, validateSectorPack } from "../src/lib/universal/sectors.ts";
import { LANGUAGES, ADD_ONS, addOnsForSector, t } from "../src/lib/universal/platform.ts";

test("8 launch sector packs, all valid", () => {
  assert.equal(SECTOR_PACKS.length, 8);
  for (const p of SECTOR_PACKS) assert.deepEqual(validateSectorPack(p), [], p.id);
});

test("real estate is pack #1 with TSF template", () => {
  const re = getSectorPack("real-estate");
  assert.equal(re.customer, "Client");
  assert.ok(re.templates.some((x) => x.includes("TSF")));
  assert.equal(getSectorPack("nope").id, "real-estate");
});

test("languages cover RTL and fall back to English", () => {
  assert.ok(LANGUAGES.length >= 16);
  assert.equal(LANGUAGES.find((l) => l.code === "ar")?.rtl, true);
  assert.equal(t("es", "welcome"), "Bienvenido");
  assert.equal(t("xx", "welcome"), "Welcome");
});

test("add-ons are United Beats and sector-filtered", () => {
  assert.ok(ADD_ONS.every((a) => a.byUnitedBeats));
  assert.ok(addOnsForSector("retail").some((a) => a.id === "commerce-sync"));
  assert.ok(!addOnsForSector("legal").some((a) => a.id === "commerce-sync"));
  assert.ok(addOnsForSector("finance").some((a) => a.id === "trust-tsf"));
});
