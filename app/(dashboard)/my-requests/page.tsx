"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="text-2xl leading-none transition-transform hover:scale-110"
        >
          <span className={(hovered || value) >= star ? "text-amber-400" : "text-slate-700"}>★</span>
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "text-base" : "text-sm";
  return (
    <span className={cls}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? "text-amber-400" : "text-slate-700"}>★</span>
      ))}
    </span>
  );
}

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

const STATUS_STYLES = {
  pending:  "bg-amber-900/40 text-amber-400 border-amber-800/50",
  approved: "bg-green-900/40 text-green-400 border-green-800/50",
  rejected: "bg-slate-800 text-slate-500 border-slate-700",
};

const STATUS_LABELS = {
  pending:  "Pending",
  approved: "Approved",
  rejected: "Declined",
};

type Status = "pending" | "approved" | "rejected";
type Filter = "all" | Status;

interface MyRequest {
  id:           string;
  usageType:    string;
  message:      string;
  status:       string;
  createdAt:    string;
  responseNote: string | null;
  respondedAt:  string | null;
  agreedPrice:  number;
  paidAt:       string | null;
  twin: {
    name: string | null;
    slug: string | null;
  } | null;
  review: { id: string; rating: number; comment: string | null } | null;
}

export default function MyRequestsPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [requests,      setRequests]      = useState<MyRequest[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState<Filter>("all");
  const [expanded,      setExpanded]      = useState<string | null>(null);
  const [reviewingId,   setReviewingId]   = useState<string | null>(null);
  const [reviewRating,  setReviewRating]  = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSaving,  setReviewSaving]  = useState(false);
  const [toast,         setToast]         = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const paid      = searchParams.get("paid");
    const cancelled = searchParams.get("cancelled");
    if (paid === "true") {
      setToast({ msg: "Payment successful! Your license is now active.", type: "success" });
      router.replace("/my-requests");
    } else if (cancelled === "true") {
      setToast({ msg: "Payment cancelled. You can try again from your requests.", type: "error" });
      router.replace("/my-requests");
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/buyer/requests");
    const data = await res.json();
    setRequests(data.requests ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submitReview(requestId: string) {
    if (reviewRating === 0 || reviewSaving) return;
    setReviewSaving(true);
    const res = await fetch("/api/reviews", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ licenseRequestId: requestId, rating: reviewRating, comment: reviewComment }),
    });
    if (res.ok) {
      const { review } = await res.json();
      setRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, review } : r));
      setReviewingId(null);
      setReviewRating(0);
      setReviewComment("");
    }
    setReviewSaving(false);
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
    { key: "rejected", label: `Declined (${counts.rejected})` },
  ];

  return (
    <div className="max-w-3xl space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl text-sm font-medium shadow-lg transition-all ${
          toast.type === "success"
            ? "bg-green-900 border border-green-700 text-green-200"
            : "bg-red-950 border border-red-800 text-red-200"
        }`}>
          {toast.type === "success" ? "✓ " : "✕ "}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">My Requests</h1>
          <p className="text-slate-400 text-sm">
            License requests you&apos;ve submitted to talent on OwnMyTwin.
          </p>
        </div>
        <Link
          href="/marketplace"
          className="shrink-0 flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors touch-manipulation"
        >
          🏪 Browse More
        </Link>
      </div>

      {/* Stats */}
      {requests.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total",    value: counts.all,      color: "text-violet-400", bg: "from-violet-500/10 border-violet-800/40" },
            { label: "Pending",  value: counts.pending,  color: "text-amber-400",  bg: "from-amber-500/10 border-amber-800/40"  },
            { label: "Approved", value: counts.approved, color: "text-green-400",  bg: "from-green-500/10 border-green-800/40"  },
          ].map((s) => (
            <div key={s.label} className={`relative overflow-hidden bg-gradient-to-br ${s.bg} to-slate-900 border rounded-2xl p-4 sm:p-5`}>
              <p className={`text-2xl sm:text-3xl font-bold ${s.color} mb-0.5`}>{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      {requests.length > 0 && (
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-2xl p-1 w-fit flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === tab.key
                  ? "bg-violet-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 animate-pulse h-28" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && requests.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl">
          <p className="text-5xl mb-4">📬</p>
          <p className="font-medium text-slate-400">No requests submitted yet</p>
          <p className="text-sm text-slate-600 mt-1 mb-6">
            Browse the marketplace and request a license from a twin you&apos;d like to work with.
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors"
          >
            🏪 Browse Marketplace
          </Link>
        </div>
      )}

      {/* No match for filter */}
      {!loading && requests.length > 0 && displayed.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl">
          <p className="text-slate-500 text-sm">No {filter} requests</p>
          <button onClick={() => setFilter("all")} className="text-violet-400 hover:text-violet-300 text-sm mt-2">
            Show all
          </button>
        </div>
      )}

      {/* Request cards */}
      {!loading && displayed.length > 0 && (
        <div className="space-y-3">
          {displayed.map((req) => {
            const meta       = LICENSE_LABELS[req.usageType];
            const status     = req.status as Status;
            const isExpanded = expanded === req.id;

            return (
              <div
                key={req.id}
                className={`bg-slate-900 border rounded-2xl overflow-hidden transition-colors ${
                  status === "approved"
                    ? "border-green-900/50"
                    : status === "rejected"
                    ? "border-slate-800"
                    : "border-slate-700 hover:border-slate-600"
                }`}
              >
                <div className="p-5 flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 ${
                    status === "approved"
                      ? "bg-green-900/40"
                      : status === "rejected"
                      ? "bg-slate-800"
                      : "bg-violet-900/40"
                  }`}>
                    {meta?.icon ?? "📄"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-semibold text-white text-sm">
                          {req.twin?.name ?? "Unknown Twin"}
                        </p>
                        {req.twin?.slug && (
                          <Link
                            href={`/p/${req.twin.slug}`}
                            target="_blank"
                            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                          >
                            View profile →
                          </Link>
                        )}
                      </div>
                      <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[status] ?? STATUS_STYLES.pending}`}>
                        {STATUS_LABELS[status] ?? status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                        {meta?.icon ?? "📄"} {meta?.label ?? req.usageType}
                      </span>
                      <span className="text-xs text-slate-600">
                        {new Date(req.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className={`text-sm text-slate-400 leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
                        {req.message}
                      </p>
                      {req.message.length > 120 && (
                        <button
                          onClick={() => setExpanded(isExpanded ? null : req.id)}
                          className="text-xs text-violet-400 hover:text-violet-300 mt-1 transition-colors"
                        >
                          {isExpanded ? "Show less" : "Read more"}
                        </button>
                      )}
                    </div>

                    {/* Response note from team */}
                    {(status === "approved" || status === "rejected") && req.responseNote && (
                      <div className={`mt-3 pt-3 border-t border-slate-800 border-l-2 pl-3 ${
                        status === "approved" ? "border-l-green-700" : "border-l-slate-600"
                      }`}>
                        <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Team note</p>
                        <p className="text-xs text-slate-400 leading-relaxed">{req.responseNote}</p>
                      </div>
                    )}

                    {/* Pay Now — approved, has price, not yet paid */}
                    {status === "approved" && req.agreedPrice > 0 && !req.paidAt && (
                      <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs text-slate-500">Amount due</p>
                          <p className="text-sm font-bold text-white">R{req.agreedPrice.toLocaleString()}</p>
                        </div>
                        <Link
                          href={`/pay/${req.id}`}
                          className="flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors"
                        >
                          💳 Pay Now
                        </Link>
                      </div>
                    )}

                    {/* Paid badge */}
                    {status === "approved" && req.paidAt && (
                      <div className="mt-4 pt-4 border-t border-slate-800">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-400 bg-green-900/30 border border-green-800/50 px-3 py-1.5 rounded-full">
                          ✓ Paid {new Date(req.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    )}

                    {/* Review section — approved requests only */}
                    {status === "approved" && (
                      <div className="mt-4 pt-4 border-t border-slate-800">
                        {req.review ? (
                          <div className="flex items-center gap-2">
                            <StarDisplay rating={req.review.rating} />
                            {req.review.comment && (
                              <p className="text-xs text-slate-500 truncate">{req.review.comment}</p>
                            )}
                          </div>
                        ) : reviewingId === req.id ? (
                          <div className="space-y-3">
                            <p className="text-xs text-slate-400 font-medium">Rate your experience</p>
                            <StarPicker value={reviewRating} onChange={setReviewRating} />
                            <textarea
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              placeholder="Optional comment..."
                              rows={2}
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 resize-none text-sm"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setReviewingId(null); setReviewRating(0); setReviewComment(""); }}
                                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 border border-slate-700 rounded-lg transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => submitReview(req.id)}
                                disabled={reviewRating === 0 || reviewSaving}
                                className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors"
                              >
                                {reviewSaving ? "Saving..." : "Submit Review"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setReviewingId(req.id); setReviewRating(0); setReviewComment(""); }}
                            className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1.5"
                          >
                            ★ Leave a review
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
