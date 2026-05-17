"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import type { PersonalityTraits, WritingStyle } from "@/types";
import { VoiceRecorder } from "@/components/voice/voice-recorder";
import { CameraCapture } from "@/components/camera-capture";

type Tab = "profile" | "style";

const FORMALITY_OPTIONS = [
  { value: "casual",       label: "Casual",       desc: "Relaxed, conversational" },
  { value: "professional", label: "Professional",  desc: "Formal, polished" },
  { value: "mixed",        label: "Mixed",         desc: "Depends on context" },
] as const;

const MESSAGE_LENGTH_OPTIONS = [
  { value: "short",  label: "Short",  desc: "One-liners, brief" },
  { value: "medium", label: "Medium", desc: "A few sentences" },
  { value: "long",   label: "Long",   desc: "Detailed responses" },
] as const;

const HUMOR_OPTIONS = [
  { value: "dry",       label: "Dry",       icon: "🌵" },
  { value: "sarcastic", label: "Sarcastic", icon: "😏" },
  { value: "witty",     label: "Witty",     icon: "⚡" },
  { value: "dad jokes", label: "Dad jokes", icon: "🧔" },
  { value: "playful",   label: "Playful",   icon: "😄" },
  { value: "none",      label: "None",      icon: "🎯" },
] as const;

