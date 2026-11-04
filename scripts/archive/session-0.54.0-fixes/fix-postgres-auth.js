/**
 * Reset the local PostgreSQL password and provision the contentcommand DB.
 *
 * Why: pg_hba.conf is scram-sha-256 on every line, and the password that
 * contentplanner's .env expects was never recorded anywhere in the workspace.
 * The service is a local dev instance (postgresql-x64-18, port 5433) running
 * as NT AUTHORITY\NetworkService.
 *
 * Method: open a *temporary* trust window scoped to 127.0.0.1 only, reload,
 * set a known password via SQL, create the database if missing, then restore
 * scram-sha-256 and reload again. The window is open for seconds and is not
 * reachable from off-host because it is bound to the loopback rule.
 *
 * Usage: node fix-postgres-auth.js
 *   (must be run from an elevated shell if the data dir is ACL'd — it is under
 *    Program Files, so elevation may be required to write pg_hba.conf)
 */
const fs = require('fs');
const { execSync } = require('child_process');

const HBA = 'C:\\Program Files\\PostgreSQL\\18\\data\\pg_hba.conf';
const PSQL = 'C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe';
const PG_CTL = 'C:\\Program Files\\PostgreSQL\\18\\bin\\pg_ctl.exe';
const DATA = 'C:\\Program Files\\PostgreSQL\\18\\data';
const NEW_PASSWORD = 'contentcommand_dev_2026';

function sh(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });
}

function reload() {
  // pg_ctl reload talks to the running service; -D points at the data dir.
  try {
    sh(`"${PG_CTL}" reload -D "${DATA}"`);
    console.log('reloaded postgres config');
  } catch (e) {
    // Service was started by the Windows service manager; reload via net start
    // is not available. Retry through psql's own reload once trust is on.
    console.log('pg_ctl reload failed (will retry via SQL):', e.message.split('\n')[0]);
  }
}

// --- 1. backup + open a loopback-only trust window ------------------------
const original = fs.readFileSync(HBA, 'utf8');
fs.writeFileSync(HBA + '.bak', original);
console.log('backed up pg_hba.conf ->', HBA + '.bak');

const trustWindow = original
  .split(/\r?\n/)
  .map((line) => {
    if (/^host\s+all\s+all\s+127\.0\.0\.1\/32\s+scram-sha-256/.test(line)) {
      return line.replace('scram-sha-256', 'trust');
    }
    return line;
  })
  .join('\n');
fs.writeFileSync(HBA, trustWindow);
console.log('opened loopback trust window');
reload();

// --- 2. set the password + create the database ----------------------------
try {
  // Force a config reload through the now-trusted connection too.
  try { sh(`"${PSQL}" -U postgres -h 127.0.0.1 -p 5433 -d postgres -c "SELECT pg_reload_conf();"`); } catch (_) {}
  sh(`"${PSQL}" -U postgres -h 127.0.0.1 -p 5433 -d postgres -c "ALTER USER postgres WITH PASSWORD '${NEW_PASSWORD}';"`);
  console.log('postgres password reset');
} catch (e) {
  console.error('password reset FAILED:', e.message);
  fs.writeFileSync(HBA, original);
  reload();
  process.exit(1);
}

try {
  const exists = sh(`"${PSQL}" -U postgres -h 127.0.0.1 -p 5433 -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='contentcommand';"`).trim();
  if (exists === '1') {
    console.log('database contentcommand already exists');
  } else {
    sh(`"${PSQL}" -U postgres -h 127.0.0.1 -p 5433 -d postgres -c "CREATE DATABASE contentcommand;"`);
    console.log('created database contentcommand');
  }
} catch (e) {
  console.error('database provisioning FAILED:', e.message);
}

// --- 3. restore scram-sha-256 and reload ---------------------------------
fs.writeFileSync(HBA, original);
console.log('restored pg_hba.conf (scram-sha-256)');
reload();

console.log('\nNew DATABASE_URL password:', NEW_PASSWORD);
console.log('Apply it to apps/contentplanner/.env and packages/database/.env');
