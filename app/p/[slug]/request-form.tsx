"use client";

import { useState, type FormEvent } from "react";

const LICENSE_LABELS: Record<string, string> = {
  voice_only:         "Voice Only",
  voiceover:          "Voiceover",
  public_speaking:    "Public Speaking",
  face_avatar:        "Face / Avatar",
  full_likeness:      "Full Likeness",
  social_media:       "Social Media",
  ads:                "Advertising",
  ai_presenter:       "AI Presenter",
  virtual_influencer: "Virtual Influencer",
  educational:        "Educational",
  corporate_training: "Corporate Training",
  customer_service:   "Customer Service",
  film_tv:            "Film / TV",
  game_npc:           "Game NPC",
  motion_style:       "Motion Style",
};

interface EnabledLicense {
  id:       string;
  price:    number;
  approval: string;
}

interface Props {
  twinId:          string;
  twinName:        string;
  enabledLicenses: EnabledLicense[];
}

export function RequestForm({ twinId, twinName, enabledLicenses }: Props) {
  const [open,         setOpen]         = useState(false);
  const [submitted,    setSubmitted]    = useState(false);
  const [autoApproved, setAutoApproved] = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState("");

  const [buyerName,  setBuyerName]  = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [company,    setCompany]    = useState("");
  const [usageType,  setUsageType]  = useState(enabledLicenses[0]?.id ?? "");
  const [message,    setMessage]    = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/license-request", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ twinId, buyerName, buyerEmail, company, usageType, message }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    setAutoApproved(data.autoApproved === true);
    setSubmitted(true);
  }

  function closeAndReset() {
    setOpen(false);
    setTimeout(() => {
      setSubmitted(false);
      setAutoApproved(false);
      setBuyerName("");
      setBuyerEmail("");
      setCompany("");
      setUsageType(enabledLicenses[0]?.id ?? "");
      setMessage("");
      setError("");
    }, 300);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all shadow-lg shadow-indigo-900/40 hover:shadow-indigo-900/60 hover:scale-[1.02] active:scale-100"
      >
        Request a License →
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeAndReset(); }}
        >
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
              <div>
                <h2 className="font-bold text-white text-lg">Request a License</h2>
                <p className="text-xs text-slate-500 mt-0.5">{twinName}</p>
              </div>
              <button
                onClick={closeAndReset}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-6">
              {submitted ? (
                <div className="text-center py-6 space-y-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto ${
                    autoApproved
                      ? "bg-green-900/40 border border-green-700/50"
                      : "bg-indigo-900/40 border border-indigo-700/50"
                  }`}>
                    {autoApproved ? "🎉" : "✓"}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">
                      {autoApproved ? "Request approved!" : "Request sent!"}
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                      {autoApproved
                        ? "Your license request was automatically approved. Check your email for details."
                        : "The OwnMyTwin team will review your request and be in touch shortly."}
                    </p>
                  </div>
                  <button
                    onClick={closeAndReset}
                    className="mt-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Your Name *</label>
                      <input
                        required
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        placeholder="Jane Smith"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Your Email *</label>
                      <input
                        required
                        type="email"
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        placeholder="jane@company.com"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Company / Organisation</label>
                    <input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Acme Studios (optional)"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Usage Type *</label>
                    <select
                      required
                      value={usageType}
                      onChange={(e) => setUsageType(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm appearance-none"
                    >
                      {enabledLicenses.map((lic) => (
                        <option key={lic.id} value={lic.id}>
                          {LICENSE_LABELS[lic.id] ?? lic.id}
                          {lic.price > 0 ? ` — $${lic.price.toLocaleString()}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Project Description *</label>
                    <textarea
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your project, how you plan to use this twin, timeline, and any other relevant details..."
                      rows={4}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm resize-none leading-relaxed"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-400 bg-red-950/40 border border-red-800/40 rounded-xl px-3 py-2">
                      {error}
                    </p>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={closeAndReset}
                      className="flex-1 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 py-3 rounded-xl text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : "Send Request"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
