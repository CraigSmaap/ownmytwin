import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["otplib"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "pub-de24c44157634646b7d7a13bc807da68.r2.dev",
      },
    ],
  },
};

export default nextConfig;
