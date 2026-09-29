/** @type {import('next').NextConfig} */
let isNext16OrAbove = false;
try {
  const nextVersion = require('next/package.json').version;
  isNext16OrAbove = parseInt(nextVersion.split('.')[0], 10) >= 16;
} catch {
  // fallback
}

const nextConfig = {
  ...(isNext16OrAbove ? { turbopack: {} } : {}),
  webpack: (config, { dev }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

module.exports = nextConfig;
