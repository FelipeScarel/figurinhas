/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  output: "export",
  distDir: "out",
  images: { unoptimized: true },
  trailingSlash: true,
  // Rewrites only work in dev mode (next dev), not with output:export in prod.
  // In production, Flask serves both the static files and the API on the same port,
  // so relative URLs like /api/figurinhas work automatically.
  async rewrites() {
    if (isProd) return [];
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:5000/api/:path*",
      },
      {
        source: "/admin/:path*",
        destination: "http://127.0.0.1:5000/admin/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: "http://127.0.0.1:5000/uploads/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
