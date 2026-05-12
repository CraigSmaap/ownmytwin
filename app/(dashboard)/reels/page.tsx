"use client";

import { useState } from "react";

const PLATFORMS = [
  { value: "tiktok",    label: "TikTok",    icon: "🎵" },
  { value: "instagram", label: "Reels",     icon: "📸" },
  { value: "youtube",   label: "Shorts",    icon: "▶️" },
  { value: "twitter",   label: "Twitter/X", icon: "🐦" },
  { value: "linkedin",  label: "LinkedIn",  icon: "💼" },
  { value: "other",     label: "Other",     icon: "🎬" },
];

const DURATIONS = [
  { value: "15s", label: "15 sec" },
  { value: "30s", label: "30 sec" },
  { value: "60s", label: "60 sec" },
  { value: "90s", label: "90 sec" },
];

const TWEAKS = [
  { key: "punchier", label: "🥊 Punchier"    },
  { key: "shorter",  label: "✂️ Shorter"     },
  { key: "local",    label: "🇿🇦 SA Flavour" },
];

const LABEL_STYLES: Record<string, string> = {
  "Hook-First":    "bg-indigo-900/40 text-indigo-300 border-indigo-700/50",
  "Storytelling":  "bg-rose-900/40 text-rose-300 border-rose-700/50",
  "Direct & Bold": "bg-amber-900/40 text-amber-300 border-amber-700/50",
  "Tweaked":       "bg-violet-900/40 text-violet-300 border-violet-700/50",
};

interface Reel {
  label:     string;
  hook:      string;
  script:    string;
  caption:   string;
  hashtags:  string[];
}

