"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { PersonalityTraits } from "@/types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const UNLOCK_THRESHOLD = 60;

const TONE_TWEAKS = [
  { key: "shorter",      label: "✂️ Shorter"      },
  { key: "warmer",       label: "🌡️ Warmer"       },
  { key: "professional", label: "💼 Professional"  },
];

function computeCompleteness(twin: {
  name?: string | null;
  personality?: PersonalityTraits | null;
  photos: number;
}): { score: number; items: { label: string; done: boolean }[] } {
  const p = twin.personality;
  const items = [
    { label: "Name",              done: !!twin.name },
    { label: "Profession",        done: !!p?.profession },
    { label: "Location",          done: !!p?.location },
    { label: "Tone",              done: (p?.tone?.length ?? 0) > 0 },
    { label: "Values",            done: (p?.values?.length ?? 0) > 0 },
    { label: "Humour style",      done: !!p?.humor },
    { label: "Signature phrases", done: (p?.signaturePhrases?.length ?? 0) > 0 },
    { label: "Photos",            done: twin.photos > 0 },
  ];
  const score = Math.round((items.filter((i) => i.done).length / items.length) * 100);
  return { score, items };
}

export default function ChatPage() {
  const [messages,      setMessages]      = useState<Message[]>([]);
  const [input,         setInput]         = useState("");
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [twinName,      setTwinName]      = useState("Your Twin");
  const [completeness,  setCompleteness]  = useState<{ score: number; items: { label: string; done: boolean }[] } | null>(null);
  const [savedIdx,      setSavedIdx]      = useState<Set<number>>(new Set());
  const [savingIdx,     setSavingIdx]     = useState<number | null>(null);
  const [correctingIdx,    setCorrectingIdx]    = useState<number | null>(null);
  const [correctionText,   setCorrectionText]   = useState("");
  const [correctionSaving, setCorrectionSaving] = useState(false);
  const [correctedIdx,     setCorrectedIdx]     = useState<Set<number>>(new Set());
  const [toneLoading,      setToneLoading]      = useState<string | null>(null);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/twin").then((r) => r.json()),
      fetch("/api/likeness").then((r) => r.json()),
    ]).then(([{ twin }, { photos }]) => {
      if (!twin) {
        setCompleteness({ score: 0, items: [] });
        return;
      }
      if (twin.name) setTwinName(twin.name);
      setCompleteness(computeCompleteness({
        name: twin.name,
        personality: twin.personality,
        photos: (photos as unknown[])?.length ?? 0,
      }));
    }).catch(() => {
      setCompleteness({ score: 0, items: [] });
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const unlocked = completeness !== null && completeness.score >= UNLOCK_THRESHOLD;

  async function handleCorrect(idx: number) {
    if (!correctionText.trim() || correctionSaving) return;
    setCorrectionSaving(true);
    const assistantMsg = messages[idx];
    const userMsg      = messages[idx - 1];
    await fetch("/api/memories", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title:      `Chat correction — "${(userMsg?.content ?? "").slice(0, 60)}${(userMsg?.content ?? "").length > 60 ? "…" : ""}"`,
        content:    `When asked:\n"${userMsg?.content ?? "..."}"\n\nMy twin responded:\n"${assistantMsg.content}"\n\nI would actually say:\n"${correctionText.trim()}"`,
        category:   "correction",
        visibility: "twin_only",
        importance: "high",
      }),
    });
    setCorrectionSaving(false);
    setCorrectedIdx((prev) => new Set(prev).add(idx));
    setCorrectingIdx(null);
    setCorrectionText("");
  }

  async function handleToneAdjust(toneKey: string) {
    if (toneLoading) return;
    const lastAssistantIdx = messages.reduceRight(
      (acc: number, m, i) => acc === -1 && m.role === "assistant" ? i : acc, -1
    );
    if (lastAssistantIdx === -1) return;
    setToneLoading(toneKey);
    setError("");
    const toneInstructions: Record<string, string> = {
      shorter:      "Rephrase your last response to be shorter and more concise. Reply with only the rephrased text.",
      warmer:       "Rephrase your last response with a warmer, friendlier tone. Reply with only the rephrased text.",
      professional: "Rephrase your last response to be more professional. Reply with only the rephrased text.",
    };
    try {
      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.slice(0, lastAssistantIdx),
            { role: "user", content: toneInstructions[toneKey] },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMessages((prev) => {
        const next = [...prev];
        next[lastAssistantIdx] = { role: "assistant", content: data.reply };
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tone adjustment failed");
    } finally {
      setToneLoading(null);
    }
  }

  async function saveAsMemory(content: string, idx: number) {
    setSavingIdx(idx);
    const title = content.length > 60 ? content.slice(0, 57) + "..." : content;
    await fetch("/api/memories", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ title, content, category: "other", visibility: "twin_only", importance: "medium" }),
    });
    setSavingIdx(null);
    setSavedIdx((prev) => new Set(prev).add(idx));
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading || !unlocked) return;

    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to get a reply");
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setMessages(next.slice(0, -1));
      setInput(text);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ── Locked state ──────────────────────────────────────────────
  if (completeness !== null && !unlocked) {
    const missing = completeness.items.filter((i) => !i.done);
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-4xl">
            🔒
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-sm">
            🪞
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Talk to Twin — Locked</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Your Twin needs to be at least <span className="text-indigo-400 font-semibold">{UNLOCK_THRESHOLD}% trained</span> before you can have a real conversation with it.
          </p>
        </div>

        {/* Progress */}
        <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">Training progress</span>
            <span className={`text-sm font-bold ${completeness.score >= 50 ? "text-amber-400" : "text-slate-500"}`}>
              {completeness.score}% / {UNLOCK_THRESHOLD}%
            </span>
          </div>
          <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
              style={{ width: `${completeness.score}%` }}
            />
            {/* Threshold marker */}
            <div
              className="h-2.5 w-0.5 bg-white/30 absolute"
              style={{ marginLeft: `${UNLOCK_THRESHOLD}%`, marginTop: "-10px" }}
            />
          </div>

          {/* Missing items */}
          {missing.length > 0 && (
            <div className="pt-2 space-y-1.5">
              <p className="text-xs text-slate-500 font-medium">Still needed to unlock:</p>
              <div className="flex flex-wrap gap-1.5">
                {missing.map((item) => (
                  <span key={item.label} className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-2.5 py-1 rounded-full">
                    ○ {item.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {completeness.items.filter((i) => i.done).map((item) => (
            <div key={item.label} className="hidden" />
          ))}
        </div>

        <Link
          href="/twin"
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors"
        >
          🤖 Continue Training My Twin
        </Link>

        <p className="text-xs text-slate-600">
          {UNLOCK_THRESHOLD - completeness.score}% more needed to unlock
        </p>
      </div>
    );
  }

  // ── Loading skeleton ──────────────────────────────────────────
  if (completeness === null) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="flex gap-1.5 items-center">
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    );
  }

  // ── Chat UI ───────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] max-w-3xl mx-auto -mt-4 sm:-mt-6">

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between py-4 sm:py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)] shrink-0" />
          <div>
            <h1 className="text-lg font-bold text-white leading-none">{twinName}</h1>
            <p className="text-xs text-slate-500 mt-0.5">Talk to yourself · {completeness.score}% trained</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => { setMessages([]); setError(""); }}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800"
          >
            Clear chat
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0">

        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl mb-4">🪞</div>
            <h2 className="text-white font-semibold mb-1">Say something to your Twin</h2>
            <p className="text-slate-500 text-sm max-w-xs">
              Type anything — your Twin will reply exactly as you would. Great for testing how it sounds.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {[
                "Hey, how are you doing?",
                "What do you think about AI?",
                "Tell me about yourself",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                  className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 px-3 py-2 rounded-xl transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {(() => {
          const lastAssistantIdx = messages.reduceRight(
            (acc: number, m, i) => acc === -1 && m.role === "assistant" ? i : acc, -1
          );
          return messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-700/50 flex items-center justify-center text-sm shrink-0 mr-2 mt-0.5">
                🤖
              </div>
            )}
            <div className="max-w-[80%] flex flex-col gap-1">
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
              {msg.role === "assistant" && (
                <div className="flex flex-col gap-1.5">
                  {/* Action row */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => saveAsMemory(msg.content, i)}
                      disabled={savingIdx === i || savedIdx.has(i)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        savedIdx.has(i)
                          ? "bg-green-900/30 text-green-400 border-green-800/50"
                          : "bg-slate-800/50 text-slate-500 border-slate-700 hover:text-slate-300 hover:border-slate-600"
                      }`}
                    >
                      {savedIdx.has(i) ? "✓ Saved" : savingIdx === i ? "Saving..." : "💾 Save as memory"}
                    </button>
                    {correctedIdx.has(i) ? (
                      <span className="text-xs text-teal-400 px-1 py-1">✓ Correction saved</span>
                    ) : correctingIdx !== i && (
                      <button
                        onClick={() => { setCorrectingIdx(i); setCorrectionText(""); }}
                        className="text-xs px-2.5 py-1 rounded-lg border bg-slate-800/50 text-slate-500 border-slate-700 hover:text-teal-400 hover:border-teal-800/50 transition-all"
                      >
                        ✏️ Correct this
                      </button>
                    )}
                  </div>

                  {/* Correction form */}
                  {correctingIdx === i && (
                    <div className="space-y-2 bg-slate-800/40 rounded-xl p-3 border border-teal-800/30">
                      <p className="text-xs text-slate-400">What would you actually say?</p>
                      <textarea
                        value={correctionText}
                        onChange={(e) => setCorrectionText(e.target.value)}
                        placeholder="Type your preferred reply..."
                        rows={3}
                        autoFocus
                        className="w-full bg-slate-800 border border-teal-700/50 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none text-sm leading-relaxed"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setCorrectingIdx(null); setCorrectionText(""); }}
                          className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 border border-slate-700 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleCorrect(i)}
                          disabled={!correctionText.trim() || correctionSaving}
                          className="flex-1 bg-teal-700 hover:bg-teal-600 disabled:opacity-40 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors"
                        >
                          {correctionSaving ? "Saving..." : "✏️ Teach Twin"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tone adjustment — last assistant message only */}
                  {i === lastAssistantIdx && !loading && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-slate-600">Adjust:</span>
                      {TONE_TWEAKS.map((t) => (
                        <button
                          key={t.key}
                          onClick={() => handleToneAdjust(t.key)}
                          disabled={toneLoading !== null}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all disabled:opacity-50 ${
                            toneLoading === t.key
                              ? "bg-indigo-900/50 text-indigo-300 border-indigo-700"
                              : "bg-slate-800/50 text-slate-500 border-slate-700 hover:text-slate-300 hover:border-slate-600"
                          }`}
                        >
                          {toneLoading === t.key ? (
                            <span className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 border border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin inline-block" />
                              {t.label}
                            </span>
                          ) : t.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-sm shrink-0 ml-2 mt-0.5">
                👤
              </div>
            )}
          </div>
          ));
        })()}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-700/50 flex items-center justify-center text-sm shrink-0 mr-2 mt-0.5">
              🤖
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center h-4">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-xl px-4 py-2">
              {error}
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 pb-4 pt-3 border-t border-slate-800">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Say something..."
            rows={1}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none text-sm leading-relaxed max-h-32 overflow-y-auto"
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 128) + "px";
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shrink-0"
            aria-label="Send"
          >
            <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-slate-700 mt-2 text-center">Enter to send · Shift+Enter for new line · Not saved</p>
      </div>
    </div>
  );
}
