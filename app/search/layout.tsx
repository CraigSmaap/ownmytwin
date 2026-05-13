import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find AI Twins",
  description: "Browse and license AI twins from South African creators. Find the right voice, likeness, or digital identity for your project.",
  openGraph: {
    title:       "Browse AI Twins | OwnMyTwin",
    description: "Find and license AI twins from South African creators.",
    images:      [{ url: "/ownmytwin-logo.png", width: 1200, height: 630 }],
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
