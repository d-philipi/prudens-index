import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@prudens/shared', '@prudens/domain-metrics'],
};

export default nextConfig;
