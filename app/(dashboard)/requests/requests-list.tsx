"use client";

import { useState } from "react";
import Link from "next/link";

const LICENSE_LABELS: Record<string, { label: string; icon: string }> = {
  voice_only:         { label: "Voice Only",        icon: "🎤" },
  voiceover:          { label: "Voiceover",          icon: "🎙️" },
  public_speaking:    { label: "Public Speaking",    icon: "📢" },
  face_avatar:        { label: "Face / Avatar",      icon: "🪞" },
  full_likeness:      { label: "Full Likeness",      icon: "👤" },
  social_media:       { label: "Social Media",       icon: "📱" },
  ads:                { label: "Advertising",        icon: "📺" },
  ai_presenter:       { label: "AI Presenter",       icon: "🎬" },
  virtual_influencer: { label: "Virtual Influencer", icon: "⭐" },
  educational:        { label: "Educational",        icon: "📚" },
  corporate_training: { label: "Corporate Training", icon: "🏢" },
  customer_service:   { label: "Customer Service",   icon: "🤝" },
  film_tv:            { label: "Film / TV",          icon: "🎥" },
  game_npc:           { label: "Game NPC",           icon: "🎮" },
  motion_style:       { label: "Motion Style",       icon: "🕺" },
};

type Status = "pending" | "approved" | "rejected";
type Filter = "all" | Status;

interface LicenseRequest {
  id:           string;
  buyerName:    string;
  buyerEmail:   string;
  company:      string | null;
  usageType:    string;
  message:      string;
  status:       string;
  createdAt:    string;
  responseNote: string | null;
  respondedAt:  string | null;
  agreedPrice:  number;
  paidAt:       string | null;
}

interface Props {
  initialRequests: LicenseRequest[];
  publicSlug:      string | null;
}

