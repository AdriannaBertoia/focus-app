import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // In production, proxy /api/* to the local machine via Cloudflare tunnel
  async rewrites() {
    const tunnelUrl = process.env.API_TUNNEL_URL;
    if (tunnelUrl) {
      return [
        {
          source: "/api/:path*",
          destination: `${tunnelUrl}/api/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
