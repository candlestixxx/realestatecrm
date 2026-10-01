import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  typescript: {
    ignoreBuildErrors: true,
  },
  // Pin the workspace root explicitly. Next 16 Turbopack otherwise walks up
  // and picks up unrelated lockfiles in parent directories (pnpm-workspace.yaml
  // in ~/workspace), which breaks module resolution for the app directory.
  turbopack: {
    root: path.join(__dirname),
  },
  // Keep submodule apps out of the main bundle — they are independent
  // projects mounted as git submodules, not Next.js route groups.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
