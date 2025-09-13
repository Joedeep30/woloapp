
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        hostname: "images.pexels.com",
      },
      {
        hostname: "images.unsplash.com",
      },
    ],
  },
  
  poweredByHeader: false,
  compress: true,
  generateEtags: false,
  
  serverExternalPackages: ['bcryptjs'],
  
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  
  cleanDistDir: true,
  productionBrowserSourceMaps: false,
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Turbopack configuration for externals
  ...(process.env.NODE_ENV === 'development' ? {
    experimental: {
      serverComponentsExternalPackages: ['bcryptjs']
    }
  } : {}),
};

export default nextConfig;