export function RequestsList({ initialRequests, publicSlug }: Props) {
  const [requests, setRequests] = useState<LicenseRequest[]>(initialRequests);
  const [filter,   setFilter]   = useState<Filter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Per-card action state
  const [actionCard,  setActionCard]  = useState<string | null>(null);
  const [actionType,  setActionType]  = useState<"approve" | "reject" | null>(null);
  const [note,        setNote]        = useState("");
  const [price,       setPrice]       = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [actionError, setActionError] = useState("");

  function openAction(id: string, type: "approve" | "reject") {
    setActionCard(id);
    setActionType(type);
    setNote("");
    setPrice("");
    setActionError("");
  }

  function cancelAction() {
    setActionCard(null);
    setActionType(null);
    setNote("");
    setPrice("");
    setActionError("");
  }

  async function submitAction() {
    if (!actionCard || !actionType || submitting) return;
    setSubmitting(true);
    setActionError("");

    const status      = actionType === "approve" ? "approved" : "rejected";
    const agreedPrice = actionType === "approve" && price ? parseInt(price, 10) : undefined;

    const res = await fetch(`/api/requests/${actionCard}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status, responseNote: note || undefined, agreedPrice }),
    });

    setSubmitting(false);

    if (!res.ok) {
      setActionError("Something went wrong — try again.");
      return;
    }

    const { request: updated } = await res.json();
    setRequests((prev) =>
      prev.map((r) =>
        r.id === actionCard
          ? {
              ...r,
              status:       updated.status,
              respondedAt:  updated.respondedAt,
              responseNote: updated.responseNote,
              agreedPrice:  updated.agreedPrice,
            }
          : r,
      ),
    );
    cancelAction();
  }

  const counts = {
    all:      requests.length,
    pending:  requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  const displayed = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const TABS: { key: Filter; label: string }[] = [
    { key: "all",      label: `All (${counts.all})`           },
    { key: "pending",  label: `Pending (${counts.pending})`   },
    { key: "approved", label: `Approved (${counts.approved})` },
    { key: "rejected", label: `Rejected (${counts.rejected})` },
  ];

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-2xl p-1 w-fit flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === tab.key
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {displayed.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-2xl">
          <p className="text-4xl mb-3">📬</p>
          <p className="text-slate-500 font-medium">
            {filter === "all" ? "No requests yet" : `No ${filter} requests`}
          </p>
          {filter === "all" && publicSlug && (
            <div className="mt-4 space-y-3">
              <p className="text-slate-600 text-sm max-w-xs mx-auto">
                Share your profile link to start receiving requests.
              </p>
              <div className="inline-flex items-center gap-2">
                <Link
                  href={`/p/${publicSlug}`}
                  target="_blank"
                  className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-800/50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  /p/{publicSlug} →
                </Link>
              </div>
            </div>
          )}
          {filter === "all" && !publicSlug && (
            <p className="text-slate-600 text-sm mt-1 max-w-xs mx-auto">
              Save your Twin first to generate a shareable profile link.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((req) => {
            const meta       = LICENSE_LABELS[req.usageType];
            const isExpanded = expanded === req.id;
            const isActing   = actionCard === req.id;

            return (
              <div
                key={req.id}
                className={`bg-slate-900 border rounded-2xl overflow-hidden transition-colors ${
                  req.status === "pending"
                    ? "border-amber-900/50 hover:border-amber-800/60"
                    : req.status === "approved"
                    ? "border-green-900/50"
                    : "border-slate-800"
                }`}
              >
                {/* Card header */}
                <div className="p-5 flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                    req.status === "approved"
                      ? "bg-green-900/40 text-green-400"
                      : req.status === "rejected"
                      ? "bg-slate-800 text-slate-500"
                      : "bg-indigo-900/40 text-indigo-300"
                  }`}>
                    {req.buyerName.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-semibold text-white text-sm">{req.buyerName}</p>
                        {req.company && (
                          <p className="text-xs text-indigo-400 mt-0.5">{req.company}</p>
                        )}
                        <p className="text-xs text-slate-500 mt-0.5">{req.buyerEmail}</p>
                      </div>
                      <StatusBadge status={req.status as Status} />
                    </div>

                    {/* Usage + date */}
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                        {meta?.icon ?? "📄"} {meta?.label ?? req.usageType}
                      </span>
                      <span className="text-xs text-slate-600">
                        {new Date(req.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Message */}
                    <div className="mt-3">
                      <p className={`text-sm text-slate-400 leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
                        {req.message}
                      </p>
                      {req.message.length > 120 && (
                        <button
                          onClick={() => setExpanded(isExpanded ? null : req.id)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 transition-colors"
                        >
                          {isExpanded ? "Show less" : "Read more"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pending — approve / reject actions */}
                {req.status === "pending" && (
                  <div className="px-5 pb-5 pt-4 border-t border-slate-800 space-y-3">
                    {!isActing ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openAction(req.id, "approve")}
                          className="flex-1 sm:flex-none bg-green-600 hover:bg-green-500 text-white text-xs font-semibold px-5 py-2 rounded-xl transition-colors"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => openAction(req.id, "reject")}
                          className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold px-5 py-2 rounded-xl transition-colors"
                        >
                          ✕ Decline
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-white">
                          {actionType === "approve" ? "✓ Approving request" : "✕ Declining request"}
                        </p>

                        {actionType === "approve" && (
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">
                              Agreed price (R) <span className="text-slate-600">— optional</span>
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={price}
                              onChange={(e) => setPrice(e.target.value)}
                              placeholder="e.g. 5000"
                              className="w-full sm:w-40 bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none"
                            />
                          </div>
                        )}

                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">
                            Note to buyer <span className="text-slate-600">— optional</span>
                          </label>
                          <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={2}
                            placeholder={
                              actionType === "approve"
                                ? "e.g. Happy to work together — please complete payment to proceed."
                                : "e.g. Not available for this type of usage at the moment."
                            }
                            className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none resize-none"
                          />
                        </div>

                        {actionError && <p className="text-xs text-red-400">{actionError}</p>}

                        <div className="flex gap-2">
                          <button
                            onClick={cancelAction}
                            className="px-4 py-2 text-xs text-slate-500 hover:text-slate-300 border border-slate-700 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={submitAction}
                            disabled={submitting}
                            className={`flex-1 disabled:opacity-40 text-white text-xs font-semibold py-2 rounded-lg transition-colors ${
                              actionType === "approve"
                                ? "bg-green-600 hover:bg-green-500"
                                : "bg-red-700 hover:bg-red-600"
                            }`}
                          >
                            {submitting
                              ? "Saving…"
                              : actionType === "approve"
                              ? "Confirm Approval"
                              : "Confirm Decline"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Approved / rejected — show decision details and payment status */}
                {(req.status === "approved" || req.status === "rejected") &&
                  (req.respondedAt || req.responseNote || req.paidAt) && (
                  <div className="px-5 pb-5 pt-4 border-t border-slate-800 space-y-2">
                    {req.respondedAt && (
                      <p className="text-xs text-slate-600">
                        {req.status === "approved" ? "Approved" : "Declined"}{" "}
                        {new Date(req.respondedAt).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                    )}
                    {req.responseNote && (
                      <div className={`border-l-2 pl-3 ${req.status === "approved" ? "border-green-700" : "border-slate-600"}`}>
                        <p className="text-xs text-slate-400 leading-relaxed">{req.responseNote}</p>
                      </div>
                    )}
                    {req.status === "approved" && req.agreedPrice > 0 && (
                      <div className="flex items-center gap-2 pt-1">
                        {req.paidAt ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-400 bg-green-900/30 border border-green-800/50 px-3 py-1.5 rounded-full">
                            💰 Paid — R{req.agreedPrice.toLocaleString()}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 bg-amber-900/20 border border-amber-800/40 px-3 py-1.5 rounded-full">
                            ⏳ Awaiting payment — R{req.agreedPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    pending:  "bg-amber-900/40 text-amber-400 border-amber-800/50",
    approved: "bg-green-900/40 text-green-400 border-green-800/50",
    rejected: "bg-slate-800 text-slate-500 border-slate-700",
  };
  const labels: Record<Status, string> = {
    pending:  "Pending",
    approved: "Approved",
    rejected: "Declined",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
