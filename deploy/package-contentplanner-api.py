import tarfile, os

# Package the ContentPlanner monorepo SOURCE for the Express API deployment.
#
# Why source (not standalone): the API (packages/api) is a TypeScript Express
# + WebSocket server run via tsx — it is not part of the Next.js standalone
# bundle. On the server `npm install` fetches Linux-native binaries (Prisma
# engines included) and `prisma generate` builds the client for debian.
#
# Excludes node_modules/.next/dist to keep the tarball lean.

base = 'apps/contentplanner'
tf = tarfile.open('deploy-contentplanner-api.tar.gz', 'w:gz')
count = 0

# Root workspace manifests
for item in ['package.json', 'package-lock.json', 'tsconfig.json', 'turbo.json', 'jest.config.js']:
    p = os.path.join(base, item)
    if os.path.isfile(p):
        tf.add(p, arcname=item)
        count += 1

# All workspace packages (source only) — the api imports @contentcommand/*
# siblings (database, ai, social, billing, analytics, jobs, shared, config)
packages_root = os.path.join(base, 'packages')
for pkg in sorted(os.listdir(packages_root)) if os.path.isdir(packages_root) else []:
    pkg_dir = os.path.join(packages_root, pkg)
    if not os.path.isdir(pkg_dir):
        continue
    for root, dirs, files in os.walk(pkg_dir):
        dirs[:] = [d for d in dirs if d not in ('node_modules', 'dist', '.next')]
        for f in files:
            full = os.path.join(root, f)
            tf.add(full, arcname=os.path.join('packages', pkg, os.path.relpath(full, pkg_dir)))
            count += 1

tf.close()
sz = os.path.getsize('deploy-contentplanner-api.tar.gz') / 1024 / 1024
print(f'deploy-contentplanner-api.tar.gz: {sz:.1f} MB ({count} files)')
