/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static image imports from assets folder
  images: {
    remotePatterns: [],
    unoptimized: true, // For static export compatibility
  },
  // Configure webpack for compatibility
  webpack: (config, { isServer }) => {
    config.externals = [...(config.externals || []), 'bcrypt'];
    
    // Ignore native modules in client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;
