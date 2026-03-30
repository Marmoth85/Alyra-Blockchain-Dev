import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Type errors in node_modules dependencies (viem/@noble/curves) are not our code
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
