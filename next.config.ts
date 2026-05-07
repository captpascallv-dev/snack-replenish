import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd() as string,
  },
  allowedDevOrigins: ["192.168.1.201", "localhost"],
};

export default nextConfig;
