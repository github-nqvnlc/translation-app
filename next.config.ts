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
};

export default nextConfig;
