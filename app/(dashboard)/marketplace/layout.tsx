import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marketplace — Browse AI Twins",
  description: "Browse and license verified AI twins from creators, presenters, voice artists, and professionals. Find the right digital identity for your brand, campaign, or project.",
  openGraph: {
    title:       "OwnMyTwin Marketplace — Browse AI Twins",
    description: "License AI twins from real creators. Voice-overs, brand ambassadors, presenters, coaches and more.",
    type:        "website",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "OwnMyTwin Marketplace",
    description: "Browse and license verified AI twins from creators and professionals.",
  },
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
