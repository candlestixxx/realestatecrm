/**
 * Load Test Suite — concurrent request smoke test.
 * Run: node scripts/load-test.js [concurrency] [requests]
 * Example: node scripts/load-test.js 10 100
 */

const CONCURRENCY = parseInt(process.argv[2] || '10', 10);
const TOTAL = parseInt(process.argv[3] || '50', 10);
const BASE_URL = process.env.CRM_URL || 'http://localhost:3000';

const ENDPOINTS = [
  { name: 'Landing', url: BASE_URL + '/', expected: 200 },
  { name: 'Sitemap', url: BASE_URL + '/sitemap.xml', expected: 200 },
  { name: 'Robots', url: BASE_URL + '/robots.txt', expected: 200 },
  { name: 'Dashboard', url: BASE_URL + '/dashboard', expected: [200, 307] },
  { name: 'Help Center', url: BASE_URL + '/dashboard/help-center', expected: [200, 307] },
  { name: 'Chat API', url: BASE_URL + '/api/chat/rooms', expected: [200, 401] },
  { name: 'AI Memory API', url: BASE_URL + '/api/ai/memory-settings', expected: [200, 401] },
];

async function hit(endpoint) {
  const start = Date.now();
  try {
    const res = await fetch(endpoint.url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
    });
    const ms = Date.now() - start;
    const statuses = Array.isArray(endpoint.expected) ? endpoint.expected : [endpoint.expected];
    return { ok: statuses.includes(res.status), status: res.status, ms };
  } catch (err) {
    return { ok: false, status: 'ERR', ms: Date.now() - start, error: err.message };
  }
}

async function runEndpoint(ep) {
  const results = [];
  const batches = Math.ceil(TOTAL / CONCURRENCY);
  for (let b = 0; b < batches; b++) {
    const batch = Array.from({ length: Math.min(CONCURRENCY, TOTAL - b * CONCURRENCY) }, () => hit(ep));
    results.push(...await Promise.all(batch));
  }
  const passed = results.filter(r => r.ok).length;
  const times = results.map(r => r.ms).sort((a, b) => a - b);
  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];
  return { name: ep.name, passed, failed: results.length - passed, p50, p95, p99, total: results.length };
}

async function run() {
  console.log(`Load test: ${TOTAL} requests per endpoint, concurrency ${CONCURRENCY}`);
  console.log(`Target: ${BASE_URL}\n`);
  console.log('Endpoint'.padEnd(20) + 'Pass'.padEnd(6) + 'Fail'.padEnd(6) + 'p50'.padEnd(6) + 'p95'.padEnd(6) + 'p99');
  console.log('─'.repeat(50));

  let totalFail = 0;
  for (const ep of ENDPOINTS) {
    const r = await runEndpoint(ep);
    totalFail += r.failed;
    console.log(
      r.name.padEnd(20) +
      String(r.passed).padEnd(6) +
      String(r.failed).padEnd(6) +
      (r.p50 + 'ms').padEnd(6) +
      (r.p95 + 'ms').padEnd(6) +
      (r.p99 + 'ms')
    );
  }

  console.log('\n' + (totalFail === 0 ? 'ALL PASS' : totalFail + ' FAILURES'));
  if (totalFail > 0) process.exit(1);
}

run().catch(err => {
  console.error('Load test runner error:', err);
  process.exit(1);
});
