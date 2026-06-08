import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: true,
  async rewrites() {
    return [
      {
        source: "/upload/:path*",
        destination: "/api/upload/:path*",
      },
    ];
  },
};

export default nextConfig;
