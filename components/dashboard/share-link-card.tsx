"use client";

import Link from "next/link";
import { useState } from "react";

export function ShareLinkCard({ slug }: { slug: string | null }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!slug) return;
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!slug) {
    return (
      <div className="bg-gradient-to-br from-indigo-900/20 to-violet-900/20 border border-indigo-800/30 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🔗</span>
          <h3 className="font-semibold text-white text-sm">Your Public Profile</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed mb-3">
          Create a shareable link for your bio. Buyers and brands can find and license you directly.
        </p>
        <Link href="/settings" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
          Set up your profile link →
        </Link>
      </div>
    );
  }

  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/p/${slug}`;

  return (
    <div className="bg-gradient-to-br from-indigo-900/20 to-violet-900/20 border border-indigo-800/30 rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">🔗</span>
        <h3 className="font-semibold text-white text-sm">Your Public Profile</h3>
        <span className="ml-auto text-xs bg-green-900/40 text-green-400 border border-green-800/40 px-2 py-0.5 rounded-full">Live</span>
      </div>

      <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl px-3 py-2 flex items-center gap-2 min-w-0">
        <span className="text-xs text-slate-400 truncate flex-1 min-w-0">/p/{slug}</span>
        <Link
          href={`/p/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300 text-xs shrink-0 transition-colors"
        >
          ↗
        </Link>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        Share this link in your Instagram bio, LinkedIn, or anywhere else.
      </p>

      <button
        onClick={handleCopy}
        className={`w-full text-xs font-semibold py-2.5 rounded-xl border transition-all ${
          copied
            ? "bg-green-900/30 text-green-400 border-green-800/40"
            : "bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700 hover:border-indigo-600 hover:text-indigo-400"
        }`}
      >
        {copied ? "✓ Copied!" : `Copy Link — ${url}`}
      </button>
    </div>
  );
}
