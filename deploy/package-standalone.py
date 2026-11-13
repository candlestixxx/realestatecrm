"""Package a Next.js standalone build into a deploy tarball.

Usage: python deploy/package-standalone.py <app-dir> <out.tar.gz>
Example: python deploy/package-standalone.py apps/leadcaller deploy-leadcaller.tar.gz

Why this exists (bug fixed): Turbopack places hashed external packages
(e.g. .next/node_modules/@modelcontextprotocol/sdk-<hash>) inside the
standalone .next directory as SYMLINKED directories. A naive os.walk()
does not descend into symlinked dirs, so those packages silently never
made the tarball and the deployed app 500'd with ERR_MODULE_NOT_FOUND.
This packager walks with followlinks=True and dereferences symlinks so
the tarball always contains the real files. Regression-covered by
tests/deploy-package.test.mts.
"""
import os
import sys
import tarfile


def add_tree(tf, base_dir, arc_prefix, exclude_dirs=()):
    for root, dirs, files in os.walk(base_dir, followlinks=True):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for f in files:
            full = os.path.join(root, f)
            arc = os.path.join(arc_prefix, os.path.relpath(full, base_dir))
            tf.add(full, arcname=arc)


def main():
    base, tarname = sys.argv[1], sys.argv[2]
    # dereference=True: store real file content for symlinked dirs/files.
    tf = tarfile.open(tarname, 'w:gz', dereference=True)
    count = 0

    for item in ['server.js', 'package.json', 'middleware.ts']:
        p = os.path.join(base, '.next/standalone', item)
        if os.path.isfile(p):
            tf.add(p, arcname=item)
            count += 1

    # .next from standalone (includes .next/node_modules hashed externals)
    next_dir = os.path.join(base, '.next/standalone', '.next')
    if os.path.isdir(next_dir):
        before = count
        for root, dirs, files in os.walk(next_dir, followlinks=True):
            dirs[:] = [d for d in dirs if d not in ('cache',)]
            for f in files:
                full = os.path.join(root, f)
                arc = os.path.join('.next', os.path.relpath(full, next_dir))
                tf.add(full, arcname=arc)
                count += 1
        assert count > before

    # standalone node_modules (traced minimal deps)
    nm_dir = os.path.join(base, '.next/standalone', 'node_modules')
    if os.path.isdir(nm_dir):
        for root, dirs, files in os.walk(nm_dir, followlinks=True):
            for f in files:
                full = os.path.join(root, f)
                arc = os.path.join('node_modules', os.path.relpath(full, nm_dir))
                tf.add(full, arcname=arc)
                count += 1

    # static client assets must live at .next/static for standalone server
    static_dir = os.path.join(base, '.next/static')
    if os.path.isdir(static_dir):
        for root, dirs, files in os.walk(static_dir):
            for f in files:
                full = os.path.join(root, f)
                arc = os.path.join('.next', 'static', os.path.relpath(full, static_dir))
                tf.add(full, arcname=arc)
                count += 1

    # public assets
    pub = os.path.join(base, 'public')
    if os.path.isdir(pub):
        for root, dirs, files in os.walk(pub):
            for f in files:
                full = os.path.join(root, f)
                tf.add(full, arcname=os.path.relpath(full, base))
                count += 1

    # prisma schema (never ship local sqlite files)
    prisma_dir = os.path.join(base, 'prisma')
    if os.path.isdir(prisma_dir):
        for root, dirs, files in os.walk(prisma_dir):
            for f in files:
                if f.endswith(('.db', '.db-journal', '.db-wal', '.db-shm')):
                    continue
                full = os.path.join(root, f)
                tf.add(full, arcname=os.path.join('prisma', os.path.relpath(full, prisma_dir)))
                count += 1

    tf.close()
    size = os.path.getsize(tarname) / 1024 / 1024
    print(f'{tarname}: {size:.1f} MB ({count} files)')


if __name__ == '__main__':
    main()