export default function ReelCreatorPage() {
  const [platform,    setPlatform]    = useState("tiktok");
  const [topic,       setTopic]       = useState("");
  const [duration,    setDuration]    = useState("30s");
  const [reels,       setReels]       = useState<Reel[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading,     setLoading]     = useState(false);
  const [tweaking,    setTweaking]    = useState<string | null>(null);
  const [error,       setError]       = useState("");
  const [copied,      setCopied]      = useState<string | null>(null);

  async function handleGenerate() {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setReels([]);
    setSelectedIdx(0);
    try {
      const res  = await fetch("/api/reels", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ platform, topic, duration }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate");
      setReels(data.reels);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleTweak(tweakKey: string) {
    const current = reels[selectedIdx];
    if (!current || tweaking) return;
    setTweaking(tweakKey);
    try {
      const res  = await fetch("/api/reels", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ platform, topic, duration, tweak: tweakKey, currentReel: current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Tweak failed");
      setReels((prev) => {
        const next = [...prev];
        next[selectedIdx] = data.reels[0];
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tweak failed");
    } finally {
      setTweaking(null);
    }
  }

  async function handleCopy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="max-w-5xl space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Reel Creator</h1>
        <p className="text-slate-400 text-sm sm:text-base">
          Generate reel scripts and captions in your authentic voice — for any platform.
        </p>
      </div>

      {/* Main panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* ── Input column ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5">
          <h2 className="font-semibold text-white text-sm uppercase tracking-wide">Your Reel Brief</h2>

          {/* Platform picker */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Platform</p>
            <div className="grid grid-cols-3 gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPlatform(p.value)}
                  className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-xs font-medium transition-all touch-manipulation ${
                    platform === p.value
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50"
                      : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <span>{p.icon}</span><span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Topic or brief</p>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What's this reel about? Give a topic, idea, or paste a brand brief..."
              rows={5}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none text-sm leading-relaxed"
            />
          </div>

          {/* Duration picker */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Duration</p>
            <div className="grid grid-cols-4 gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDuration(d.value)}
                  className={`py-2.5 rounded-xl text-xs font-medium transition-all touch-manipulation ${
                    duration === d.value
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating 3 scripts...
              </span>
            ) : (
              "Generate Reel Scripts ✦"
            )}
          </button>

          {error && (
            <div className="bg-red-900/40 border border-red-800/50 rounded-xl px-4 py-3 text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* ── Output column ── */}
        <div className="space-y-3">
          {reels.length > 0 ? (
            <>
              {reels.map((reel, idx) => {
                const isSelected = idx === selectedIdx;
                const labelStyle = LABEL_STYLES[reel.label] ?? LABEL_STYLES["Hook-First"];
                const allText    = [
                  `HOOK:\n${reel.hook}`,
                  `\nSCRIPT:\n${reel.script}`,
                  `\nCAPTION:\n${reel.caption}`,
                  reel.hashtags.length > 0 ? `\nHASHTAGS:\n${reel.hashtags.map((h) => `#${h}`).join(" ")}` : "",
                ].filter(Boolean).join("\n");

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedIdx(idx)}
                    className={`rounded-2xl border p-5 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-slate-900 border-indigo-500/60"
                        : "bg-slate-800/40 border-slate-700 hover:border-indigo-500"
                    }`}
                  >
                    {/* Card header */}
                    <div
                      className="flex items-center justify-between mb-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${labelStyle}`}>
                        {reel.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleCopy(
                              reel.caption + (reel.hashtags.length > 0 ? "\n\n" + reel.hashtags.map((h) => `#${h}`).join(" ") : ""),
                              `caption-${idx}`,
                            )
                          }
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all border ${
                            copied === `caption-${idx}`
                              ? "bg-green-900/40 text-green-400 border-green-800/50"
                              : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600"
                          }`}
                        >
                          {copied === `caption-${idx}` ? "✓ Copied!" : "Copy Caption"}
                        </button>
                        <button
                          onClick={() => handleCopy(allText, `all-${idx}`)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all border ${
                            copied === `all-${idx}`
                              ? "bg-green-900/40 text-green-400 border-green-800/50"
                              : "bg-indigo-900/40 text-indigo-300 border-indigo-700/50 hover:border-indigo-600"
                          }`}
                        >
                          {copied === `all-${idx}` ? "✓ Copied!" : "Copy All"}
                        </button>
                      </div>
                    </div>

                    {/* Hook */}
                    <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 mb-3">
                      <p className="text-xs text-indigo-400 font-semibold mb-1.5 uppercase tracking-wide">🎣 Hook</p>
                      <p className="text-white font-semibold text-sm leading-relaxed">{reel.hook}</p>
                    </div>

                    {/* Script */}
                    {reel.script && (
                      <div className="mb-3">
                        <p className="text-xs text-slate-500 font-semibold mb-1.5 uppercase tracking-wide">📜 Script</p>
                        <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{reel.script}</p>
                      </div>
                    )}

                    {/* Caption */}
                    {reel.caption && (
                      <div className="mb-3 pt-3 border-t border-slate-700">
                        <p className="text-xs text-slate-500 font-semibold mb-1.5 uppercase tracking-wide">📝 Caption</p>
                        <p className="text-slate-200 text-sm leading-relaxed">{reel.caption}</p>
                      </div>
                    )}

                    {/* Hashtags */}
                    {reel.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-700">
                        {reel.hashtags.map((tag) => (
                          <span key={tag} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Tweak bar */}
              <div className="bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500 mr-1">Tweak selected:</span>
                {TWEAKS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => handleTweak(t.key)}
                    disabled={!!tweaking}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 ${
                      tweaking === t.key
                        ? "bg-indigo-900/40 text-indigo-300 border-indigo-700/50"
                        : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    {tweaking === t.key && (
                      <span className="w-3 h-3 border border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                    )}
                    {t.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="bg-slate-800/40 border border-slate-700 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center min-h-[300px]">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl mb-4">
                🎬
              </div>
              <p className="text-slate-400 text-sm font-medium">3 reel scripts will appear here</p>
              <p className="text-slate-500 text-xs mt-1">Hook-First · Storytelling · Direct & Bold</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
