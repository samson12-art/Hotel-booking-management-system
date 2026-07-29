/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "5000" },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: "http://localhost:5000/api/v1",
  },
};

module.exports = nextConfig;
