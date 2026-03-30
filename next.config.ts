import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/app",
        permanent: true,
      },
      {
        source: "/dashboard/:path*",
        destination: "/app",
        permanent: true,
      },
      {
        source: "/workspace",
        destination: "/app/workspace",
        permanent: true,
      },
      {
        source: "/workspace/:path*",
        destination: "/app/workspace",
        permanent: true,
      },
    ];
  },
  images: {
    qualities: [75, 100],
  },
};

export default nextConfig;
