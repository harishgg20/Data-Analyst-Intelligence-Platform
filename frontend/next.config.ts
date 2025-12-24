import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
      {
        source: '/docs',
        destination: 'http://127.0.0.1:8000/docs',
      },
      {
        source: '/ws/:path*',
        destination: 'http://127.0.0.1:8000/ws/:path*', // Note: Next.js rewrites handle http, for WS it might be tricky but often works for proxying if not using custom server.
        // Actually for WS, sticking to direct port 8000 in dev is safer.
      },
    ];
  },
};

export default nextConfig;
