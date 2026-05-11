"use client";

import { useState, useEffect, useRef } from "react";
import type { Platform } from "@/types";

const PLATFORMS: { value: Platform; label: string; icon: string }[] = [
  { value: "whatsapp",  label: "WhatsApp",   icon: "💬" },
  { value: "email",     label: "Email",       icon: "📧" },
  { value: "instagram", label: "Instagram",   icon: "📸" },
  { value: "twitter",   label: "Twitter / X", icon: "🐦" },
  { value: "sms",       label: "SMS",         icon: "📱" },
  { value: "other",     label: "Other",       icon: "💭" },
];

const LABEL_STYLES: Record<string, string> = {
  Natural:      "bg-indigo-900/50 text-indigo-300 border-indigo-700/60",
  Brief:        "bg-cyan-900/50 text-cyan-300 border-cyan-700/60",
  Warm:         "bg-rose-900/50 text-rose-300 border-rose-700/60",
  Tweaked:      "bg-violet-900/50 text-violet-300 border-violet-700/60",
};

const TWEAKS = [
  { key: "shorter",      label: "✂️ Shorter"      },
  { key: "warmer",       label: "🌡️ Warmer"       },
  { key: "professional", label: "💼 Professional"  },
];

interface ReplyOption {
  label: string;
  content: string;
}

interface HistoryEntry {
  id: string;
  role: string;
  content: string;
  platform: string | null;
  createdAt: string;
}

