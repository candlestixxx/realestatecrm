// Regression test for deploy/package-standalone.py (the LeadCaller MCP 500).
//
// Bug: Turbopack puts hashed external packages inside the standalone
// .next/node_modules as symlinked directories. The old packager walked
// without followlinks, so those packages never made the tarball and the
// deployed app failed with ERR_MODULE_NOT_FOUND for
// '@modelcontextprotocol/sdk-<hash>/types.js'.
//
// This test builds a fake standalone tree with a symlinked hashed
// external, runs the real packager, and asserts the real file content
// (not a dangling symlink) is inside the tarball. No server is started;
// it only exercises the packaging tool. Skips cleanly without python.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function hasPython(): boolean {
  try {
    execFileSync('python', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

test('standalone packager includes symlinked hashed externals (dereferenced)', (t) => {
  if (!hasPython()) {
    t.skip('python not available');
    return;
  }
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pkg-test-'));
  try {
    const app = path.join(root, 'app');
    const realPkg = path.join(root, 'realpkg');
    fs.mkdirSync(path.join(app, '.next', 'standalone', '.next', 'server'), { recursive: true });
    fs.mkdirSync(path.join(app, '.next', 'static'), { recursive: true });
    fs.mkdirSync(realPkg, { recursive: true });
    fs.writeFileSync(path.join(app, '.next', 'standalone', 'server.js'), '// fake');
    fs.writeFileSync(path.join(app, '.next', 'standalone', 'package.json'), '{}');
    fs.writeFileSync(path.join(realPkg, 'types.js'), 'export const marker = 42;');

    const linkDir = path.join(app, '.next', 'standalone', '.next', 'node_modules', '@scope');
    fs.mkdirSync(linkDir, { recursive: true });
    const linkPath = path.join(linkDir, 'sdk-deadbeef12345678');
    try {
      fs.symlinkSync(realPkg, linkPath, 'junction');
    } catch {
      t.skip('symlink creation not permitted on this host');
      return;
    }

    const out = path.join(root, 'out.tar.gz');
    execFileSync('python', ['deploy/package-standalone.py', app, out], { stdio: 'pipe' });

    const listing = execFileSync('python', [
      '-c',
      'import tarfile,sys; print(chr(10).join(tarfile.open(sys.argv[1]).getnames()))',
      out,
    ]).toString();
    assert.match(listing, /\.next[/\\]node_modules[/\\]@scope[/\\]sdk-deadbeef12345678[/\\]types\.js/);

    const content = execFileSync('python', [
      '-c',
      'import tarfile,sys; tf=tarfile.open(sys.argv[1]); n=[x for x in tf.getnames() if x.endswith("types.js")][0]; print(tf.extractfile(n).read().decode())',
      out,
    ]).toString();
    assert.match(content, /marker = 42/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
