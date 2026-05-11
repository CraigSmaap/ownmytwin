"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface LicenseSetting {
  enabled: boolean;
  price: number;
  approval: "manual" | "auto";
  territory: "local" | "national" | "global";
}

type Permissions = Record<string, LicenseSetting>;

const DEFAULT: LicenseSetting = {
  enabled:  false,
  price:    0,
  approval: "manual",
  territory: "global",
};

const GROUPS = [
  {
    label: "Audio",
    icon:  "🎙️",
    categories: [
      { id: "voice_only",       label: "Voice Only",             icon: "🎤", desc: "Use your voice in audio-only projects" },
      { id: "voiceover",        label: "Voiceover",              icon: "🎙️", desc: "Narration, ads, and voiceover content" },
      { id: "public_speaking",  label: "Public Speaking Style",  icon: "📢", desc: "AI presentations in your speaking style" },
    ],
  },
  {
    label: "Visual",
    icon:  "🪞",
    categories: [
      { id: "face_avatar",   label: "Face / Avatar",  icon: "🪞", desc: "Your likeness for avatar and digital art" },
      { id: "full_likeness", label: "Full Likeness",  icon: "👤", desc: "Combined face, voice, and mannerisms" },
    ],
  },
  {
    label: "Content",
    icon:  "📱",
    categories: [
      { id: "social_media",       label: "Social Media",       icon: "📱", desc: "Posts, stories, and social campaigns" },
      { id: "ads",                label: "Advertising",        icon: "📺", desc: "Commercial ads and brand campaigns" },
      { id: "ai_presenter",       label: "AI Presenter",       icon: "🎬", desc: "Hosting, presenting, and announcements" },
      { id: "virtual_influencer", label: "Virtual Influencer", icon: "⭐", desc: "Long-term brand ambassador campaigns" },
    ],
  },
  {
    label: "Professional",
    icon:  "🏢",
    categories: [
      { id: "educational",        label: "Educational Content",     icon: "📚", desc: "eLearning, courses, and training" },
      { id: "corporate_training", label: "Corporate Training",      icon: "🏢", desc: "Internal company training materials" },
      { id: "customer_service",   label: "Customer Service Avatar", icon: "🤝", desc: "AI assistant representing a brand" },
    ],
  },
  {
    label: "Entertainment",
    icon:  "🎮",
    categories: [
      { id: "film_tv",      label: "Film / TV",        icon: "🎥", desc: "Background roles in film and TV" },
      { id: "game_npc",     label: "Video Game NPC",   icon: "🎮", desc: "Non-player characters in video games" },
      { id: "motion_style", label: "Motion Style",     icon: "🕺", desc: "Movement and gesture style for animation" },
    ],
  },
];

const ALL_CATEGORIES = GROUPS.flatMap((g) => g.categories);

