import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  async rewrites() {
    const api = process.env.API_URL ?? "http://127.0.0.1:8002"
    return [{ source: "/uploads/:path*", destination: `${api}/uploads/:path*` }]
  },
};

export default nextConfig;
