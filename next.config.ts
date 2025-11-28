import type { NextConfig } from "next";

type ExtendedNextConfig = NextConfig & {
  serverActions?: {
    bodySizeLimit?: string;
  };
};

const nextConfig: ExtendedNextConfig = {
  serverActions: {
    bodySizeLimit: "20mb",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "/**",
      },
    ],
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // Tắt source maps trong production
  productionBrowserSourceMaps: false,
  // Turbopack config cho Next.js 16
  turbopack: {
    // Turbopack sẽ tự xử lý source maps
  },
  // Optimize for Vercel
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