export default function LicensingPage() {
  const [permissions, setPermissions] = useState<Permissions>({});
  const [loaded,      setLoaded]      = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [publicSlug,  setPublicSlug]  = useState<string | null>(null);
  const [copied,      setCopied]      = useState(false);
  const [isPro,       setIsPro]       = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/licensing").then((r) => r.json()),
      fetch("/api/user").then((r) => r.json()),
    ]).then(([lic, usr]) => {
      setPermissions(lic.permissions ?? {});
      setPublicSlug(lic.publicSlug ?? null);
      setIsPro(usr.user?.plan === "pro");
      setLoaded(true);
    });
  }, []);

  function copyLink(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function get(id: string): LicenseSetting {
    return permissions[id] ?? { ...DEFAULT };
  }

  function update(id: string, field: keyof LicenseSetting, value: unknown) {
    setPermissions((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { ...DEFAULT }), [field]: value },
    }));
  }

  function toggle(id: string) {
    const current = get(id);
    setPermissions((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { ...DEFAULT }), enabled: !current.enabled },
    }));
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/licensing", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ permissions }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const enabledCount  = ALL_CATEGORIES.filter((c) => get(c.id).enabled).length;
  const totalPotential = ALL_CATEGORIES.reduce((sum, c) => {
    const s = get(c.id);
    return sum + (s.enabled ? s.price : 0);
  }, 0);

  return (
    <div className="max-w-4xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Licensing Permissions</h1>
          <p className="text-slate-400 text-sm">Control what buyers can license, at what price, and how approvals work.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !loaded}
          className={`hidden sm:flex items-center gap-2 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shrink-0 ${
            saved ? "bg-green-700 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"
          } disabled:opacity-40`}
        >
          {saved ? "✓ Saved!" : saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Summary banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap gap-6">
        <div>
          <p className="text-xs text-slate-500 mb-1">Enabled license types</p>
          <p className="text-2xl font-bold text-white">{enabledCount} <span className="text-slate-600 text-base font-normal">/ {ALL_CATEGORIES.length}</span></p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Total price per full use</p>
          <p className="text-2xl font-bold text-white">${totalPotential.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Your revenue share</p>
          <p className="text-2xl font-bold text-white">
            {isPro ? <span className="text-green-400">80%</span> : <span className="text-amber-400">70%</span>}
            <span className="text-slate-600 text-sm font-normal ml-1">{isPro ? "Pro rate" : "Free rate — upgrade for 80%"}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 ml-auto self-center bg-amber-900/20 border border-amber-800/40 rounded-xl px-4 py-2">
          <span className="text-amber-400 text-sm">⚠️</span>
          <p className="text-xs text-amber-300">All usage requires your manual approval unless changed below</p>
        </div>
      </div>

      {/* Share profile CTA */}
      {publicSlug && enabledCount > 0 && (() => {
        const profileUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/p/${publicSlug}`;
        return (
          <div className="bg-indigo-950/40 border border-indigo-800/50 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-indigo-300 mb-0.5">Share your profile to get requests</p>
              <p className="text-xs text-slate-400 font-mono truncate">/p/{publicSlug}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/p/${publicSlug}`}
                target="_blank"
                className="text-xs border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white px-3 py-2 rounded-xl transition-colors"
              >
                Preview →
              </Link>
              <button
                onClick={() => copyLink(profileUrl)}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-semibold transition-colors"
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Category groups */}
      {GROUPS.map((group) => (
        <div key={group.label}>
          <div className="flex items-center gap-2 mb-3">
            <span>{group.icon}</span>
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{group.label}</h2>
          </div>
          <div className="space-y-3">
            {group.categories.map((cat) => {
              const s = get(cat.id);
              return (
                <div
                  key={cat.id}
                  className={`bg-slate-900 border rounded-2xl p-5 transition-all ${
                    s.enabled ? "border-indigo-700/50" : "border-slate-800"
                  }`}
                >
                  {/* Row 1: name + toggle */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">{cat.icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">{cat.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{cat.desc}</p>
                      </div>
                    </div>
                    {/* Toggle */}
                    <button
                      onClick={() => toggle(cat.id)}
                      className={`shrink-0 w-12 h-6 rounded-full transition-all relative ${s.enabled ? "bg-indigo-600" : "bg-slate-700"}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${s.enabled ? "left-7" : "left-1"}`} />
                    </button>
                  </div>

                  {/* Row 2: settings (only when enabled) */}
                  {s.enabled && (
                    <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">

                      {/* Price */}
                      <div>
                        <label className="block text-xs text-slate-500 mb-1.5 font-medium">Price per use (USD)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={s.price}
                            onChange={(e) => update(cat.id, "price", Math.max(0, Number(e.target.value)))}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Approval */}
                      <div>
                        <label className="block text-xs text-slate-500 mb-1.5 font-medium">Approval mode</label>
                        <div className="flex gap-2">
                          {(["manual", "auto"] as const).map((mode) => (
                            <button
                              key={mode}
                              onClick={() => update(cat.id, "approval", mode)}
                              className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                s.approval === mode
                                  ? "bg-indigo-600 text-white border-indigo-500"
                                  : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600"
                              }`}
                            >
                              {mode === "manual" ? "🔒 Manual" : "⚡ Auto"}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {s.approval === "manual" ? "You approve every request" : "Requests are auto-approved"}
                        </p>
                      </div>

                      {/* Territory */}
                      <div>
                        <label className="block text-xs text-slate-500 mb-1.5 font-medium">Territory</label>
                        <select
                          value={s.territory}
                          onChange={(e) => update(cat.id, "territory", e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 appearance-none"
                        >
                          <option value="local">Local</option>
                          <option value="national">National</option>
                          <option value="global">Global</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Mobile save */}
      <button
        onClick={handleSave}
        disabled={saving || !loaded}
        className={`sm:hidden w-full font-semibold py-3.5 rounded-xl text-sm transition-all ${
          saved ? "bg-green-700 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"
        } disabled:opacity-40`}
      >
        {saved ? "✓ Saved!" : saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
