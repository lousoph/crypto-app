import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-4fbbaa1a-69b4-4b15-97f1-3667c1e257c9.space-z.ai",
    "*.space-z.ai",
    "127.0.0.1",
    "localhost",
  ],
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
