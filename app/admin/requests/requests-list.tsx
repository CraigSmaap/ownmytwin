"use client";

import { useState } from "react";

type Status = "pending" | "approved" | "rejected";
type Filter = "all" | Status;

interface AdminRequest {
  id:           string;
  buyerName:    string;
  buyerEmail:   string;
  company:      string | null;
  usageType:    string;
  usageLabel:   string;
  usageIcon:    string;
  message:      string;
  status:       string;
  responseNote: string | null;
  respondedAt:  string | null;
  createdAt:    string;
  twinName:     string | null;
  creatorName:  string | null;
  creatorEmail: string;
  agreedPrice:  number;
}

interface Props {
  initialRequests: AdminRequest[];
}

export function AdminRequestsList({ initialRequests }: Props) {
  const [requests,  setRequests]  = useState<AdminRequest[]>(initialRequests);
  const [filter,    setFilter]    = useState<Filter>("pending");
  const [expanded,  setExpanded]  = useState<string | null>(null);
  const [acting,    setActing]    = useState<string | null>(null);
  const [noteFor,   setNoteFor]   = useState<{ id: string; action: "approved" | "rejected" } | null>(null);
  const [noteText,  setNoteText]  = useState("");
  const [priceText, setPriceText] = useState("");

  const counts = {
    all:      requests.length,
    pending:  requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  const displayed = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const TABS: { key: Filter; label: string }[] = [
    { key: "pending",  label: `Pending (${counts.pending})`   },
    { key: "all",      label: `All (${counts.all})`           },
    { key: "approved", label: `Approved (${counts.approved})` },
    { key: "rejected", label: `Declined (${counts.rejected})` },
  ];

  function startAction(id: string, action: "approved" | "rejected") {
    setNoteFor({ id, action });
    setNoteText("");
    setPriceText("");
  }

  async function confirmAction() {
    if (!noteFor || acting) return;
    const { id, action } = noteFor;
    setActing(id);
    setNoteFor(null);

    const agreedPrice = action === "approved" ? parseInt(priceText, 10) || 0 : undefined;
    const res = await fetch(`/api/admin/requests/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: action, responseNote: noteText, agreedPrice }),
    });

    if (res.ok) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: action, responseNote: noteText || null, respondedAt: new Date().toISOString() }
            : r,
        ),
      );
    }
    setActing(null);
    setNoteText("");
    setPriceText("");
  }

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
                ? "bg-red-700 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Confirm note modal */}
      {noteFor && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-white text-lg">
              {noteFor.action === "approved" ? "✓ Approve Request" : "✕ Decline Request"}
            </h3>
            <p className="text-slate-400 text-sm">
              Add an optional note for the buyer — this will appear in their notification email.
            </p>
            {noteFor.action === "approved" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Agreed Price (R) — leave 0 to skip payment</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={priceText}
                  onChange={(e) => setPriceText(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 text-sm"
                />
              </div>
            )}
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={
                noteFor.action === "approved"
                  ? "e.g. The creator is happy to proceed. They'll be in touch via the email on file."
                  : "e.g. The creator isn't taking new projects at this time. Feel free to check back."
              }
              rows={4}
              autoFocus
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 resize-none text-sm leading-relaxed"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setNoteFor(null); setNoteText(""); }}
                className="px-4 py-2.5 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors ${
                  noteFor.action === "approved"
                    ? "bg-green-700 hover:bg-green-600"
                    : "bg-red-800 hover:bg-red-700"
                }`}
              >
                {noteFor.action === "approved" ? "Confirm Approval" : "Confirm Decline"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {displayed.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-2xl">
          <p className="text-4xl mb-3">📬</p>
          <p className="text-slate-500 font-medium">
            {filter === "pending" ? "No pending requests — all clear" : `No ${filter} requests`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((req) => {
            const isExpanded = expanded === req.id;
            const isActing   = acting  === req.id;
            const status     = req.status as Status;

            const statusStyle = {
              pending:  "bg-amber-900/40 text-amber-400 border-amber-800/50",
              approved: "bg-green-900/40 text-green-400 border-green-800/50",
              rejected: "bg-slate-800 text-slate-500 border-slate-700",
            }[status] ?? "bg-slate-800 text-slate-500 border-slate-700";

            const statusLabel = { pending: "Pending", approved: "Approved", rejected: "Declined" }[status] ?? status;

            return (
              <div
                key={req.id}
                className={`bg-slate-900 border rounded-2xl overflow-hidden transition-colors ${
                  status === "pending"
                    ? "border-slate-700 hover:border-slate-600"
                    : status === "approved"
                    ? "border-green-900/50"
                    : "border-slate-800"
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                      status === "approved" ? "bg-green-900/40 text-green-400"
                      : status === "rejected" ? "bg-slate-800 text-slate-500"
                      : "bg-red-900/30 text-red-300"
                    }`}>
                      {req.buyerName.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                        <div>
                          <p className="font-semibold text-white text-sm">{req.buyerName}</p>
                          {req.company && <p className="text-xs text-indigo-400 mt-0.5">{req.company}</p>}
                          <p className="text-xs text-slate-500 mt-0.5">{req.buyerEmail}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${statusStyle}`}>
                          {statusLabel}
                        </span>
                      </div>

                      {/* Twin + creator row */}
                      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 mb-3 flex items-center gap-4 flex-wrap">
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">Twin</p>
                          <p className="text-sm font-semibold text-white">{req.twinName ?? "—"}</p>
                        </div>
                        <div className="w-px h-8 bg-slate-700 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">Creator</p>
                          <p className="text-sm text-slate-300">{req.creatorName ?? req.creatorEmail}</p>
                        </div>
                        <div className="ml-auto">
                          <span className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                            {req.usageIcon} {req.usageLabel}
                          </span>
                        </div>
                      </div>

                      {/* Message */}
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

                      {/* Response note (if already responded) */}
                      {req.responseNote && (
                        <div className="mt-3 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5">
                          <p className="text-xs text-slate-500 font-medium mb-1">Response note sent to buyer</p>
                          <p className="text-sm text-slate-300 leading-relaxed">{req.responseNote}</p>
                        </div>
                      )}

                      {/* Date + responded + price */}
                      <div className="flex items-center gap-3 mt-3 text-xs text-slate-600 flex-wrap">
                        <span>Submitted {new Date(req.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                        {req.respondedAt && (
                          <span>· Responded {new Date(req.respondedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                        )}
                        {req.status === "approved" && req.agreedPrice > 0 && (
                          <span className="text-green-500">· R{req.agreedPrice.toLocaleString()} agreed</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions — pending only */}
                  {status === "pending" && (
                    <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-slate-800">
                      <button
                        onClick={() => startAction(req.id, "rejected")}
                        disabled={isActing}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium border border-slate-700 text-slate-400 hover:bg-red-950/40 hover:border-red-900/60 hover:text-red-400 transition-all disabled:opacity-40"
                      >
                        {isActing ? "..." : "Decline"}
                      </button>
                      <button
                        onClick={() => startAction(req.id, "approved")}
                        disabled={isActing}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-green-700 hover:bg-green-600 text-white transition-all disabled:opacity-40 flex items-center gap-2"
                      >
                        {isActing
                          ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          : "✓ Approve"
                        }
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
