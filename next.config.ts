import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Production builds drop console.log/info/debug (they printed caller phone numbers and call events into
  // every operator's browser console). console.error and console.warn stay for real problems.
  compiler: {
    removeConsole: { exclude: ["error", "warn"] },
  },
};

export default nextConfig;
