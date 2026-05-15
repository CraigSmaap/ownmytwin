import { auth } from "@/auth";
import { db } from "@/lib/db";
import { RequestsList } from "./requests-list";

type LicensePerm = { enabled: boolean; price: number; approval: string; territory: string };

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

export default async function RequestsPage() {
  const session = await auth();
  const userId  = session!.user!.id;

  const [twin, currentUser] = await Promise.all([
    db.twin.findUnique({
      where:  { userId },
      select: { id: true, name: true, licensePermissions: true },
    }),
    db.user.findUnique({
      where:  { id: userId },
      select: { publicSlug: true, plan: true },
    }),
  ]);
  const publicSlug   = currentUser?.publicSlug ?? null;
  const isPro        = currentUser?.plan === "pro";
  const talentShare  = isPro ? 0.8 : 0.7;
  const platformShare = isPro ? 0.2 : 0.3;

  const requests = twin
    ? await db.licenseRequest.findMany({
        where:   { twinId: twin.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const perms = (twin?.licensePermissions ?? {}) as Record<string, LicensePerm>;

  const paid    = requests.filter((r) => r.paidAt !== null);
  const approved = requests.filter((r) => r.status === "approved");
  const pending  = requests.filter((r) => r.status === "pending");
  const unpaid   = approved.filter((r) => r.paidAt === null);

  // Price fallback: agreedPrice if set, else twin's license permission price
  const priceOf = (r: typeof requests[number]) =>
    r.agreedPrice > 0 ? r.agreedPrice : (perms[r.usageType]?.price ?? 0);

  const totalEarned   = paid.reduce(   (s, r) => s + priceOf(r), 0);
  const pipelineValue = unpaid.reduce( (s, r) => s + priceOf(r), 0);

  // Earnings breakdown by license type (top 4) — paid only
  const byType: Record<string, { count: number; revenue: number }> = {};
  for (const r of paid) {
    const price = priceOf(r);
    byType[r.usageType] ??= { count: 0, revenue: 0 };
    byType[r.usageType].count++;
    byType[r.usageType].revenue += price;
  }
  const topTypes = Object.entries(byType)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 4);

  // Monthly trend — last 6 months of paid requests
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyMap: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap[key] = 0;
  }
  for (const r of paid) {
    if (r.paidAt && r.paidAt >= sixMonthsAgo) {
      const key = `${r.paidAt.getFullYear()}-${String(r.paidAt.getMonth() + 1).padStart(2, "0")}`;
      if (key in monthlyMap) monthlyMap[key] += priceOf(r);
    }
  }
  const monthlyTrend = Object.entries(monthlyMap).map(([key, value]) => {
    const [y, m] = key.split("-");
    const label  = new Date(Number(y), Number(m) - 1).toLocaleDateString("en-ZA", { month: "short" });
    return { label, value };
  });
  const maxMonthly = Math.max(...monthlyTrend.map((m) => m.value), 1);

  // Serialize dates for the client component
  const serialized = requests.map((r) => ({
    ...r,
    createdAt:   r.createdAt.toISOString(),
    updatedAt:   r.updatedAt.toISOString(),
    respondedAt: r.respondedAt?.toISOString() ?? null,
    paidAt:      r.paidAt?.toISOString() ?? null,
  }));

  const fmt = (n: number) =>
    `R${n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="max-w-4xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Job Requests</h1>
          <p className="text-slate-400 text-sm">
            License requests from buyers. The OwnMyTwin team reviews each request and will contact you before approving.
          </p>
        </div>
        {pending.length > 0 && (
          <div className="shrink-0 flex items-center gap-2 bg-amber-900/30 border border-amber-800/50 text-amber-400 px-4 py-2 rounded-xl text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            {pending.length} pending
          </div>
        )}
      </div>

      {!twin ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl">
          <p className="text-4xl mb-3">🤖</p>
          <p className="text-slate-500 font-medium">Set up your Twin first</p>
          <p className="text-slate-600 text-sm mt-1">
            Configure your Twin and enable licensing to start receiving requests.
          </p>
        </div>
      ) : (
        <>
          {/* Earnings summary — only show once there's activity */}
          {requests.length > 0 && (
            <div className="space-y-4">

              {/* Stats row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative overflow-hidden bg-gradient-to-br from-green-500/10 to-slate-900 border border-green-800/40 rounded-2xl p-5">
                  <p className="text-xs text-slate-500 mb-1">Total Earned</p>
                  <p className="text-3xl font-bold text-white">{fmt(totalEarned)}</p>
                  <p className="text-xs text-green-400 mt-1">
                    {paid.length} paid {paid.length === 1 ? "license" : "licenses"}
                  </p>
                  <span className="absolute top-4 right-4 text-2xl opacity-20">💰</span>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 to-slate-900 border border-amber-800/40 rounded-2xl p-5">
                  <p className="text-xs text-slate-500 mb-1">In Review</p>
                  <p className="text-3xl font-bold text-white">{fmt(pipelineValue)}</p>
                  <p className="text-xs text-amber-400 mt-1">
                    {pending.length} pending {pending.length === 1 ? "request" : "requests"}
                  </p>
                  <span className="absolute top-4 right-4 text-2xl opacity-20">⏳</span>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500/10 to-slate-900 border border-indigo-800/40 rounded-2xl p-5">
                  <p className="text-xs text-slate-500 mb-1">Total Requests</p>
                  <p className="text-3xl font-bold text-white">{requests.length}</p>
                  <p className="text-xs text-indigo-400 mt-1">
                    {requests.filter((r) => r.status === "rejected").length} declined
                  </p>
                  <span className="absolute top-4 right-4 text-2xl opacity-20">📬</span>
                </div>
              </div>

              {/* Earnings breakdown by license type + monthly trend */}
              {(topTypes.length > 0 || paid.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {topTypes.length > 0 && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                      <h2 className="text-sm font-semibold text-white mb-4">Earnings by License Type</h2>
                      <div className="space-y-3">
                        {topTypes.map(([type, data]) => {
                          const pct = totalEarned > 0 ? Math.round((data.revenue / totalEarned) * 100) : 0;
                          return (
                            <div key={type}>
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-slate-300 font-medium">
                                    {LICENSE_LABELS[type] ?? type}
                                  </span>
                                  <span className="text-xs text-slate-600">× {data.count}</span>
                                </div>
                                <span className="text-sm font-semibold text-white">{fmt(data.revenue)}</span>
                              </div>
                              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-1.5 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-700"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <h2 className="text-sm font-semibold text-white mb-4">Monthly Earnings (6 months)</h2>
                    <div className="flex items-end gap-1.5 h-24">
                      {monthlyTrend.map(({ label, value }) => (
                        <div key={label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                          <div
                            className="w-full bg-gradient-to-t from-green-600 to-emerald-400 rounded-t-md transition-all duration-700 min-h-[3px]"
                            style={{ height: `${Math.max((value / maxMonthly) * 100, value > 0 ? 8 : 4)}%` }}
                            title={fmt(value)}
                          />
                          <span className="text-xs text-slate-600 shrink-0">{label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-500">Platform fee ({Math.round(platformShare * 100)}%{!isPro ? " — upgrade to Pro for 80/20" : ""})</span>
                      <span className="text-xs font-semibold text-slate-400">
                        {fmt(Math.round(totalEarned * platformShare))} retained
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-slate-500">Your share ({Math.round(talentShare * 100)}%)</span>
                      <span className="text-xs font-semibold text-green-400">
                        {fmt(Math.round(totalEarned * talentShare))} to you
                      </span>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          <RequestsList initialRequests={serialized} publicSlug={publicSlug} />
        </>
      )}
    </div>
  );
}
