/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
  experimental: {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: '**'
        },
        {
          protocol: 'http',
          hostname: '**'
        }
      ]
    },
    scrollRestoration: true
  },
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'firebasestorage.googleapis.com',
      'i.imgur.com',
      'i.seadn.io'
    ]
  }
};

module.exports = nextConfig;
