import tarfile, os

# Only package the actual server build essentials
# The standalone output at .next/standalone should have server.js + .next/ + minimal node_modules
# But this project's standalone includes the entire root — extract only what's needed

tf = tarfile.open('deploy-v3.tar.gz', 'w:gz')
count = 0

# 1. Core server files from standalone
for item in ['server.js', 'package.json', 'middleware.ts']:
    p = os.path.join('.next/standalone', item)
    if os.path.isfile(p):
        tf.add(p, arcname=item)
        count += 1

# 2. The .next build directory (server-side rendered pages + chunks)
next_dir = os.path.join('.next/standalone', '.next')
if os.path.isdir(next_dir):
    for root, dirs, files in os.walk(next_dir):
        dirs[:] = [d for d in dirs if d not in ('cache',)]
        for f in files:
            full = os.path.join(root, f)
            arc = os.path.join('.next', os.path.relpath(full, next_dir))
            tf.add(full, arcname=arc)
            count += 1

# 2b. Minimal node_modules from standalone (Prisma engine, etc.)
nm_dir = os.path.join('.next/standalone', 'node_modules')
if os.path.isdir(nm_dir):
    for root, dirs, files in os.walk(nm_dir):
        for f in files:
            full = os.path.join(root, f)
            arc = os.path.join('node_modules', os.path.relpath(full, nm_dir))
            tf.add(full, arcname=arc)
            count += 1

# 3. Static client assets — must go to .next/static/ for standalone server to serve them
for root, dirs, files in os.walk('.next/static'):
    for f in files:
        full = os.path.join(root, f)
        arc = os.path.join('.next', 'static', os.path.relpath(full, '.next/static'))
        tf.add(full, arcname=arc)
        count += 1

# 4. Public assets
if os.path.isdir('public'):
    for root, dirs, files in os.walk('public'):
        for f in files:
            full = os.path.join(root, f)
            arc = os.path.join('public', os.path.relpath(full, 'public'))
            tf.add(full, arcname=arc)
            count += 1

# 5. Prisma schema + migrations
for root, dirs, files in os.walk('prisma'):
    for f in files:
        full = os.path.join(root, f)
        tf.add(full, arcname=os.path.relpath(full, '.'))
        count += 1

tf.close()
sz = os.path.getsize('deploy-v3.tar.gz') / 1024 / 1024
print(f'deploy-v3.tar.gz: {sz:.1f} MB ({count} files)')
