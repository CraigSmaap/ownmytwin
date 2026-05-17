import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://ownmytwin.com";

const TITLE       = "OwnMyTwin — Own Your Digital Identity";
const DESCRIPTION = "Create your AI twin, own your voice and likeness, and earn passively from licensing deals. The digital identity marketplace for creators, talent, and professionals.";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default:  TITLE,
    template: "%s | OwnMyTwin",
  },
  description: DESCRIPTION,
  keywords: [
    "AI twin", "digital identity", "voice cloning", "likeness licensing",
    "AI avatar", "digital human marketplace", "license your likeness",
    "creator monetization", "AI presenter", "voice artist marketplace",
    "own your likeness", "digital twin platform",
  ],
  authors: [{ name: "OwnMyTwin" }],
  creator: "OwnMyTwin",
  openGraph: {
    type:        "website",
    locale:      "en_US",
    url:         BASE_URL,
    siteName:    "OwnMyTwin",
    title:       TITLE,
    description: DESCRIPTION,
    images: [{
      url:    "/ownmytwin-logo.png",
      width:  1200,
      height: 630,
      alt:    "OwnMyTwin — Own Your Digital Identity",
    }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       TITLE,
    description: DESCRIPTION,
    images:      ["/ownmytwin-logo.png"],
  },
  robots: {
    index:  true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}><Providers>{children}</Providers></body>
    </html>
  );
}
