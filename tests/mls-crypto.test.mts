import test from "node:test";
import assert from "node:assert/strict";

process.env.MLS_ENC_KEY = Buffer.alloc(32, 7).toString("base64");
const { encryptSecret, decryptSecret, maskSecret } = await import("../src/lib/mls-crypto.ts");

test("MLS secret encrypts at rest and decrypts server-side only", () => {
  const enc = encryptSecret("realcomp-token-1234");
  assert.ok(!enc.includes("realcomp-token"));
  assert.equal(decryptSecret(enc), "realcomp-token-1234");
  assert.equal(maskSecret("realcomp-token-1234"), "****1234");
});

test("tampered MLS payload is rejected", () => {
  const enc = encryptSecret("abc12345");
  assert.throws(() => decryptSecret(enc.slice(0, -2) + "xx"));
});