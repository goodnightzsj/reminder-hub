import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  devIndicators: {
    // buildActivity: false, // Not supported in this version
  },
};

export default nextConfig;
