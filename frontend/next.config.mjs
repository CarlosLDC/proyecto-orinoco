/** @type {import('next').NextConfig} */
const backendPort = process.env.BACKEND_PORT || "8000";

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/backend-api/:path*",
        destination: `http://127.0.0.1:${backendPort}/:path*`,
      },
    ];
  },
};

export default nextConfig;
