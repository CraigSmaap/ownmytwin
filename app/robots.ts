import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://ownmytwin.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/marketplace", "/p/", "/showcase"],
        disallow: [
          "/dashboard",
          "/admin",
          "/settings",
          "/memories",
          "/twin",
          "/reply",
          "/chat",
          "/onboarding",
          "/api/",
          "/pay/",
          "/my-requests",
          "/buyer/",
          "/verify-identity",
          "/developer",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
