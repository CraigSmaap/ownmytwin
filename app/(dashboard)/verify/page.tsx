"use client";

import { useState, useEffect } from "react";

const PLATFORMS = [
  { id: "instagram", label: "Instagram",  icon: "📸", base: "https://instagram.com/" },
  { id: "tiktok",    label: "TikTok",     icon: "🎵", base: "https://tiktok.com/@" },
  { id: "twitter",   label: "X / Twitter",icon: "🐦", base: "https://x.com/" },
  { id: "youtube",   label: "YouTube",    icon: "▶️", base: "https://youtube.com/@" },
  { id: "linkedin",  label: "LinkedIn",   icon: "💼", base: "https://linkedin.com/in/" },
];

const ID_TYPES = [
  { value: "sa_id",           label: "South African ID Book / Smart Card" },
  { value: "passport",        label: "Passport" },
  { value: "drivers_license", label: "Driver's Licence" },
];

interface SocialLink { id: string; platform: string; handle: string }
interface VerifRequest { fullName: string; idType: string; status: string; reviewNote?: string }

export default function VerifyPage() {
  const [status,    setStatus]    = useState<"unverified" | "pending" | "verified" | "rejected">("unverified");
  const [existing,  setExisting]  = useState<VerifRequest | null>(null);
  const [links,     setLinks]     = useState<SocialLink[]>([]);
  const [loaded,    setLoaded]    = useState(false);

  // Identity form
  const [fullName,  setFullName]  = useState("");
  const [idType,    setIdType]    = useState("sa_id");
  const [idNumber,  setIdNumber]  = useState("");
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState("");

  // Social form
  const [platform, setPlatform]   = useState("instagram");
  const [handle,   setHandle]     = useState("");
  const [addingLink, setAddingLink] = useState(false);

  useEffect(() => {
    fetch("/api/verification")
      .then((r) => r.json())
      .then((data) => {
        setStatus(data.verificationStatus ?? "unverified");
        setLinks(data.socialLinks ?? []);
        if (data.verificationRequest) {
          setExisting(data.verificationRequest);
          setFullName(data.verificationRequest.fullName ?? "");
          setIdType(data.verificationRequest.idType ?? "sa_id");
        }
        setLoaded(true);
      });
  }, []);

  async function handleSubmit() {
    setSaving(true);
    setSaveError("");
    const res  = await fetch("/api/verification", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ fullName, idType, idNumber }),
    });
    const data = await res.json();
    if (!res.ok) { setSaveError(data.error ?? "Failed to submit"); setSaving(false); return; }
    setStatus("pending");
    setExisting({ fullName, idType, status: "pending" });
    setSaving(false);
  }

  async function handleAddLink() {
    if (!handle.trim()) return;
    setAddingLink(true);
    const res  = await fetch("/api/social-links", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ platform, handle: handle.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setLinks((prev) => {
        const filtered = prev.filter((l) => l.platform !== platform);
        return [...filtered, data.link];
      });
      setHandle("");
    }
    setAddingLink(false);
  }

  async function handleRemoveLink(id: string) {
    await fetch(`/api/social-links/${id}`, { method: "DELETE" });
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  const platformsAdded = new Set(links.map((l) => l.platform));
  const availablePlatforms = PLATFORMS.filter((p) => !platformsAdded.has(p.id));

  const canSubmit = fullName.trim().length >= 2 && idNumber.trim().length >= 2 && links.length > 0;
  const isEditable = status === "unverified" || status === "rejected";

  return (
    <div className="max-w-2xl space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Identity Verification</h1>
        <p className="text-slate-400 text-sm">
          Verify your identity so buyers can trust your twin is genuinely you.
        </p>
      </div>

      {/* Status banner */}
      {status === "pending" && (
        <div className="bg-blue-900/30 border border-blue-700/50 text-blue-300 rounded-2xl px-5 py-4 flex items-start gap-3">
          <span className="text-xl shrink-0">🔍</span>
          <div>
            <p className="font-semibold">Under review</p>
            <p className="text-sm text-blue-400 mt-0.5">We are verifying your identity. This usually takes 1–2 business days.</p>
          </div>
        </div>
      )}

      {status === "verified" && (
        <div className="bg-green-900/30 border border-green-700/50 text-green-300 rounded-2xl px-5 py-4 flex items-start gap-3">
          <span className="text-xl shrink-0">✅</span>
          <div>
            <p className="font-semibold">Identity verified</p>
            <p className="text-sm text-green-400 mt-0.5">
              Your profile displays a Verified badge. Buyers can trust your twin is genuinely you.
            </p>
          </div>
        </div>
      )}

      {status === "rejected" && existing?.reviewNote && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-300 rounded-2xl px-5 py-4 flex items-start gap-3">
          <span className="text-xl shrink-0">❌</span>
          <div>
            <p className="font-semibold">Verification not approved</p>
            <p className="text-sm text-red-400 mt-1">{existing.reviewNote}</p>
            <p className="text-xs text-red-500 mt-2">You can correct your information and resubmit below.</p>
          </div>
        </div>
      )}

      {/* Why verify info block */}
      {status === "unverified" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Why verify?</h2>
          <div className="space-y-2 text-sm text-slate-400">
            {[
              "Your public profile shows a Verified badge buyers can trust",
              "Verified twins rank higher in marketplace search",
              "Prevents others from impersonating you",
              "Required for full licensing and payment eligibility",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social profiles */}
      {(isEditable || status === "pending") && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Your Social Profiles</h2>
            <p className="text-xs text-slate-600 mt-1">
              Add at least one social account so we can confirm it matches your identity.
            </p>
          </div>

          {/* Existing links */}
          {links.length > 0 && (
            <div className="space-y-2">
              {links.map((link) => {
                const plat = PLATFORMS.find((p) => p.id === link.platform);
                const url  = plat ? `${plat.base}${link.handle}` : null;
                return (
                  <div key={link.id} className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg">{plat?.icon ?? "🔗"}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">{plat?.label ?? link.platform}</p>
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-400 hover:text-indigo-300 truncate block"
                          >
                            @{link.handle} ↗
                          </a>
                        ) : (
                          <p className="text-xs text-slate-500">@{link.handle}</p>
                        )}
                      </div>
                    </div>
                    {isEditable && (
                      <button
                        onClick={() => handleRemoveLink(link.id)}
                        className="text-slate-600 hover:text-red-400 transition-colors ml-3 shrink-0 text-lg leading-none"
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add link */}
          {isEditable && availablePlatforms.length > 0 && (
            <div className="flex gap-2">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 appearance-none shrink-0"
              >
                {availablePlatforms.map((p) => (
                  <option key={p.id} value={p.id}>{p.icon} {p.label}</option>
                ))}
              </select>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value.replace(/^@/, ""))}
                placeholder="your_handle"
                onKeyDown={(e) => { if (e.key === "Enter") handleAddLink(); }}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm min-w-0"
              />
              <button
                onClick={handleAddLink}
                disabled={addingLink || !handle.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shrink-0"
              >
                Add
              </button>
            </div>
          )}

          {isEditable && availablePlatforms.length === 0 && (
            <p className="text-xs text-slate-500">All platforms added.</p>
          )}
        </div>
      )}

      {/* Identity form */}
      {(isEditable || status === "pending") && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Identity Details</h2>
            <p className="text-xs text-slate-600 mt-1">
              We use this to match your identity against your social profiles. Document upload coming soon.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Legal Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="As it appears on your ID"
              disabled={!loaded || status === "pending"}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm disabled:opacity-40"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">ID Document Type</label>
            <select
              value={idType}
              onChange={(e) => setIdType(e.target.value)}
              disabled={!loaded || status === "pending"}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 text-sm appearance-none disabled:opacity-40"
            >
              {ID_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Last 4 digits of ID / Passport number
            </label>
            <input
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="e.g. 4829"
              maxLength={4}
              disabled={!loaded || status === "pending"}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm font-mono tracking-widest disabled:opacity-40"
            />
            <p className="text-xs text-slate-700 mt-1">We never store your full ID number.</p>
          </div>

          {saveError && (
            <p className="text-xs text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl px-3 py-2">{saveError}</p>
          )}

          {isEditable && (
            <button
              onClick={handleSubmit}
              disabled={saving || !loaded || !canSubmit}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              {saving ? "Submitting..." : status === "rejected" ? "Resubmit for Review" : "Submit for Verification"}
            </button>
          )}

          {!canSubmit && isEditable && (
            <p className="text-xs text-slate-600 text-center">
              {links.length === 0
                ? "Add at least one social profile above to submit"
                : "Fill in all fields above to submit"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
