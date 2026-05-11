"use client";

import { useRef, useState, useEffect, useCallback } from "react";

const ANGLES = [
  {
    id: "front",
    label: "Front — Neutral",
    instruction: "Look straight at the camera, relax your face",
    svg: (
      <svg viewBox="0 0 80 80" className="w-20 h-20">
        <ellipse cx="40" cy="34" rx="18" ry="22" fill="none" stroke="white" strokeWidth="2" />
        <circle cx="40" cy="36" r="2.5" fill="white" opacity="0.7" />
        <line x1="40" y1="56" x2="40" y2="68" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="28" y1="62" x2="40" y2="68" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="52" y1="62" x2="40" y2="68" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "slight-left",
    label: "Slight Left Turn",
    instruction: "Turn your head slightly to your left",
    svg: (
      <svg viewBox="0 0 80 80" className="w-20 h-20">
        <ellipse cx="38" cy="34" rx="17" ry="22" fill="none" stroke="white" strokeWidth="2" />
        <circle cx="35" cy="36" r="2.5" fill="white" opacity="0.7" />
        <path d="M24 20 L16 20" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" markerEnd="url(#arrow)" />
        <line x1="38" y1="56" x2="36" y2="68" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="26" y1="63" x2="36" y2="68" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="50" y1="62" x2="36" y2="68" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <text x="8" y="24" fontSize="14" fill="#6366f1">←</text>
      </svg>
    ),
  },
  {
    id: "left",
    label: "Left Profile",
    instruction: "Turn fully to show your left side — ear visible",
    svg: (
      <svg viewBox="0 0 80 80" className="w-20 h-20">
        <ellipse cx="44" cy="34" rx="14" ry="22" fill="none" stroke="white" strokeWidth="2" />
        <circle cx="38" cy="36" r="2" fill="white" opacity="0.7" />
        <path d="M44 28 Q52 30 50 38 Q48 44 44 46" fill="none" stroke="white" strokeWidth="1.5" />
        <text x="6" y="40" fontSize="18" fill="#6366f1">←</text>
        <line x1="44" y1="56" x2="40" y2="68" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "slight-right",
    label: "Slight Right Turn",
    instruction: "Turn your head slightly to your right",
    svg: (
      <svg viewBox="0 0 80 80" className="w-20 h-20">
        <ellipse cx="42" cy="34" rx="17" ry="22" fill="none" stroke="white" strokeWidth="2" />
        <circle cx="45" cy="36" r="2.5" fill="white" opacity="0.7" />
        <text x="56" y="24" fontSize="14" fill="#6366f1">→</text>
        <line x1="42" y1="56" x2="44" y2="68" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="30" y1="62" x2="44" y2="68" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="54" y1="63" x2="44" y2="68" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "right",
    label: "Right Profile",
    instruction: "Turn fully to show your right side — ear visible",
    svg: (
      <svg viewBox="0 0 80 80" className="w-20 h-20">
        <ellipse cx="36" cy="34" rx="14" ry="22" fill="none" stroke="white" strokeWidth="2" />
        <circle cx="42" cy="36" r="2" fill="white" opacity="0.7" />
        <path d="M36 28 Q28 30 30 38 Q32 44 36 46" fill="none" stroke="white" strokeWidth="1.5" />
        <text x="54" y="40" fontSize="18" fill="#6366f1">→</text>
        <line x1="36" y1="56" x2="40" y2="68" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "chin-up",
    label: "Chin Up",
    instruction: "Tilt your chin up slightly — show your jawline",
    svg: (
      <svg viewBox="0 0 80 80" className="w-20 h-20">
        <ellipse cx="40" cy="36" rx="18" ry="20" fill="none" stroke="white" strokeWidth="2" />
        <circle cx="40" cy="32" r="2.5" fill="white" opacity="0.7" />
        <text x="34" y="14" fontSize="14" fill="#6366f1">↑</text>
        <line x1="40" y1="56" x2="40" y2="68" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="28" y1="62" x2="40" y2="68" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="52" y1="62" x2="40" y2="68" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "chin-down",
    label: "Chin Down",
    instruction: "Tilt your chin down slightly — look at the floor",
    svg: (
      <svg viewBox="0 0 80 80" className="w-20 h-20">
        <ellipse cx="40" cy="32" rx="18" ry="20" fill="none" stroke="white" strokeWidth="2" />
        <circle cx="40" cy="36" r="2.5" fill="white" opacity="0.7" />
        <text x="34" y="70" fontSize="14" fill="#6366f1">↓</text>
        <line x1="40" y1="52" x2="40" y2="60" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="28" y1="56" x2="40" y2="60" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="52" y1="56" x2="40" y2="60" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "smile",
    label: "Natural Smile",
    instruction: "Give your most natural, relaxed smile",
    svg: (
      <svg viewBox="0 0 80 80" className="w-20 h-20">
        <ellipse cx="40" cy="34" rx="18" ry="22" fill="none" stroke="white" strokeWidth="2" />
        <circle cx="40" cy="34" r="2.5" fill="white" opacity="0.7" />
        <path d="M32 42 Q40 50 48 42" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="40" y1="56" x2="40" y2="68" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="28" y1="62" x2="40" y2="68" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="52" y1="62" x2="40" y2="68" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

interface Props {
  onCapture: (file: File, label: string) => void;
  onClose: () => void;
}

export function CameraCapture({ onCapture, onClose }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [angleIdx,    setAngleIdx]    = useState(0);
  const [ready,       setReady]       = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [facingMode,  setFacingMode]  = useState<"user" | "environment">("user");
  const [captured,    setCaptured]    = useState<string | null>(null);
  const [done,        setDone]        = useState(false);
  const [capturedIds, setCapturedIds] = useState<Set<string>>(new Set());

  const startCamera = useCallback(async (mode: "user" | "environment") => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setReady(false);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setReady(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? (err.name + " " + err.message) : String(err);
      if (msg.includes("denied") || msg.includes("Permission") || msg.includes("NotAllowed")) {
        setError("Camera access denied. Click the camera icon in your browser's address bar and allow access, then retry.");
      } else if (msg.includes("NotFound") || msg.includes("DevicesNotFound")) {
        setError("No camera found on this device.");
      } else if (msg.includes("NotReadable") || msg.includes("TrackStart") || msg.includes("Allocated")) {
        setError("Camera is in use by another app (Teams, Zoom, etc.). Close it and retry.");
      } else {
        setError("Could not start camera. Close any other apps using it, then retry.");
      }
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, [facingMode, startCamera]);

  function capture() {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    setCaptured(canvas.toDataURL("image/jpeg", 0.92));
  }

  function retake() { setCaptured(null); }

  function confirm() {
    const canvas  = canvasRef.current;
    const angle   = ANGLES[angleIdx];
    if (!canvas) return;
    canvas.toBlob(blob => {
      if (!blob) return;
      onCapture(new File([blob], `photo-${angle.id}-${Date.now()}.jpg`, { type: "image/jpeg" }), angle.label);
      setCapturedIds(prev => new Set([...prev, angle.id]));
      setCaptured(null);
      if (angleIdx < ANGLES.length - 1) {
        setAngleIdx(i => i + 1);
      } else {
        setDone(true);
      }
    }, "image/jpeg", 0.92);
  }

  function skipAngle() {
    setCaptured(null);
    if (angleIdx < ANGLES.length - 1) {
      setAngleIdx(i => i + 1);
    } else {
      onClose();
    }
  }

  const angle = ANGLES[angleIdx];

  if (done) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-center px-8 gap-6">
        <div className="text-6xl">🎉</div>
        <h2 className="text-white text-2xl font-bold">All angles captured!</h2>
        <p className="text-slate-400">Your visual likeness is looking great. These photos will be used to train your Twin's appearance.</p>
        <button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-colors touch-manipulation w-full max-w-xs">
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/90 shrink-0">
        <button onClick={onClose} className="text-white text-sm px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors touch-manipulation">
          Cancel
        </button>
        <span className="text-white text-sm font-semibold">{angleIdx + 1} / {ANGLES.length}</span>
        {!error && !captured && (
          <button
            onClick={() => setFacingMode(m => m === "user" ? "environment" : "user")}
            className="text-white text-sm px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors touch-manipulation"
          >
            🔄
          </button>
        )}
        {(error || captured) && <div className="w-16" />}
      </div>

      {/* Angle progress dots */}
      <div className="flex justify-center gap-1.5 py-2 bg-black/90 shrink-0">
        {ANGLES.map((a, i) => (
          <div
            key={a.id}
            className={`w-2 h-2 rounded-full transition-all ${
              capturedIds.has(a.id) ? "bg-green-500" :
              i === angleIdx ? "bg-indigo-500 w-4" :
              "bg-slate-700"
            }`}
          />
        ))}
      </div>

      {/* Camera feed */}
      <div className="flex-1 relative overflow-hidden bg-black">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 gap-4">
            <div className="text-5xl">📷</div>
            <p className="text-white font-semibold">Camera unavailable</p>
            <p className="text-slate-400 text-sm">{error}</p>
            <button
              onClick={() => startCamera(facingMode)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors touch-manipulation"
            >
              Try Again
            </button>
          </div>
        ) : captured ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={captured} alt="Captured" className="w-full h-full object-contain" />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
            />
            {/* Oval face guide overlay */}
            {ready && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-64 sm:w-56 sm:h-72 rounded-full border-2 border-white/40 border-dashed" />
              </div>
            )}
          </>
        )}

        {/* Loading */}
        {!ready && !error && !captured && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Angle guide + controls */}
      <div className="shrink-0 bg-black/95 px-4 pt-4 pb-6 space-y-4">
        {!captured ? (
          <>
            {/* Current angle info */}
            <div className="flex items-center gap-4 bg-slate-900/80 rounded-2xl px-4 py-3">
              <div className="shrink-0">{angle.svg}</div>
              <div className="flex-1 min-w-0">
                <p className="text-indigo-400 text-xs font-semibold uppercase tracking-wide mb-0.5">{angle.label}</p>
                <p className="text-white text-sm leading-snug">{angle.instruction}</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-4 justify-center">
              <button onClick={skipAngle} className="text-slate-500 text-sm touch-manipulation px-4 py-2">
                Skip
              </button>
              <button
                onClick={capture}
                disabled={!ready}
                className="w-18 h-18 w-[72px] h-[72px] rounded-full bg-white disabled:bg-slate-600 flex items-center justify-center shadow-lg touch-manipulation"
              >
                <div className="w-14 h-14 rounded-full border-4 border-black" />
              </button>
              <div className="w-16" />
            </div>
          </>
        ) : (
          <>
            <p className="text-center text-slate-300 text-sm">Happy with this shot?</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={retake} className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-4 rounded-2xl transition-colors touch-manipulation">
                Retake
              </button>
              <button onClick={confirm} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-colors touch-manipulation">
                {angleIdx < ANGLES.length - 1 ? "Use & Next →" : "Use & Finish ✓"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
