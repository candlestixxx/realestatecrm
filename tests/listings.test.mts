import test from 'node:test';
import assert from 'node:assert';

test('Property Listings Backend Unit Tests', async (t) => {
  await t.test('Missing credentials block listings GET endpoints with 401', async () => {
    // We are querying via Next.js router. The middleware does not explicitly list /api/listings in PROTECTED_API_PREFIXES,
    // so it allows the request to reach the API route. Inside the API route, getServerSession fails, returning a 401.
    const res = await fetch('http://localhost:3000/api/listings');
    assert.strictEqual(res.status, 401);
  });

  await t.test('Missing credentials block single listing GET endpoint with 401', async () => {
    const res = await fetch('http://localhost:3000/api/listings/12345');
    assert.strictEqual(res.status, 401);
  });
});
