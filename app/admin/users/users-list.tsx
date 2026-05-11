"use client";

import { useState } from "react";

interface AdminUser {
  id:                 string;
  name:               string | null;
  email:              string;
  role:               string;
  image:              string | null;
  plan:               string;
  createdAt:          string;
  emailVerified:      string | null;
  onboardingComplete: boolean;
  _count:             { photos: number; voiceRecordings: number };
  twin: {
    name:         string | null;
    systemPrompt: string | null;
    _count:       { memories: number; messages: number };
  } | null;
}

export function UsersList({ initialUsers }: { initialUsers: AdminUser[] }) {
  const [users,   setUsers]   = useState(initialUsers);
  const [loading, setLoading] = useState<string | null>(null);

  async function setPlan(userId: string, plan: "pro" | "free") {
    setLoading(userId);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ plan }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, plan } : u));
    }
    setLoading(null);
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

      {/* Mobile cards */}
      <div className="sm:hidden divide-y divide-slate-800">
        {users.map((u) => (
          <div key={u.id} className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-sm shrink-0 overflow-hidden">
                {u.image ? <img src={u.image} alt="" className="w-full h-full object-cover" /> : "👤"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white text-sm truncate">{u.name ?? "No name"}</p>
                <p className="text-xs text-slate-500 truncate">{u.email}</p>
              </div>
              <PlanBadge plan={u.plan} />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {u.emailVerified && <span className="text-xs px-1.5 py-0.5 rounded border bg-green-900/40 text-green-400 border-green-800/40">✓ Verified</span>}
              {u.onboardingComplete && <span className="text-xs px-1.5 py-0.5 rounded border bg-indigo-900/40 text-indigo-400 border-indigo-800/40">✓ Setup</span>}
              {u.twin?.systemPrompt && <span className="text-xs px-1.5 py-0.5 rounded border bg-violet-900/40 text-violet-400 border-violet-800/40">🤖 Twin</span>}
              {u.role === "admin" && <span className="text-xs px-1.5 py-0.5 rounded border bg-red-900/40 text-red-400 border-red-800/40">🛡️ Admin</span>}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-xs text-slate-500">
                <span>🧠 {u.twin?._count.memories ?? 0}</span>
                <span>💬 {Math.floor((u.twin?._count.messages ?? 0) / 2)}</span>
                <span>📸 {u._count.photos}</span>
              </div>
              {u.role !== "admin" && (
                <PlanButton plan={u.plan} loading={loading === u.id} onGrant={() => setPlan(u.id, "pro")} onRevoke={() => setPlan(u.id, "free")} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80">
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
              <th className="text-left px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
              <th className="text-left px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Twin</th>
              <th className="text-left px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Plan</th>
              <th className="text-left px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs shrink-0 overflow-hidden">
                      {u.image ? <img src={u.image} alt="" className="w-full h-full object-cover" /> : "👤"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate max-w-[160px]">{u.name ?? "—"}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[160px]">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-400 text-xs whitespace-nowrap">
                  {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-4">
                  {u.twin ? (
                    <div>
                      <p className="text-slate-300 text-xs font-medium">{u.twin.name ?? "Unnamed"}</p>
                      <p className="text-slate-600 text-xs">{u.twin.systemPrompt ? "Configured" : "Incomplete"}</p>
                    </div>
                  ) : <span className="text-slate-600 text-xs">No twin</span>}
                </td>
                <td className="px-4 py-4">
                  <PlanBadge plan={u.plan} />
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-1">
                    {u.emailVerified && <span className="text-xs px-1.5 py-0.5 rounded border bg-green-900/40 text-green-400 border-green-800/40">✓ Verified</span>}
                    {u.onboardingComplete && <span className="text-xs px-1.5 py-0.5 rounded border bg-indigo-900/40 text-indigo-400 border-indigo-800/40">✓ Setup</span>}
                    {u.role === "admin" && <span className="text-xs px-1.5 py-0.5 rounded border bg-red-900/40 text-red-400 border-red-800/40">🛡️ Admin</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  {u.role !== "admin" && (
                    <PlanButton
                      plan={u.plan}
                      loading={loading === u.id}
                      onGrant={() => setPlan(u.id, "pro")}
                      onRevoke={() => setPlan(u.id, "free")}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  return plan === "pro" ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-900/40 text-green-400 border border-green-800/50">
      ⭐ Pro
    </span>
  ) : (
    <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-500 border border-slate-700">
      Free
    </span>
  );
}

function PlanButton({ plan, loading, onGrant, onRevoke }: {
  plan: string; loading: boolean;
  onGrant: () => void; onRevoke: () => void;
}) {
  if (plan === "pro") {
    return (
      <button
        onClick={onRevoke}
        disabled={loading}
        className="text-xs text-slate-500 hover:text-red-400 border border-slate-700 hover:border-red-800/50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
      >
        {loading ? "..." : "Revoke Pro"}
      </button>
    );
  }
  return (
    <button
      onClick={onGrant}
      disabled={loading}
      className="text-xs font-semibold text-green-400 bg-green-900/30 hover:bg-green-900/50 border border-green-800/50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
    >
      {loading ? "..." : "Grant Pro ⭐"}
    </button>
  );
}