export default function ReplyPage() {
  const [message,      setMessage]      = useState("");
  const [platform,     setPlatform]     = useState<Platform>("whatsapp");
  const [context,      setContext]      = useState("");
  const [replies,      setReplies]      = useState<ReplyOption[]>([]);
  const [selectedIdx,  setSelectedIdx]  = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [tweaking,     setTweaking]     = useState<string | null>(null);
  const [error,        setError]        = useState("");
  const [copied,       setCopied]       = useState<number | null>(null);
  const [history,      setHistory]      = useState<HistoryEntry[]>([]);
  const [twinReady,    setTwinReady]    = useState<boolean | null>(null);
  const [speaking,     setSpeaking]     = useState<number | null>(null);
  const [voiceReady,   setVoiceReady]   = useState(false);
  const [teachingIdx,  setTeachingIdx]  = useState<number | null>(null);
  const [correction,   setCorrection]   = useState("");
  const [teachSaved,   setTeachSaved]   = useState<number | null>(null);
  const [teachSaving,  setTeachSaving]  = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch("/api/twin").then((r) => r.json()).then(({ twin }) => {
      setTwinReady(!!twin?.systemPrompt);
      setVoiceReady(!!twin?.elevenLabsVoiceId);
    });
    fetch("/api/reply/history").then((r) => r.json()).then(({ messages }) => setHistory(messages ?? []));
  }, []);

  async function handleGenerate() {
    if (!message.trim()) return;
    setLoading(true);
    setError("");
    setReplies([]);
    setSelectedIdx(0);
    try {
      const res = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incomingMessage: message, platform, context }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate replies");
      setReplies(data.replies);
      setHistory((prev) => [
        { id: Date.now() + "a", role: "assistant", content: data.replies[0].content, platform, createdAt: new Date().toISOString() },
        { id: Date.now() + "u", role: "user",      content: message,                 platform, createdAt: new Date().toISOString() },
        ...prev,
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleTweak(tweakKey: string) {
    const current = replies[selectedIdx];
    if (!current || tweaking) return;
    setTweaking(tweakKey);
    try {
      const res = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incomingMessage: message,
          platform,
          context,
          tweak: tweakKey,
          currentReply: current.content,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Tweak failed");
      setReplies((prev) => {
        const next = [...prev];
        next[selectedIdx] = data.replies[0];
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tweak failed");
    } finally {
      setTweaking(null);
    }
  }

  async function handleCopy(idx: number) {
    await navigator.clipboard.writeText(replies[idx].content);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleSpeak(idx: number) {
    if (speaking !== null) return;
    setSpeaking(idx);
    try {
      const res = await fetch("/api/reply/speak", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ text: replies[idx].content }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      audioRef.current?.pause();
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setSpeaking(null); URL.revokeObjectURL(url); };
      audio.play();
    } catch {
      setSpeaking(null);
    }
  }

  async function handleTeachSave(idx: number) {
    if (!correction.trim() || teachSaving) return;
    setTeachSaving(true);
    const incoming = replies[idx];
    await fetch("/api/memories", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title:      `Reply correction — "${message.slice(0, 60)}${message.length > 60 ? "…" : ""}"`,
        content:    `When responding to a ${platform} message like:\n"${message}"\n\nMy twin generated:\n"${incoming.content}"\n\nI would actually say:\n"${correction.trim()}"`,
        category:   "correction",
        visibility: "twin_only",
        importance: "high",
      }),
    });
    setTeachSaving(false);
    setTeachSaved(idx);
    setTeachingIdx(null);
    setCorrection("");
    setTimeout(() => setTeachSaved(null), 3000);
  }

  const pairs: { incoming: HistoryEntry; reply: HistoryEntry }[] = [];
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === "user" && history[i - 1]?.role === "assistant") {
      pairs.unshift({ incoming: history[i], reply: history[i - 1] });
      i--;
    }
  }

  const activePlatform = PLATFORMS.find((p) => p.value === platform);

  return (
    <div className="max-w-5xl space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Reply For Me</h1>
        <p className="text-slate-400 text-sm sm:text-base">Generate a reply to any message in your exact voice.</p>
      </div>

      {/* Twin not configured warning */}
      {twinReady === false && (
        <div className="flex items-center gap-3 bg-amber-900/20 border border-amber-800/50 rounded-2xl px-5 py-4">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-amber-300 font-medium text-sm">Your Twin isn&apos;t configured yet</p>
            <p className="text-amber-400/70 text-xs mt-0.5">
              <a href="/twin" className="underline hover:text-amber-300">Set up your Twin</a> for replies that actually sound like you.
            </p>
          </div>
        </div>
      )}

      {/* Main panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* ── Input column ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5">
          <h2 className="font-semibold text-white text-sm uppercase tracking-wide">Incoming Message</h2>

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
                      : "bg-slate-800 text-slate-400 active:bg-slate-700 border border-slate-700"
                  }`}
                >
                  <span>{p.icon}</span><span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Message received</p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Paste the ${activePlatform?.label ?? "message"} you received...`}
              rows={4}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none text-sm leading-relaxed"
            />
          </div>

          {/* Context */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Context <span className="text-slate-600">(optional)</span></p>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Who sent this? What's the situation?"
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none text-sm"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !message.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating 3 replies...
              </span>
            ) : (
              "Generate Replies ✦"
            )}
          </button>

          {error && (
            <div className="bg-red-900/20 border border-red-800/50 rounded-xl px-4 py-3 text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* ── Output column ── */}
        <div className="space-y-3">
          {replies.length > 0 ? (
            <>
              {/* Reply cards */}
              {replies.map((r, idx) => {
                const isSelected = idx === selectedIdx;
                const isCopied   = copied === idx;
                const isSpeaking = speaking === idx;
                const labelStyle = LABEL_STYLES[r.label] ?? LABEL_STYLES.Natural;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedIdx(idx)}
                    className={`rounded-2xl border p-5 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-slate-900 border-indigo-600/60 shadow-lg shadow-indigo-900/20"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {/* Card header */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${labelStyle}`}>
                        {r.label}
                      </span>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {voiceReady && (
                          <button
                            onClick={() => handleSpeak(idx)}
                            disabled={speaking !== null}
                            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all border ${
                              isSpeaking
                                ? "bg-indigo-900/50 text-indigo-400 border-indigo-800"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                            }`}
                          >
                            {isSpeaking ? "🔊 Playing..." : "🔊"}
                          </button>
                        )}
                        <button
                          onClick={() => handleCopy(idx)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all border ${
                            isCopied
                              ? "bg-green-900/50 text-green-400 border-green-800"
                              : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                          }`}
                        >
                          {isCopied ? "✓ Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-white leading-relaxed whitespace-pre-wrap text-sm">{r.content}</p>

                    {/* Teach Twin controls */}
                    <div className="mt-3 pt-3 border-t border-slate-800" onClick={(e) => e.stopPropagation()}>
                      {teachSaved === idx ? (
                        <p className="text-xs text-teal-400 font-medium">✓ Saved — your twin will learn from this</p>
                      ) : teachingIdx === idx ? (
                        <div className="space-y-2">
                          <p className="text-xs text-slate-400">What would you actually say?</p>
                          <textarea
                            value={correction}
                            onChange={(e) => setCorrection(e.target.value)}
                            placeholder="Type your preferred reply here..."
                            rows={3}
                            autoFocus
                            className="w-full bg-slate-800 border border-teal-700/50 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none text-sm leading-relaxed"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setTeachingIdx(null); setCorrection(""); }}
                              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 border border-slate-700 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleTeachSave(idx)}
                              disabled={!correction.trim() || teachSaving}
                              className="flex-1 bg-teal-700 hover:bg-teal-600 disabled:opacity-40 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors"
                            >
                              {teachSaving ? "Saving..." : "✏️ Teach Twin"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setTeachingIdx(idx); setCorrection(""); }}
                          className="text-xs text-slate-500 hover:text-teal-400 transition-colors flex items-center gap-1.5"
                        >
                          ✏️ Not quite right? Teach your twin
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Tweak bar */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500 mr-1">Tweak selected:</span>
                {TWEAKS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => handleTweak(t.key)}
                    disabled={!!tweaking}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 ${
                      tweaking === t.key
                        ? "bg-indigo-900/50 text-indigo-300 border-indigo-700"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
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
            <div className="bg-slate-900/40 border border-slate-800 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center min-h-[300px]">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl mb-4">
                ✦
              </div>
              <p className="text-slate-400 text-sm font-medium">3 reply options will appear here</p>
              <p className="text-slate-600 text-xs mt-1">Natural · Brief · Warm</p>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {pairs.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
            Reply History
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pairs.map(({ incoming, reply: rep }) => {
              const p = PLATFORMS.find((pl) => pl.value === incoming.platform);
              return (
                <div key={incoming.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm">{p?.icon ?? "💭"}</span>
                    <span className="text-xs text-slate-500 capitalize">{incoming.platform ?? "message"}</span>
                    <span className="text-xs text-slate-700">·</span>
                    <span className="text-xs text-slate-600">
                      {new Date(incoming.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3 pb-3 border-b border-slate-800">
                    {incoming.content}
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">{rep.content}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
