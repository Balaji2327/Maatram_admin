import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    const origin = process.env.NEXT_PUBLIC_APPLICATION_URL ||
      (process.env.NODE_ENV === "development" ? "http://localhost:3002" : "https://application.matramites.tech");
    return ["/login", "/signup", "/verify-otp", "/dashboard", "/process"].map(path => ({
      source: path,
      destination: new URL(path, origin).href,
      permanent: false,
    }));
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
    ],
  },
};

export default nextConfig;
