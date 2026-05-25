import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/v1/tasks",
        destination: "/api/tasks"
      },
      {
        source: "/api/v1/tasks/:path*",
        destination: "/api/tasks/:path*"
      }
    ];
  }
};

export default nextConfig;
