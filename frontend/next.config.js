/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (process.env.BACKEND_API_URL) {
      return [
        {
          source: "/api/:path*",
          destination: `${process.env.BACKEND_API_URL}/api/:path*`,
        },
      ];
    }
    return [];
  },
  images: {
    domains: ["images.unsplash.com", "api.dicebear.com"],
  },
};

module.exports = nextConfig;
