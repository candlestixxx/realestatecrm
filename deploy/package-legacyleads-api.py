import tarfile, os

# Packs the legacyleads Express backend for source-based Hetzner deploys.
# node_modules are NOT packed (the deploy script runs npm install on the
# server); migrations/ ARE packed (applied with psql during deploy).
base = 'apps/legacyleads/backend'

tf = tarfile.open('deploy-legacyleads-api.tar.gz', 'w:gz')
count = 0

for item in ['package.json', 'package-lock.json', 'tsconfig.json']:
    p = os.path.join(base, item)
    if os.path.isfile(p):
        tf.add(p, arcname=item)
        count += 1

for dirname in ['src', 'migrations']:
    d = os.path.join(base, dirname)
    for root, dirs, files in os.walk(d):
        dirs[:] = [d for d in dirs if d not in ('node_modules', '__tests__')]
        for f in files:
            full = os.path.join(root, f)
            tf.add(full, arcname=os.path.relpath(full, base))
            count += 1

tf.close()
sz = os.path.getsize('deploy-legacyleads-api.tar.gz') / 1024 / 1024
print(f'deploy-legacyleads-api.tar.gz: {sz:.1f} MB ({count} files)')
