import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Showcase",
  description: "See what South African creators are building with their AI twins — voice clones, AI replies, digital avatars, and more.",
  openGraph: {
    title:       "OwnMyTwin Showcase",
    description: "See what creators are building with their AI twins.",
    images:      [{ url: "/ownmytwin-logo.png", width: 1200, height: 630 }],
  },
};

export default function ShowcaseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
