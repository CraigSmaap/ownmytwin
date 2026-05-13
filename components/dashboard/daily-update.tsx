"use client";

import { useState } from "react";
import Link from "next/link";

type Tone = "serious" | "funny" | "inspirational";
type Step = "idle" | "journal" | "generating" | "preview" | "done";

const TONES: { key: Tone; label: string; icon: string; desc: string }[] = [
  { key: "serious",       icon: "🧠", label: "Serious",       desc: "Honest & thoughtful"  },
  { key: "funny",         icon: "😂", label: "Funny",         desc: "Witty & relatable"    },
  { key: "inspirational", icon: "💡", label: "Inspirational", desc: "Uplifting & energetic" },
];

interface Props {
  twinId: string | null;
}

export function DailyUpdate({ twinId }: Props) {
  const [step,      setStep]      = useState<Step>("idle");
  const [text,      setText]      = useState("");
  const [tone,      setTone]      = useState<Tone | null>(null);
  const [title,     setTitle]     = useState("");
  const [desc,      setDesc]      = useState("");
  const [photo,     setPhoto]     = useState<File | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [published, setPublished] = useState(false);
  const [error,     setError]     = useState("");

  function reset() {
    setStep("idle"); setText(""); setTone(null);
    setTitle(""); setDesc(""); setPhoto(null);
    setError(""); setSaving(false); setPublished(false);
  }

  async function handleGenerate(selectedTone: Tone) {
    if (!text.trim() || saving) return;
    setTone(selectedTone);
    setSaving(true);
    setError("");

    const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    await fetch("/api/memories", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        title:      `Daily update — ${today}`,
        content:    text.trim(),
        category:   "life_event",
        visibility: "twin_only",
        importance: "medium",
      }),
    });

    setSaving(false);
    if (!twinId) { setStep("done"); return; }

    setStep("generating");
    const res = await fetch("/api/showcase/generate-preview", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ journalEntry: text.trim(), twinId, tone: selectedTone }),
    });

    if (!res.ok) {
      setError("Couldn't generate preview — your update was saved to memory.");
      setStep("done");
      return;
    }

    const data = await res.json();
    setTitle(data.title ?? "");
    setDesc(data.description ?? "");
    setStep("preview");
  }

  async function handleRegenerate() {
    if (!twinId || !tone || saving) return;
    setStep("generating");
    setError("");
    const res = await fetch("/api/showcase/generate-preview", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ journalEntry: text.trim(), twinId, tone }),
    });
    if (res.ok) {
      const data = await res.json();
      setTitle(data.title ?? "");
      setDesc(data.description ?? "");
    } else {
      setError("Regeneration failed — try again.");
    }
    setStep("preview");
  }

  async function handlePublish() {
    if (saving || !title.trim() || !desc.trim()) return;
    setSaving(true);
    setError("");

    let res: Response;
    if (photo) {
      const fd = new FormData();
      fd.append("title",        title.trim());
      fd.append("description",  desc.trim());
      fd.append("mediaType",    "image");
      fd.append("twinId",       twinId!);
      fd.append("isGuidedPost", "true");
      fd.append("image",        photo);
      res = await fetch("/api/showcase", { method: "POST", body: fd });
    } else {
      res = await fetch("/api/showcase", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ title: title.trim(), description: desc.trim(), mediaType: "text", twinId, isGuidedPost: true }),
      });
    }

    setSaving(false);
    if (res.ok) { setPublished(true); setStep("done"); }
    else { setError("Failed to publish — try again."); }
  }

  // ── Done ─────────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="bg-slate-900 border border-green-800/50 rounded-2xl p-5 text-center space-y-1">
        <p className="text-green-400 font-semibold text-sm">
          {published ? "✓ Published to Showcase!" : "✓ Saved to your Twin"}
        </p>
        <p className="text-slate-500 text-xs leading-relaxed">
          {published ? "Your post is live. Every update makes your Twin sharper." : error || "Your update was saved as a memory."}
        </p>
        {published && (
          <Link href="/showcase" className="inline-block text-xs text-indigo-400 hover:text-indigo-300 mt-2 transition-colors">
            View Showcase →
          </Link>
        )}
        <button onClick={reset} className="block mx-auto text-xs text-slate-600 hover:text-slate-400 mt-3 transition-colors">
          Write another update
        </button>
      </div>
    );
  }

  // ── Generating ───────────────────────────────────────────────────────────
  if (step === "generating") {
    const active = TONES.find((t) => t.key === tone);
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col items-center gap-3 py-8">
        <div className="w-7 h-7 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Writing your {active?.label.toLowerCase()} post…</p>
      </div>
    );
  }

  // ── Preview ──────────────────────────────────────────────────────────────
  if (step === "preview") {
    const activeTone = TONES.find((t) => t.key === tone);
    return (
      <div className="bg-slate-900 border border-indigo-800/50 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{activeTone?.icon}</span>
            <div>
              <p className="text-sm font-semibold text-white">Your Twin wrote this</p>
              <p className="text-xs text-slate-500">{activeTone?.label} tone · edit freely</p>
            </div>
          </div>
          <button
            onClick={handleRegenerate}
            className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-800/50 px-2.5 py-1 rounded-lg transition-colors"
          >
            ↺ Redo
          </button>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm font-medium focus:outline-none focus:border-indigo-500 placeholder-slate-500"
        />
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={4}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none text-sm leading-relaxed"
        />

        <div className="flex items-center gap-2">
          {photo ? (
            <div className="flex items-center gap-2 flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
              <span className="text-base shrink-0">🖼️</span>
              <span className="text-xs text-slate-300 truncate flex-1">{photo.name}</span>
              <button onClick={() => setPhoto(null)} className="text-xs text-slate-500 hover:text-red-400 transition-colors shrink-0">✕</button>
            </div>
          ) : (
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors">
                📎 Add photo
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
            </label>
          )}
          <span className="text-xs text-slate-600">(also trains your Twin)</span>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={() => { setStep("done"); setPublished(false); }}
            className="px-3 py-2 text-xs text-slate-500 hover:text-slate-300 border border-slate-700 rounded-lg transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handlePublish}
            disabled={!title.trim() || !desc.trim() || saving}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
          >
            {saving ? "Publishing…" : "🚀 Publish to Showcase"}
          </button>
        </div>
      </div>
    );
  }

  // ── Idle / Journal ───────────────────────────────────────────────────────
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <button
        onClick={() => setStep(step === "journal" ? "idle" : "journal")}
        className="w-full flex items-center justify-between gap-3 text-left group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-900/40 border border-indigo-800/50 flex items-center justify-center text-base shrink-0">
            📅
          </div>
          <div>
            <p className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
              Tell your Twin about today
            </p>
            <p className="text-xs text-slate-500">
              {twinId ? "Pick a tone — it'll write your Showcase post" : "Daily updates keep your Twin sharp"}
            </p>
          </div>
        </div>
        <span className={`text-slate-500 text-lg transition-transform duration-200 ${step === "journal" ? "rotate-180" : ""}`}>↓</span>
      </button>

      {step === "journal" && (
        <div className="mt-4 space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What happened today? A decision you made, someone you met, something you felt, a win or a setback…"
            rows={4}
            autoFocus
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none text-sm leading-relaxed"
          />

          <div>
            <p className="text-xs text-slate-500 mb-2">
              Add a photo from today <span className="text-slate-600">(optional — also trains your Twin)</span>
            </p>
            {photo ? (
              <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                <span className="text-base shrink-0">🖼️</span>
                <span className="text-xs text-slate-300 truncate flex-1">{photo.name}</span>
                <button onClick={() => setPhoto(null)} className="text-xs text-slate-500 hover:text-red-400 transition-colors shrink-0">✕</button>
              </div>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <span className="text-xs bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors">
                  📎 Attach photo
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
              </label>
            )}
          </div>

          {twinId ? (
            <>
              <p className="text-xs text-slate-500">Pick a tone for your post:</p>
              <div className="grid grid-cols-3 gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => handleGenerate(t.key)}
                    disabled={!text.trim() || saving}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-700 hover:border-indigo-500 hover:bg-indigo-900/20 disabled:opacity-40 transition-all group"
                  >
                    <span className="text-xl">{t.icon}</span>
                    <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">{t.label}</span>
                    <span className="text-xs text-slate-600 text-center leading-tight">{t.desc}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => { setStep("idle"); setText(""); }}
                className="px-4 py-2 text-xs text-slate-500 hover:text-slate-300 border border-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleGenerate("serious")}
                disabled={!text.trim() || saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
              >
                {saving ? "Saving…" : "Save to Twin →"}
              </button>
            </div>
          )}

          {twinId && (
            <button
              onClick={() => { setStep("idle"); setText(""); }}
              className="w-full text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
