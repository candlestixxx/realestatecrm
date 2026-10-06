/**
 * E2E Smoke Test Suite
 * Tests all service health and key API endpoints.
 * Run: node scripts/e2e-smoke.js
 */

const BASE_URL = process.env.CRM_URL || 'http://localhost:3000';
const LEADG_URL = process.env.LEADG_URL || 'http://localhost:3001';
const FORECLOSURE_URL = process.env.FORECLOSURE_URL || 'http://localhost:3002';
const CONTENT_URL = process.env.CONTENT_URL || 'http://localhost:3003';
const MEDIA_URL = process.env.MEDIA_URL || 'http://localhost:3004';
const LEGACY_WEB_URL = process.env.LEGACY_WEB_URL || 'http://localhost:3005';
const LEGACY_API_URL = process.env.LEGACY_API_URL || 'http://localhost:3006';
const AUDIO_URL = process.env.AUDIO_URL || 'http://localhost:8090';

const results = [];

async function test(name, url, expectedStatus = [200, 307, 302, 308, 401, 404]) {
  try {
    const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(10000) });
    const ok = expectedStatus.includes(res.status);
    results.push({ name, url, status: res.status, pass: ok });
    console.log(ok ? '  PASS' : '  FAIL', name, `(${res.status})`);
  } catch (err) {
    results.push({ name, url, status: 'ERR', pass: false, error: err.message });
    console.log('  FAIL', name, `(${err.message})`);
  }
}

async function run() {
  console.log('\n=== Service Health ===');
  await test('Main CRM', BASE_URL);
  await test('LeadG', LEADG_URL);
  await test('Foreclosure', FORECLOSURE_URL);
  await test('ContentPlanner', CONTENT_URL);
  await test('MediaWorkflow', MEDIA_URL);
  await test('LegacyLeads Web', LEGACY_WEB_URL);
  await test('LegacyLeads API', LEGACY_API_URL);
  await test('Live Audio WS', AUDIO_URL);

  console.log('\n=== SEO ===');
  await test('Sitemap', BASE_URL + '/sitemap.xml');
  await test('Robots', BASE_URL + '/robots.txt');

  console.log('\n=== API Endpoints (auth-gated = 401 expected) ===');
  await test('Chat rooms API', BASE_URL + '/api/chat/rooms', [200, 401]);
  await test('Chat messages API', BASE_URL + '/api/chat/messages', [200, 401]);
  await test('AI memory settings', BASE_URL + '/api/ai/memory-settings', [200, 401]);
  await test('Sync queue API', BASE_URL + '/api/sync-queue', [200, 401]);
  await test('Integrations trigger', BASE_URL + '/api/integrations/trigger/voice', [200, 401, 405]);

  console.log('\n=== Sub-service APIs ===');
  await test('LeadG A/B test API', LEADG_URL + '/api/campaigns/ab-test', [200, 307, 302]);
  await test('LegacyLeads health', LEGACY_API_URL + '/health');
  await test('LegacyLeads listings', LEGACY_API_URL + '/listings');

  console.log('\n=== Dashboard Pages (auth redirect = 307 expected) ===');
  await test('Dashboard', BASE_URL + '/dashboard');
  await test('Help Center', BASE_URL + '/dashboard/help-center', [200, 307]);
  await test('AI Memory Settings', BASE_URL + '/dashboard/settings/ai-memory', [200, 307]);

  // Summary
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`\n=== Results: ${passed} passed, ${failed} failed out of ${results.length} ===`);
  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.pass).forEach(r => console.log(`  - ${r.name}: ${r.status} ${r.error || ''}`));
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Smoke test runner error:', err);
  process.exit(1);
});