export default function TwinPage() {
  const [tab,       setTab]       = useState<Tab>("profile");

  // Identity
  const [name,      setName]      = useState("");
  const [profession, setProfession] = useState("");
  const [location,  setLocation]  = useState("");
  const [lifeContext, setLifeContext] = useState("");

  // Personality
  const [tone,      setTone]      = useState("");
  const [values,    setValues]    = useState("");
  const [humor,     setHumor]     = useState("");
  const [signaturePhrases, setSignaturePhrases] = useState("");
  const [avoids,    setAvoids]    = useState("");

  // Writing style
  const [formality,      setFormality]      = useState<WritingStyle["formality"]>("mixed");
  const [messageLength,  setMessageLength]  = useState<"short" | "medium" | "long">("medium");
  const [usesEmoji,      setUsesEmoji]      = useState(false);
  const [patterns,       setPatterns]       = useState("");

  // UI state
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [loaded,    setLoaded]    = useState(false);

  // Photos
  const [photos,        setPhotos]        = useState<{ id: string; url: string; label: string | null }[]>([]);
  const [uploading,     setUploading]     = useState(false);
  const [showCamera,    setShowCamera]    = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Style analysis
  const [samples,       setSamples]       = useState("");
  const [analyzing,     setAnalyzing]     = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  // Voice clone
  const [voiceCloneId,   setVoiceCloneId]   = useState<string | null>(null);
  const [recordingCount, setRecordingCount] = useState(0);
  const [cloning,        setCloning]        = useState(false);
  const [cloneError,     setCloneError]     = useState("");
  const [cloneSuccess,   setCloneSuccess]   = useState(false);
  const [memoryCount,    setMemoryCount]    = useState(0);

  useEffect(() => {
    Promise.all([
      fetch("/api/likeness").then((r) => r.json()),
      fetch("/api/voice").then((r) => r.json()),
      fetch("/api/memories").then((r) => r.json()),
    ]).then(([{ photos }, { recordings }, { memories }]) => {
      if (photos) setPhotos(photos);
      setRecordingCount((recordings as unknown[])?.length ?? 0);
      setMemoryCount((memories as unknown[])?.length ?? 0);
    });
  }, []);

  useEffect(() => {
    fetch("/api/twin")
      .then((r) => r.json())
      .then(({ twin }) => {
        setLoaded(true);
        if (!twin) return;
        setName(twin.name ?? "");
        setVoiceCloneId(twin.elevenLabsVoiceId ?? null);
        const p = twin.personality as PersonalityTraits | null;
        const s = twin.writingStyle as WritingStyle | null;
        if (p) {
          setTone(p.tone?.join(", ") ?? "");
          setValues(p.values?.join(", ") ?? "");
          setProfession(p.profession ?? "");
          setLocation(p.location ?? "");
          setLifeContext(p.lifeContext ?? "");
          setHumor(p.humor ?? "");
          setSignaturePhrases(p.signaturePhrases?.join(", ") ?? "");
          setAvoids(p.avoids?.join(", ") ?? "");
        }
        if (s) {
          setFormality(s.formality ?? "mixed");
          setUsesEmoji(s.usesEmoji ?? false);
          setMessageLength(s.messageLength ?? "medium");
          setPatterns(s.patterns?.join(", ") ?? "");
        }
      });
  }, []);

  async function uploadPhotoFiles(files: File[]) {
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const form = new FormData();
      form.append("photo", file);
      const res = await fetch("/api/likeness", { method: "POST", body: form });
      const { photo } = await res.json();
      if (photo) setPhotos((prev) => [...prev, photo]);
    }
    setUploading(false);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    await uploadPhotoFiles(Array.from(e.target.files ?? []));
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  async function handleCameraCapture(file: File, _label: string) {
    await uploadPhotoFiles([file]);
  }

  async function handleDeletePhoto(id: string) {
    setDeletingPhoto(id);
    await fetch(`/api/likeness/${id}`, { method: "DELETE" });
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    setDeletingPhoto(null);
  }

  async function handleAnalyze() {
    const sampleList = samples.split("\n---\n").map((s) => s.trim()).filter(Boolean);
    if (!sampleList.length) return;
    setAnalyzing(true);
    setAnalysisError("");
    try {
      const res = await fetch("/api/twin/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ samples: sampleList }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      const { analysis } = data;
      if (analysis.tone?.length)                   setTone(analysis.tone.join(", "));
      if (analysis.values?.length)                 setValues(analysis.values.join(", "));
      if (analysis.formality)                      setFormality(analysis.formality);
      if (typeof analysis.usesEmoji === "boolean") setUsesEmoji(analysis.usesEmoji);
      if (analysis.patterns?.length)               setPatterns(analysis.patterns.join(", "));
      setTab("profile");
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleCreateClone() {
    setCloning(true);
    setCloneError("");
    setCloneSuccess(false);
    try {
      const res = await fetch("/api/voice/clone", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create voice clone");
      setVoiceCloneId(data.voiceId);
      setCloneSuccess(true);
      setTimeout(() => setCloneSuccess(false), 4000);
    } catch (err) {
      setCloneError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCloning(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    const personality: PersonalityTraits = {
      tone:             tone.split(",").map((s) => s.trim()).filter(Boolean),
      values:           values.split(",").map((s) => s.trim()).filter(Boolean),
      communication:    formality === "professional" ? "formal" : "direct",
      profession:       profession.trim() || undefined,
      location:         location.trim() || undefined,
      lifeContext:      lifeContext.trim() || undefined,
      humor:            humor || undefined,
      signaturePhrases: signaturePhrases.split(",").map((s) => s.trim()).filter(Boolean),
      avoids:           avoids.split(",").map((s) => s.trim()).filter(Boolean),
    };
    const writingStyle: WritingStyle = {
      formality, usesEmoji, messageLength,
      sentenceLength: messageLength,
      vocabulary: [],
      patterns: patterns.split(",").map((s) => s.trim()).filter(Boolean),
    };
    await fetch("/api/twin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, personality, writingStyle }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const toneTags  = tone.split(",").map((s) => s.trim()).filter(Boolean);
  const valueTags = values.split(",").map((s) => s.trim()).filter(Boolean);

  // ── AI Readiness Score ──────────────────────────────────────────────────────
  const identityScore    = (name ? 5 : 0) + (profession ? 5 : 0) + (location ? 5 : 0) + (lifeContext ? 5 : 0);
  const personalityScore = (tone ? 5 : 0) + (values ? 5 : 0) + (humor ? 5 : 0) + (signaturePhrases ? 5 : 0) + (avoids ? 5 : 0);
  const likenessScore    = photos.length >= 5 ? 20 : photos.length >= 3 ? 10 : photos.length >= 1 ? 5 : 0;
  const voiceScore       = voiceCloneId ? 20 : recordingCount >= 3 ? 10 : recordingCount >= 1 ? 5 : 0;
  const memScore         = memoryCount >= 10 ? 15 : memoryCount >= 5 ? 10 : memoryCount >= 1 ? 5 : 0;
  const readinessScore   = identityScore + personalityScore + likenessScore + voiceScore + memScore;

  const TIERS = [
    { min: 76, label: "Marketplace-ready", icon: "🌟", bar: "bg-green-500",  text: "text-green-400",  border: "border-green-800/40",  bg: "bg-green-900/20"  },
    { min: 51, label: "Usable Twin",       icon: "✅", bar: "bg-amber-500",  text: "text-amber-400",  border: "border-amber-800/40",  bg: "bg-amber-900/20"  },
    { min: 26, label: "Partial Twin",      icon: "⚡", bar: "bg-orange-500", text: "text-orange-400", border: "border-orange-800/40", bg: "bg-orange-900/20" },
    { min: 0,  label: "Basic Profile",     icon: "🌱", bar: "bg-slate-500",  text: "text-slate-400",  border: "border-slate-700",     bg: "bg-slate-900"     },
  ] as const;
  const tier = TIERS.find((t) => readinessScore >= t.min) ?? TIERS[3];

  const SCORE_CATS = [
    { label: "Identity",    score: identityScore,    max: 20, icon: "👤", hint: "Name, profession, location, life context" },
    { label: "Personality", score: personalityScore, max: 25, icon: "🧠", hint: "Tone, values, humor, phrases, avoids"     },
    { label: "Likeness",    score: likenessScore,    max: 20, icon: "📸", hint: "1 photo +5 · 3 photos +10 · 5+ photos +20"   },
    { label: "Voice",       score: voiceScore,       max: 20, icon: "🎙️", hint: "Recordings +5/+10 · Voice clone +20"     },
    { label: "Memory",      score: memScore,         max: 15, icon: "🧩", hint: "1 memory +5 · 5 memories +10 · 10+ +15"  },
  ] as const;

  return (
    <div className="max-w-5xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">My Twin</h1>
          <p className="text-slate-400">The more detail you give, the more authentic your Twin becomes.</p>
        </div>
        {tab === "profile" && (
          <button
            onClick={handleSave}
            disabled={saving || !loaded}
            className={`hidden md:flex items-center gap-2 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all ${
              saved ? "bg-green-700 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"
            } disabled:opacity-40`}
          >
            {saved ? "✓ Saved!" : saving ? "Saving..." : "Save Twin"}
          </button>
        )}
      </div>

      {/* AI Readiness Score */}
      <div className={`border rounded-2xl p-5 ${tier.bg} ${tier.border}`}>
        {/* Score header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-0.5">AI Readiness Score</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-white">{readinessScore}</span>
              <span className="text-slate-500 text-lg font-light">/100</span>
              <span className={`ml-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${tier.text} ${tier.border} ${tier.bg}`}>
                {tier.icon} {tier.label}
              </span>
            </div>
          </div>
          {/* Circular indicator */}
          <div className="relative w-16 h-16 shrink-0">
            <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#1e293b" strokeWidth="3" />
              <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3"
                className={tier.bar.replace("bg-", "stroke-")}
                strokeDasharray={`${(readinessScore / 100) * 87.96} 87.96`}
                strokeLinecap="round" />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${tier.text}`}>
              {readinessScore}%
            </span>
          </div>
        </div>

        {/* Master bar */}
        <div className="h-2 bg-slate-800 rounded-full mb-5 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-700 ${tier.bar}`}
            style={{ width: `${readinessScore}%` }}
          />
        </div>

        {/* Category breakdown */}
        <div className="space-y-2.5">
          {SCORE_CATS.map((cat) => (
            <div key={cat.label}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{cat.icon}</span>
                  <span className="text-xs font-medium text-slate-300">{cat.label}</span>
                  <span className="hidden sm:inline text-xs text-slate-600">— {cat.hint}</span>
                </div>
                <span className={`text-xs font-bold ${cat.score === cat.max ? "text-green-400" : tier.text}`}>
                  {cat.score}/{cat.max}
                </span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${cat.score === cat.max ? "bg-green-500" : tier.bar}`}
                  style={{ width: `${(cat.score / cat.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-2xl p-1 max-w-sm">
        {(["profile", "style"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === t ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            }`}
          >
            {t === "profile" ? "🤖 Profile" : "✦ Analyze Style"}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">

            {/* ── About You ── */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">About You</h2>

              <Field label="Twin Name" hint="What should your Twin be called?">
                <input value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Craig's Twin" className="input" />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Profession" hint="What do you do?">
                  <input value={profession} onChange={(e) => setProfession(e.target.value)}
                    placeholder="e.g. Software developer" className="input" />
                </Field>
                <Field label="Location" hint="Where are you based?">
                  <input value={location} onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Cape Town, South Africa" className="input" />
                </Field>
              </div>

              <Field label="Current Life Context" hint="What's going on in your life right now?">
                <textarea value={lifeContext} onChange={(e) => setLifeContext(e.target.value)}
                  placeholder="e.g. Building a startup, recently moved cities, training for a marathon — context that affects how you'd reply to things"
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none text-sm leading-relaxed"
                />
              </Field>
            </div>

            {/* ── Personality ── */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Personality</h2>

              <Field label="Your Tone" hint="Comma-separated words">
                <input value={tone} onChange={(e) => setTone(e.target.value)}
                  placeholder="e.g. warm, direct, witty, laid-back" className="input" />
                {toneTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {toneTags.map((t) => (
                      <span key={t} className="text-xs bg-indigo-900/50 border border-indigo-800 text-indigo-300 px-2.5 py-1 rounded-full">{t}</span>
                    ))}
                  </div>
                )}
              </Field>

              <Field label="Core Values" hint="What matters most to you">
                <input value={values} onChange={(e) => setValues(e.target.value)}
                  placeholder="e.g. honesty, creativity, loyalty, family" className="input" />
                {valueTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {valueTags.map((v) => (
                      <span key={v} className="text-xs bg-purple-900/50 border border-purple-800 text-purple-300 px-2.5 py-1 rounded-full">{v}</span>
                    ))}
                  </div>
                )}
              </Field>

              <div>
                <p className="text-sm font-medium text-slate-300 mb-3">Humour Style</p>
                <div className="flex flex-wrap gap-2">
                  {HUMOR_OPTIONS.map((h) => (
                    <button key={h.value} onClick={() => setHumor(humor === h.value ? "" : h.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        humor === h.value
                          ? "bg-indigo-900/50 border-indigo-600 text-white"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300"
                      }`}>
                      {h.icon} {h.label}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Signature Phrases" hint="Things you always say — comma-separated">
                <input value={signaturePhrases} onChange={(e) => setSignaturePhrases(e.target.value)}
                  placeholder={`e.g. "no worries", "lekker", "100%", "makes sense"`} className="input" />
              </Field>

              <Field label="Things You Never Say" hint="Language or topics you actively avoid">
                <input value={avoids} onChange={(e) => setAvoids(e.target.value)}
                  placeholder="e.g. corporate jargon, swearing, overly formal greetings" className="input" />
              </Field>
            </div>

            {/* ── Writing Style ── */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Writing Style</h2>

              <Field label="Writing Patterns" hint="How you structure messages">
                <input value={patterns} onChange={(e) => setPatterns(e.target.value)}
                  placeholder="e.g. asks follow-up questions, gets straight to the point, uses bullet points" className="input" />
              </Field>

              <div>
                <p className="text-sm font-medium text-slate-300 mb-3">Formality Level</p>
                <div className="grid grid-cols-3 gap-2">
                  {FORMALITY_OPTIONS.map((opt) => (
                    <button key={opt.value} onClick={() => setFormality(opt.value)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        formality === opt.value
                          ? "bg-indigo-900/50 border-indigo-600 text-white"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}>
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-300 mb-3">Typical Message Length</p>
                <div className="grid grid-cols-3 gap-2">
                  {MESSAGE_LENGTH_OPTIONS.map((opt) => (
                    <button key={opt.value} onClick={() => setMessageLength(opt.value)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        messageLength === opt.value
                          ? "bg-indigo-900/50 border-indigo-600 text-white"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}>
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => setUsesEmoji(!usesEmoji)}
                className={`flex items-center justify-between w-full p-4 rounded-xl border transition-all ${
                  usesEmoji ? "bg-indigo-900/30 border-indigo-700 text-white" : "bg-slate-800 border-slate-700 text-slate-400"
                }`}>
                <div className="text-left">
                  <p className="text-sm font-medium">Uses emoji</p>
                  <p className="text-xs text-slate-500 mt-0.5">Include emoji naturally in replies</p>
                </div>
                <div className={`w-10 h-6 rounded-full transition-all relative ${usesEmoji ? "bg-indigo-600" : "bg-slate-700"}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${usesEmoji ? "left-5" : "left-1"}`} />
                </div>
              </button>
            </div>

            {/* ── Voice Recordings ── */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-1">Voice Profile</h2>
                <p className="text-xs text-slate-500">Read the script prompts aloud to capture how you naturally speak. Used for your Twin's voice and Reel Creator audio.</p>
              </div>
              <VoiceRecorder onSaved={() => setRecordingCount((c) => c + 1)} />

              {/* Voice clone status */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-300">Voice Clone</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {voiceCloneId
                        ? "Your voice clone is active — used for TTS on the Reply page."
                        : recordingCount >= 3
                        ? `${recordingCount} samples ready — create your voice clone below.`
                        : `${recordingCount}/3 samples recorded — need at least 3 to create a clone.`}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    voiceCloneId
                      ? "bg-green-900/40 text-green-400 border-green-800/50"
                      : "bg-slate-800 text-slate-500 border-slate-700"
                  }`}>
                    {voiceCloneId ? "Active" : "Not created"}
                  </span>
                </div>

                {cloneError && (
                  <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-xl px-3 py-2">
                    {cloneError}
                  </p>
                )}
                {cloneSuccess && (
                  <p className="text-xs text-green-400 bg-green-900/20 border border-green-800/40 rounded-xl px-3 py-2">
                    ✓ Voice clone created! The Listen button on the Reply page is now active.
                  </p>
                )}

                <button
                  onClick={handleCreateClone}
                  disabled={cloning || recordingCount < 3}
                  className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl text-sm transition-all ${
                    voiceCloneId
                      ? "bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {cloning ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating voice clone...
                    </>
                  ) : voiceCloneId ? (
                    "🔄 Re-create Voice Clone"
                  ) : (
                    "🎙️ Create My Voice Clone"
                  )}
                </button>
              </div>
            </div>

            {/* ── Likeness Photos ── */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Likeness Photos</h2>
              <p className="text-xs text-slate-500">Upload multiple photos — different angles, expressions, lighting. These train your visual likeness for Reel Creator and avatar features.</p>

              {/* Hidden file input */}
              <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                multiple className="hidden" onChange={handlePhotoUpload} />

              {/* Action buttons */}
              <div className="flex gap-2">
                <button onClick={() => photoInputRef.current?.click()} disabled={uploading}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-40">
                  📁 Upload Photos
                </button>
                <button onClick={() => setShowCamera(true)} disabled={uploading}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-40">
                  📷 Take Photo
                </button>
              </div>

              {showCamera && (
                <CameraCapture onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />
              )}

              {photos.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {photos.map((p) => (
                      <div key={p.id} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-800 border border-slate-700">
                        <Image src={p.url} alt={p.label ?? "Likeness photo"} fill className="object-cover" />
                        <button onClick={() => handleDeletePhoto(p.id)} disabled={deletingPhoto === p.id}
                          className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="text-white text-lg">✕</span>
                        </button>
                      </div>
                    ))}
                  </div>
                  {uploading && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="w-3 h-3 border border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                      Uploading...
                    </div>
                  )}
                  {photos.length < 5 && <p className="text-xs text-amber-500/80">💡 Add at least 5 photos for best likeness coverage</p>}
                  {photos.length >= 5 && <p className="text-xs text-green-500/80">✓ {photos.length} photos — good coverage</p>}
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center">
                  <p className="text-3xl mb-2">📸</p>
                  <p className="text-sm text-slate-500">Upload photos or take one with your camera</p>
                  <p className="text-xs text-slate-600 mt-1">Front, side, expressions, different lighting</p>
                </div>
              )}
            </div>

            {/* Mobile save */}
            <button onClick={handleSave} disabled={saving || !loaded}
              className={`md:hidden w-full font-semibold py-3.5 rounded-xl text-sm transition-all ${
                saved ? "bg-green-700 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"
              } disabled:opacity-40`}>
              {saved ? "✓ Saved!" : saving ? "Saving..." : "Save Twin"}
            </button>
          </div>

          {/* Preview panel */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Profile Preview</h2>
              <div className="space-y-4">

                {/* Avatar strip */}
                <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                  <div className="flex -space-x-2">
                    {photos.slice(0, 3).map((p) => (
                      <div key={p.id} className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-900 shrink-0">
                        <Image src={p.url} alt="" width={40} height={40} className="object-cover w-full h-full" />
                      </div>
                    ))}
                    {photos.length === 0 && (
                      <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-lg">🪞</div>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{name || "Your Twin"}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{photos.length} photo{photos.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>

                {profession && (
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Profession</p>
                    <p className="text-white text-sm">{profession}</p>
                  </div>
                )}
                {location && (
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Location</p>
                    <p className="text-white text-sm">{location}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-600 mb-2">Tone</p>
                  {toneTags.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {toneTags.map((t) => (
                        <span key={t} className="text-xs bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-800/50">{t}</span>
                      ))}
                    </div>
                  ) : <p className="text-slate-600 text-xs">Not set</p>}
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-2">Values</p>
                  {valueTags.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {valueTags.map((v) => (
                        <span key={v} className="text-xs bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded-full border border-purple-800/50">{v}</span>
                      ))}
                    </div>
                  ) : <p className="text-slate-600 text-xs">Not set</p>}
                </div>
                {humor && (
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Humour</p>
                    <p className="text-white text-sm capitalize">{humor}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-600 mb-1">Formality</p>
                  <p className="text-white text-sm capitalize">{formality}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Message length</p>
                  <p className="text-white text-sm capitalize">{messageLength}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Emoji</p>
                  <p className="text-white text-sm">{usesEmoji ? "Yes 😊" : "No"}</p>
                </div>
              </div>
            </div>

            <div className={`rounded-2xl p-5 border ${tier.bg} ${tier.border}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{tier.icon}</span>
                <p className={`text-sm font-semibold ${tier.text}`}>{tier.label}</p>
                <span className="ml-auto text-xs font-black text-white">{readinessScore}/100</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {readinessScore >= 76
                  ? "Your Twin is marketplace-ready. List it to start earning."
                  : readinessScore >= 51
                  ? "Your Twin can generate replies and chat. Add more to reach marketplace level."
                  : readinessScore >= 26
                  ? "Keep adding details — personality, memories, and voice make a big difference."
                  : "Get started by filling in your profile, tone, and values."}
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === "style" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-white mb-1">Analyze Your Writing</h2>
              <p className="text-slate-400 text-sm">
                Paste real messages you&apos;ve sent — separated by <code className="bg-slate-800 px-1.5 py-0.5 rounded text-xs text-slate-300">---</code> on its own line. Claude will detect your style and auto-fill your profile.
              </p>
            </div>
            <textarea
              value={samples}
              onChange={(e) => setSamples(e.target.value)}
              placeholder={`Hey! Just checking in, hope everything's going well 😊\n---\nSounds good, let's catch up Thursday. I can do 3pm or after 5, whatever works for you\n---\nHonestly I think we should just go for it. Worst case we learn something`}
              rows={12}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none text-sm font-mono leading-relaxed"
            />
            {analysisError && <p className="text-red-400 text-sm">{analysisError}</p>}
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !samples.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold py-3.5 rounded-xl transition-all text-sm"
            >
              {analyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analysing your style...
                </span>
              ) : "Analyse My Writing Style ✦"}
            </button>
            <p className="text-xs text-slate-600 text-center">Results auto-fill your profile</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center">
            <div className="text-5xl mb-4">✦</div>
            <h3 className="font-semibold text-white mb-2">How it works</h3>
            <div className="space-y-3 text-left w-full max-w-xs">
              {[
                { n: "1", t: "Paste 3–10 real messages you've sent" },
                { n: "2", t: "Separate each with --- on its own line" },
                { n: "3", t: "Click Analyse — Claude reads your patterns" },
                { n: "4", t: "Your profile gets auto-filled instantly" },
              ].map((s) => (
                <div key={s.n} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-indigo-900 border border-indigo-700 text-indigo-300 text-xs flex items-center justify-center shrink-0 mt-0.5">{s.n}</span>
                  <p className="text-sm text-slate-400">{s.t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        {hint && <span className="text-xs text-slate-600">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
