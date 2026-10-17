import tarfile, os

# Package LeadG standalone for Hetzner deploy
base = 'apps/leadg'
tf = tarfile.open('deploy-leadg.tar.gz', 'w:gz')
count = 0

# 1. Core server files
for item in ['server.js', 'package.json', 'middleware.ts']:
    p = os.path.join(base, '.next/standalone', item)
    if os.path.isfile(p):
        tf.add(p, arcname=item)
        count += 1

# 2. The .next build directory
next_dir = os.path.join(base, '.next/standalone', '.next')
if os.path.isdir(next_dir):
    for root, dirs, files in os.walk(next_dir):
        dirs[:] = [d for d in dirs if d not in ('cache',)]
        for f in files:
            full = os.path.join(root, f)
            arc = os.path.join('.next', os.path.relpath(full, next_dir))
            tf.add(full, arcname=arc)
            count += 1

# 2b. node_modules from standalone
nm_dir = os.path.join(base, '.next/standalone', 'node_modules')
if os.path.isdir(nm_dir):
    for root, dirs, files in os.walk(nm_dir):
        for f in files:
            full = os.path.join(root, f)
            arc = os.path.join('node_modules', os.path.relpath(full, nm_dir))
            tf.add(full, arcname=arc)
            count += 1

# 3. Static client assets
static_dir = os.path.join(base, '.next/static')
if os.path.isdir(static_dir):
    for root, dirs, files in os.walk(static_dir):
        for f in files:
            full = os.path.join(root, f)
            arc = os.path.join('static', os.path.relpath(full, static_dir))
            tf.add(full, arcname=arc)
            count += 1

# 4. Public assets
pub_dir = os.path.join(base, 'public')
if os.path.isdir(pub_dir):
    for root, dirs, files in os.walk(pub_dir):
        for f in files:
            full = os.path.join(root, f)
            arc = os.path.join('public', os.path.relpath(full, pub_dir))
            tf.add(full, arcname=arc)
            count += 1

# 5. Prisma
prisma_dir = os.path.join(base, 'prisma')
if os.path.isdir(prisma_dir):
    for root, dirs, files in os.walk(prisma_dir):
        for f in files:
            full = os.path.join(root, f)
            tf.add(full, arcname=os.path.join('prisma', os.path.relpath(full, prisma_dir)))
            count += 1

tf.close()
sz = os.path.getsize('deploy-leadg.tar.gz') / 1024 / 1024
print(f'deploy-leadg.tar.gz: {sz:.1f} MB ({count} files)')
