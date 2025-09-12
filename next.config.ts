
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
  
  // Configuration simplifiée pour éviter les processus bloqués
  poweredByHeader: false,
  compress: true,
  generateEtags: false,
  
  // Packages externes pour les composants serveur
  serverExternalPackages: ['bcryptjs'],
  
  // Configuration ESLint et TypeScript
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Configuration pour nettoyer les ressources
  cleanDistDir: true,
  
  // Configuration pour optimiser les builds
  productionBrowserSourceMaps: false,
  
  // Configuration pour optimiser la compilation
  swcMinify: true,
  
  // Configuration pour éviter les processus infinis
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  
  // NOUVEAU : Configuration pour éviter les processus bloqués
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs'],
  },
  
  // Configuration webpack pour éviter les processus bloqués
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('bcryptjs');
    }
    return config;
  },
};

export default nextConfig;
