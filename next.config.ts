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
    ],
  },
};

export default nextConfig;
