import test from 'node:test';
import assert from 'node:assert';

test('E2E Backend API Integration Tests', async (t) => {
  const BASE_URL = 'http://localhost:3000';

  await t.test('Root endpoint / returns HTML and 200', async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('<!DOCTYPE html>'));
  });

  await t.test('/api/auth/providers returns available auth options', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/providers`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(json && typeof json === 'object');
    // Ensure credentials or other providers are mapped
  });
});
