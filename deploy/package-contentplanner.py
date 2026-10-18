import tarfile, os

base = 'apps/contentplanner/apps/web'
# Monorepo standalone nests under apps/web/
standalone_root = os.path.join(base, '.next/standalone/apps/web')
if not os.path.isfile(os.path.join(standalone_root, 'server.js')):
    standalone_root = os.path.join(base, '.next/standalone')

print(f'Standalone root: {standalone_root}')
tf = tarfile.open('deploy-contentplanner.tar.gz', 'w:gz')
count = 0

for item in ['server.js', 'package.json', 'middleware.ts']:
    p = os.path.join(standalone_root, item)
    if os.path.isfile(p):
        tf.add(p, arcname=item)
        count += 1

next_dir = os.path.join(standalone_root, '.next')
if os.path.isdir(next_dir):
    for root, dirs, files in os.walk(next_dir):
        dirs[:] = [d for d in dirs if d not in ('cache',)]
        for f in files:
            full = os.path.join(root, f)
            tf.add(full, arcname=os.path.join('.next', os.path.relpath(full, next_dir)))
            count += 1

nm_dir = os.path.join(base, '.next/standalone/node_modules')
if os.path.isdir(nm_dir):
    for root, dirs, files in os.walk(nm_dir):
        for f in files:
            full = os.path.join(root, f)
            tf.add(full, arcname=os.path.join('node_modules', os.path.relpath(full, nm_dir)))
            count += 1

static_dir = os.path.join(base, '.next/static')
if os.path.isdir(static_dir):
    for root, dirs, files in os.walk(static_dir):
        for f in files:
            full = os.path.join(root, f)
            tf.add(full, arcname=os.path.join('.next', 'static', os.path.relpath(full, static_dir)))
            count += 1

pub_dir = os.path.join(base, 'public')
if os.path.isdir(pub_dir):
    for root, dirs, files in os.walk(pub_dir):
        for f in files:
            full = os.path.join(root, f)
            tf.add(full, arcname=os.path.join('public', os.path.relpath(full, pub_dir)))
            count += 1

prisma_dir = os.path.join(base, 'prisma')
if os.path.isdir(prisma_dir):
    for root, dirs, files in os.walk(prisma_dir):
        for f in files:
            full = os.path.join(root, f)
            tf.add(full, arcname=os.path.join('prisma', os.path.relpath(full, prisma_dir)))
            count += 1

tf.close()
sz = os.path.getsize('deploy-contentplanner.tar.gz') / 1024 / 1024
print(f'deploy-contentplanner.tar.gz: {sz:.1f} MB ({count} files)')
