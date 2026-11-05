import tarfile, os

base = 'apps/media-workflow'
tf = tarfile.open('deploy-media-workflow.tar.gz', 'w:gz')
count = 0

# Package dist/ and package.json
for item in ['dist', 'package.json', 'package-lock.json']:
    p = os.path.join(base, item)
    if os.path.isfile(p):
        tf.add(p, arcname=item)
        count += 1
    elif os.path.isdir(p):
        for root, dirs, files in os.walk(p):
            for f in files:
                full = os.path.join(root, f)
                tf.add(full, arcname=os.path.relpath(full, base))
                count += 1

tf.close()
sz = os.path.getsize('deploy-media-workflow.tar.gz') / 1024 / 1024
print(f'deploy-media-workflow.tar.gz: {sz:.1f} MB ({count} files)')
