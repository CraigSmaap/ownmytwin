"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const SCRIPT = [
  { id: 1, label: "Greeting",    text: "Hey, just checking in — hope everything's going well on your end." },
  { id: 2, label: "Casual yes",  text: "Sounds great to me, let's make it happen. Really excited about this." },
  { id: 3, label: "Follow-up",   text: "I'll circle back with you once I've had a proper look at it." },
  { id: 4, label: "Uncertain",   text: "Honestly, I'm not too sure about that one — what do you think?" },
  { id: 5, label: "Reassuring",  text: "No worries at all, take all the time you need. There's no rush." },
  { id: 6, label: "Enthusiastic",text: "That's a really solid idea, I love where this is going — let's do it." },
  { id: 7, label: "Wrap-up",     text: "Appreciate you reaching out. Means a lot. Talk soon." },
  { id: 8, label: "Reflection",  text: "Looking back, I think that was one of the best decisions I've ever made." },
];

type Recording = { id: string; url: string; label: string | null; duration: number | null };

interface Props {
  compact?: boolean;
  onSaved?: (recording: Recording) => void;
}

export function VoiceRecorder({ compact = false, onSaved }: Props) {
  const [recordings, setRecordings]     = useState<Recording[]>([]);
  const [scriptIdx, setScriptIdx]       = useState(0);
  const [phase, setPhase]               = useState<"idle" | "recording" | "review">("idle");
  const [seconds, setSeconds]           = useState(0);
  const [blobUrl, setBlobUrl]           = useState<string | null>(null);
  const [blob, setBlob]                 = useState<Blob | null>(null);
  const [mimeType, setMimeType]         = useState("audio/webm");
  const [saving, setSaving]             = useState(false);
  const [permError, setPermError]       = useState<string | null>(null);
  const [loadingRecordings, setLoadingRecordings] = useState(true);

  const mediaRef    = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef    = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch("/api/voice")
      .then(r => r.json())
      .then(d => setRecordings(d.recordings ?? []))
      .finally(() => setLoadingRecordings(false));
  }, []);

  useEffect(() => {
    const supported =
      MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" :
      MediaRecorder.isTypeSupported("audio/webm")             ? "audio/webm" :
      MediaRecorder.isTypeSupported("audio/mp4")              ? "audio/mp4" :
      "audio/webm";
    setMimeType(supported);
  }, []);

  const startRecording = useCallback(async () => {
    setPermError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType });
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const b = new Blob(chunksRef.current, { type: mimeType });
        setBlob(b);
        setBlobUrl(URL.createObjectURL(b));
        setPhase("review");
      };
      mr.start(100);
      mediaRef.current = mr;
      setSeconds(0);
      setPhase("recording");
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("denied") || msg.includes("Permission")) {
        setPermError("Microphone access was denied. Please allow mic access in your browser settings and try again.");
      } else {
        setPermError("Could not access microphone. Make sure no other app is using it.");
      }
    }
  }, [mimeType]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRef.current?.stop();
  }, []);

  const discard = useCallback(() => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    setBlob(null);
    setPhase("idle");
    setSeconds(0);
  }, [blobUrl]);

  const save = useCallback(async () => {
    if (!blob) return;
    setSaving(true);
    const script = SCRIPT[scriptIdx];
    const form = new FormData();
    const ext = mimeType.includes("mp4") ? "mp4" : "webm";
    form.append("audio", new File([blob], `voice.${ext}`, { type: mimeType }));
    form.append("label", script.label);
    form.append("duration", String(seconds));
    const res = await fetch("/api/voice", { method: "POST", body: form });
    const data = await res.json();
    setSaving(false);
    if (data.recording) {
      const next = [...recordings, data.recording];
      setRecordings(next);
      onSaved?.(data.recording);
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
      setBlob(null);
      setPhase("idle");
      setSeconds(0);
      if (scriptIdx < SCRIPT.length - 1) setScriptIdx(i => i + 1);
    }
  }, [blob, blobUrl, mimeType, recordings, scriptIdx, seconds, onSaved]);

  const deleteRecording = useCallback(async (id: string) => {
    await fetch(`/api/voice/${id}`, { method: "DELETE" });
    setRecordings(r => r.filter(x => x.id !== id));
  }, []);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const currentScript = SCRIPT[scriptIdx];
  const done = recordings.length >= SCRIPT.length;

  return (
    <div className="space-y-6">
      {/* Progress pills */}
      <div className="flex flex-wrap gap-2">
        {SCRIPT.map((s, i) => {
          const recorded = recordings.some(r => r.label === s.label);
          return (
            <button
              key={s.id}
              onClick={() => { if (phase === "idle") setScriptIdx(i); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                recorded
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : i === scriptIdx
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              {recorded ? "✓ " : ""}{s.label}
            </button>
          );
        })}
      </div>

      {done ? (
        <div className="bg-green-900/20 border border-green-700/40 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-2">🎙️</div>
          <p className="text-green-400 font-semibold text-lg">All voice samples recorded!</p>
          <p className="text-slate-400 text-sm mt-1">Your twin's voice profile is complete.</p>
        </div>
      ) : (
        <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700">
          {/* Script card */}
          <div className="mb-5">
            <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-2">
              Read aloud — {currentScript.label}
            </p>
            <p className="text-white text-lg leading-relaxed font-medium">
              "{currentScript.text}"
            </p>
          </div>

          {/* Permission error */}
          {permError && (
            <div className="mb-4 bg-red-900/30 border border-red-700/40 rounded-xl p-3 text-sm text-red-300">
              {permError}
            </div>
          )}

          {phase === "idle" && (
            <button
              onClick={startRecording}
              className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold py-4 rounded-2xl text-lg transition-colors touch-manipulation"
            >
              <span className="w-4 h-4 rounded-full bg-red-400 animate-pulse" />
              Start Recording
            </button>
          )}

          {phase === "recording" && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 py-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 font-mono text-2xl font-bold">{fmt(seconds)}</span>
                <span className="text-slate-400 text-sm">Recording...</span>
              </div>
              <button
                onClick={stopRecording}
                className="w-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold py-4 rounded-2xl text-lg transition-colors touch-manipulation"
              >
                Stop Recording
              </button>
            </div>
          )}

          {phase === "review" && blobUrl && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400 text-center">Listen back before saving</p>
              <audio
                ref={audioRef}
                src={blobUrl}
                controls
                className="w-full rounded-xl"
                style={{ colorScheme: "dark" }}
              />
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={discard}
                  className="bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white font-semibold py-3.5 rounded-xl transition-colors touch-manipulation"
                >
                  Re-record
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors touch-manipulation"
                >
                  {saving ? "Saving..." : "Save ✓"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Saved recordings */}
      {!compact && recordings.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Saved — {recordings.length} / {SCRIPT.length}
          </p>
          {recordings.map(r => (
            <div key={r.id} className="flex items-center gap-3 bg-slate-800/40 rounded-xl px-4 py-3">
              <span className="text-green-400 text-sm">✓</span>
              <span className="text-slate-300 text-sm flex-1">{r.label ?? "Recording"}</span>
              {r.duration && <span className="text-slate-500 text-xs font-mono">{fmt(Math.round(r.duration))}</span>}
              <audio src={r.url} controls className="h-8 w-32 shrink-0" />
              <button
                onClick={() => deleteRecording(r.id)}
                className="text-slate-600 hover:text-red-400 transition-colors text-lg leading-none touch-manipulation p-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {loadingRecordings && (
        <p className="text-slate-500 text-sm text-center">Loading...</p>
      )}
    </div>
  );
}
