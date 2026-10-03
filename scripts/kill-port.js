/**
 * kill-port.js — cross-platform port liberator.
 *
 * Why: package.json predev/prebuild/prestart hooks used the `kill-port`
 * npm package, which was not installed and is unavailable in this
 * environment (registry SSL failure). This zero-dependency script uses
 * `taskkill` on Windows and `lsof`/`fuser` on POSIX to free a port
 * before the next server binds it. Never throws — a missing process is
 * a success condition.
 *
 * Health gate (2026-10-01): before killing anything, probe the port over
 * HTTP. If a healthy process answers, SKIP the kill unless KILL_PORT_FORCE=1.
 * This prevents `npm run build` (or any script that transitively triggers a
 * pre* hook) from murdering a perfectly healthy running server.
 *
 * Usage: node scripts/kill-port.js [port]   (default 3000)
 *        KILL_PORT_FORCE=1 node scripts/kill-port.js 3000   (override gate)
 */

const { execSync, execFileSync } = require('child_process');
const http = require('http');

const port = process.argv[2] || '3000';
const FORCE = !!process.env.KILL_PORT_FORCE;

function log(msg) {
  // Quiet by default; set KILL_PORT_VERBOSE=1 for diagnostics.
  if (process.env.KILL_PORT_VERBOSE) console.log(`[kill-port] ${msg}`);
}

/**
 * Quick HTTP probe: does the port answer with any HTTP status?
 * If yes, a healthy server is there and we should leave it alone.
 * Resolves true = healthy, false = stale or nothing listening.
 */
function probeHealthy(p) {
  return new Promise((resolve) => {
    const req = http.get({ host: '127.0.0.1', port: p, path: '/', timeout: 1500 }, (res) => {
      res.resume();
      resolve(true); // Any HTTP response means a live server.
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

function killWindows(p) {
  // Find PIDs listening on the port, then kill each by PID (surgical,
  // never `taskkill /F /IM node.exe` — that would murder unrelated work).
  try {
    const out = execSync(`netstat -ano | findstr :${p}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      // Lines look like:  TCP    0.0.0.0:3000  0.0.0.0:0  LISTENING  12345
      const m = line.match(/\s+(\d+)\s*$/);
      if (m && /LISTENING|ESTABLISHED/i.test(line)) pids.add(m[1]);
    }
    for (const pid of pids) {
      if (pid === '0') continue;
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        log(`killed PID ${pid} on port ${p}`);
      } catch {
        // process already gone
      }
    }
  } catch {
    log(`no listener found on :${p}`);
  }
}

function killPosix(p) {
  for (const cmd of [`lsof -ti :${p}`, `fuser ${p}/tcp`]) {
    try {
      const out = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      const pids = out.trim().split(/\s+/).filter(Boolean);
      for (const pid of pids) {
        try {
          process.kill(Number(pid), 'SIGKILL');
          log(`killed PID ${pid} on port ${p}`);
        } catch {
          // already gone
        }
      }
      if (pids.length) return;
    } catch {
      // try next method
    }
  }
  log(`no listener found on :${p}`);
}

// Health gate: if a healthy server is already listening and we're not
// being forced, skip the kill so builds/restarts don't murder live work.
async function main() {
  if (!FORCE) {
    const healthy = await probeHealthy(port);
    if (healthy) {
      log(`port ${port} has a healthy server — skipping kill (set KILL_PORT_FORCE=1 to override)`);
      return;
    }
  }
  if (process.platform === 'win32') {
    killWindows(port);
  } else {
    killPosix(port);
  }
}

main();
