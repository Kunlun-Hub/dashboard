/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 30,
    },
  },
  images: {
    unoptimized: true,
  },
  reactStrictMode: false,
  env: {
    APP_ENV: process.env.APP_ENV || "production",
    NEXT_PUBLIC_DASHBOARD_VERSION:
      process.env.NEXT_PUBLIC_DASHBOARD_VERSION || "development",
  },
};

module.exports = nextConfig;
