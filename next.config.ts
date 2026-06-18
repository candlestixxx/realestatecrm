import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['libsql', '@libsql/client', '@prisma/adapter-libsql'],
};

export default nextConfig;
