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
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
