"use client";

import { useEffect, useState } from "react";

const PLATFORMS = [
  { id: "facebook",  label: "Facebook",  placeholder: "facebook.com/yourpage",  icon: "f", color: "#1877f2" },
  { id: "twitter",   label: "X (Twitter)", placeholder: "x.com/yourhandle",     icon: "𝕏", color: "#000" },
  { id: "tiktok",    label: "TikTok",    placeholder: "tiktok.com/@yourhandle", icon: "♪", color: "#ff0050" },
  { id: "linkedin",  label: "LinkedIn",  placeholder: "linkedin.com/in/you",    icon: "in", color: "#0077b5" },
];

export function SocialLinksEditor() {
  const [handles, setHandles] = useState<Record<string, string>>({});
  const [saving, setSaving]   = useState<Record<string, boolean>>({});
  const [saved, setSaved]     = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/social-links")
      .then((r) => r.json())
      .then(({ links }) => {
        const map: Record<string, string> = {};
        for (const l of links ?? []) map[l.platform] = l.handle;
        setHandles(map);
      });
  }, []);

  async function save(platform: string) {
    const handle = handles[platform]?.trim() ?? "";
    setSaving((s) => ({ ...s, [platform]: true }));
    if (handle) {
      await fetch("/api/social-links", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ platform, handle }),
      });
    } else {
      // find and delete if empty
      const res  = await fetch("/api/social-links");
      const { links } = await res.json();
      const existing = links?.find((l: { platform: string; id: string }) => l.platform === platform);
      if (existing) await fetch(`/api/social-links/${existing.id}`, { method: "DELETE" });
    }
    setSaving((s) => ({ ...s, [platform]: false }));
    setSaved((s) => ({ ...s, [platform]: true }));
    setTimeout(() => setSaved((s) => ({ ...s, [platform]: false })), 2000);
  }

  return (
    <div className="space-y-3">
      {PLATFORMS.map(({ id, label, placeholder }) => (
        <div key={id} className="flex items-center gap-3">
          <div className="w-24 text-xs text-slate-400 font-medium flex-shrink-0">{label}</div>
          <input
            type="text"
            value={handles[id] ?? ""}
            onChange={(e) => setHandles((h) => ({ ...h, [id]: e.target.value }))}
            placeholder={placeholder}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => save(id)}
            disabled={saving[id]}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:border-indigo-500 text-slate-400 hover:text-white transition-colors disabled:opacity-50 flex-shrink-0"
          >
            {saved[id] ? "✓" : saving[id] ? "..." : "Save"}
          </button>
        </div>
      ))}
    </div>
  );
}
