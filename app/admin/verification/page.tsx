"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const PLATFORMS: Record<string, { label: string; icon: string; base: string }> = {
  instagram: { label: "Instagram",   icon: "📸", base: "https://instagram.com/" },
  tiktok:    { label: "TikTok",      icon: "🎵", base: "https://tiktok.com/@" },
  twitter:   { label: "X / Twitter", icon: "🐦", base: "https://x.com/" },
  youtube:   { label: "YouTube",     icon: "▶️", base: "https://youtube.com/@" },
  linkedin:  { label: "LinkedIn",    icon: "💼", base: "https://linkedin.com/in/" },
};

const ID_LABELS: Record<string, string> = {
  sa_id:           "SA ID",
  passport:        "Passport",
  drivers_license: "Driver's Licence",
};

interface SocialLink { id: string; platform: string; handle: string }
interface Request {
  id:          string;
  fullName:    string;
  idType:      string;
  idNumber:    string;
  submittedAt: string;
  user: {
    id:                 string;
    name:               string | null;
    email:              string;
    verificationStatus: string;
    socialLinks:        SocialLink[];
  };
}

export default function AdminVerificationPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [notes,    setNotes]    = useState<Record<string, string>>({});
  const [acting,   setActing]   = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/admin/verification");
    const data = await res.json();
    setRequests(data.requests ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function decide(id: string, status: "approved" | "rejected") {
    setActing((prev) => ({ ...prev, [id]: true }));
    await fetch(`/api/admin/verification/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status, note: notes[id] ?? "" }),
    });
    setRequests((prev) => prev.filter((r) => r.id !== id));
    setActing((prev) => ({ ...prev, [id]: false }));
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Identity Verification Queue</h1>
            <p className="text-slate-400 text-sm mt-1">Review and approve or reject verification requests.</p>
          </div>
          <Link
            href="/admin"
            className="text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 px-4 py-2 rounded-xl transition-colors"
          >
            ← Back to Admin
          </Link>
        </div>

        {loading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse h-48" />
            ))}
          </div>
        )}

        {!loading && requests.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            <p className="text-5xl mb-4">✅</p>
            <p className="font-medium text-slate-400">No pending verifications</p>
            <p className="text-sm mt-1">All requests have been reviewed.</p>
          </div>
        )}

        {!loading && requests.map((req) => (
          <div key={req.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">

            {/* User header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-white">{req.user.name ?? req.user.email}</p>
                <p className="text-xs text-slate-500">{req.user.email}</p>
                <p className="text-xs text-slate-600 mt-1">
                  Submitted {new Date(req.submittedAt).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </p>
              </div>
              <span className="text-xs bg-amber-900/40 text-amber-300 border border-amber-800/40 px-2.5 py-1 rounded-full font-semibold shrink-0">
                Pending
              </span>
            </div>

            {/* Identity details */}
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="bg-slate-800 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">Full name claimed</p>
                <p className="text-white font-medium">{req.fullName}</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">ID type</p>
                <p className="text-white font-medium">{ID_LABELS[req.idType] ?? req.idType}</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">Last 4 digits</p>
                <p className="text-white font-mono font-bold tracking-widest">••••{req.idNumber}</p>
              </div>
            </div>

            {/* Social links */}
            {req.user.socialLinks.length > 0 ? (
              <div>
                <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Social profiles to verify</p>
                <div className="flex flex-wrap gap-2">
                  {req.user.socialLinks.map((link) => {
                    const plat = PLATFORMS[link.platform];
                    const url  = plat ? `${plat.base}${link.handle}` : null;
                    return (
                      <a
                        key={link.id}
                        href={url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
                      >
                        <span>{plat?.icon ?? "🔗"}</span>
                        <span>@{link.handle}</span>
                        <span className="text-indigo-400">↗</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-amber-400">No social profiles linked — verify manually.</p>
            )}

            {/* Reject note */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Note for user <span className="text-slate-600">(required if rejecting)</span>
              </label>
              <textarea
                value={notes[req.id] ?? ""}
                onChange={(e) => setNotes((prev) => ({ ...prev, [req.id]: e.target.value }))}
                rows={2}
                placeholder="e.g. Social profile name does not match your legal name..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => decide(req.id, "approved")}
                disabled={!!acting[req.id]}
                className="flex-1 bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                {acting[req.id] ? "Processing..." : "✓ Approve"}
              </button>
              <button
                onClick={() => decide(req.id, "rejected")}
                disabled={!!acting[req.id] || !notes[req.id]?.trim()}
                className="flex-1 bg-red-900 hover:bg-red-800 disabled:opacity-40 text-red-200 font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
