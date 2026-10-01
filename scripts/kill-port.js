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
 * Usage: node scripts/kill-port.js [port]   (default 3000)
 */

const { execSync, execFileSync } = require('child_process');

const port = process.argv[2] || '3000';

function log(msg) {
  // Quiet by default; set KILL_PORT_VERBOSE=1 for diagnostics.
  if (process.env.KILL_PORT_VERBOSE) console.log(`[kill-port] ${msg}`);
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

if (process.platform === 'win32') {
  killWindows(port);
} else {
  killPosix(port);
}
