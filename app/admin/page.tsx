import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { GrowthChart, type DailySignup } from "./components/GrowthChart";
import { ElevenLabsCard, type ElevenLabsUsage } from "./components/ElevenLabsCard";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const now          = new Date();
  const monthStart   = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const weekAgo      = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyAgo    = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    freeUsers,
    proUsers,
    verifiedUsers,
    kycVerifiedUsers,
    pendingKyc,
    signupsThisMonth,
    signupsLastMonth,
    totalTwins,
    configuredTwins,
    marketplaceTwins,
    totalMemories,
    totalMessages,
    totalPhotos,
    totalVoice,
    pendingRequests,
    totalRequests,
    approvedRequests,
    paidRequests,
    recentUsers,
    activeThisWeek,
    recentPaid,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { plan: "free" } }),
    db.user.count({ where: { plan: "pro" } }),
    db.user.count({ where: { emailVerified: { not: null } } }),
    db.user.count({ where: { verificationStatus: "verified" } }),
    db.verificationRequest.count({ where: { status: "pending" } }),
    db.user.count({ where: { createdAt: { gte: monthStart } } }),
    db.user.count({ where: { createdAt: { gte: lastMonthStart, lt: monthStart } } }),
    db.twin.count(),
    db.twin.count({ where: { systemPrompt: { not: null } } }),
    db.twin.count({ where: { marketplaceVisible: true } }),
    db.memory.count(),
    db.message.count({ where: { role: "assistant" } }),
    db.likenessPhoto.count(),
    db.voiceRecording.count(),
    db.licenseRequest.count({ where: { status: "pending" } }),
    db.licenseRequest.count(),
    db.licenseRequest.count({ where: { status: "approved" } }),
    db.licenseRequest.count({ where: { paidAt: { not: null } } }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true, name: true, email: true, role: true, plan: true,
        createdAt: true, emailVerified: true, onboardingComplete: true,
        accountType: true,
        _count: { select: { photos: true, voiceRecordings: true } },
        twin: { select: { marketplaceVisible: true, _count: { select: { memories: true, messages: true } } } },
      },
    }),
    db.message.findMany({
      where: { createdAt: { gte: weekAgo }, role: "assistant" },
      distinct: ["twinId"],
      select: { twinId: true },
    }),
    db.licenseRequest.findMany({
      where: { paidAt: { not: null }, updatedAt: { gte: thirtyAgo } },
      select: { agreedPrice: true, usageType: true, paidAt: true, buyerName: true,
        twin: { select: { name: true } } },
      orderBy: { paidAt: "desc" },
      take: 8,
    }),
  ]);

  // Daily signups — last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentSignups = await db.user.findMany({
    where:  { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true, plan: true },
    orderBy: { createdAt: "asc" },
  });

  const signupMap: Record<string, { free: number; pro: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    signupMap[key] = { free: 0, pro: 0 };
  }
  for (const u of recentSignups) {
    const key = u.createdAt.toISOString().split("T")[0];
    if (signupMap[key]) {
      if (u.plan === "pro") signupMap[key].pro++;
      else signupMap[key].free++;
    }
  }
  const growthData: DailySignup[] = Object.entries(signupMap).map(([date, v]) => ({
    date, free: v.free, pro: v.pro, total: v.free + v.pro,
  }));

  // ElevenLabs usage
  let elevenLabsUsage: ElevenLabsUsage;
  try {
    const elRes = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "" },
      next: { revalidate: 300 },
    });
    const elData = await elRes.json() as {
      character_count: number; character_limit: number;
      voice_limit: number; voices_used: { voice_id: string }[];
      tier: string; next_character_count_reset_unix: number;
    };
    const now2        = new Date();
    const resetDate   = new Date(elData.next_character_count_reset_unix * 1000);
    const daysInMonth = Math.round((resetDate.getTime() - new Date(resetDate.getFullYear(), resetDate.getMonth() - 1, resetDate.getDate()).getTime()) / (24 * 60 * 60 * 1000));
    const daysToReset = Math.ceil((resetDate.getTime() - now2.getTime()) / (24 * 60 * 60 * 1000));
    const daysIntoMonth = Math.max(1, daysInMonth - daysToReset);
    elevenLabsUsage = {
      characterCount:  elData.character_count,
      characterLimit:  elData.character_limit,
      voiceLimit:      elData.voice_limit,
      voicesUsed:      elData.voices_used?.length ?? 0,
      tier:            elData.tier,
      daysIntoMonth,
      daysInMonth,
    };
  } catch {
    elevenLabsUsage = {
      characterCount: 0, characterLimit: 0, voiceLimit: 0,
      voicesUsed: 0, tier: "unknown", daysIntoMonth: 1, daysInMonth: 30,
      error: "Could not fetch ElevenLabs usage — check ELEVENLABS_API_KEY",
    };
  }

  // Revenue calculations
  const estimatedMRR    = proUsers * 9;
  const growthPct       = signupsLastMonth > 0
    ? Math.round(((signupsThisMonth - signupsLastMonth) / signupsLastMonth) * 100)
    : signupsThisMonth > 0 ? 100 : 0;

  // Platform cut from paid licenses (20%)
  const allPaidRequests = await db.licenseRequest.findMany({
    where:  { paidAt: { not: null } },
    select: { agreedPrice: true },
  });
  const totalLicenseVolume = allPaidRequests.reduce((s, r) => s + r.agreedPrice, 0);
  const platformRevenue    = Math.round(totalLicenseVolume * 0.20);

  const conversionRate  = totalUsers > 0 ? Math.round((proUsers / totalUsers) * 100) : 0;
  const activePct       = totalTwins > 0 ? Math.round((activeThisWeek.length / totalTwins) * 100) : 0;
  const funnelApproval  = totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0;
  const funnelPayment   = approvedRequests > 0 ? Math.round((paidRequests / approvedRequests) * 100) : 0;

  const LICENSE_LABELS: Record<string, string> = {
    voice_only: "Voice Only", voiceover: "Voiceover", public_speaking: "Public Speaking",
    face_avatar: "Face / Avatar", full_likeness: "Full Likeness", social_media: "Social Media",
    ads: "Advertising", ai_presenter: "AI Presenter", virtual_influencer: "Virtual Influencer",
    educational: "Educational", corporate_training: "Corporate Training",
    customer_service: "Customer Service", film_tv: "Film / TV", game_npc: "Game NPC",
    motion_style: "Motion Style",
  };

  const fmt = (n: number) => `R${n.toLocaleString("en-ZA")}`;

  return (
    <div className="max-w-7xl space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">God View</h1>
          <p className="text-slate-400 text-sm mt-1">Platform revenue, growth, and activity</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link href="/dashboard" className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors border border-slate-700">
            ← Dashboard
          </Link>
          <Link href="/admin/verification" className="bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors border border-slate-700">
            KYC Queue {pendingKyc > 0 && <span className="ml-1.5 bg-green-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{pendingKyc}</span>}
          </Link>
          <Link href="/admin/requests" className="bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors border border-slate-700">
            Requests {pendingRequests > 0 && <span className="ml-1.5 bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{pendingRequests}</span>}
          </Link>
          <Link href="/admin/users" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            Users →
          </Link>
        </div>
      </div>

      {/* Growth chart + ElevenLabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">User Growth</h2>
              <p className="text-xs text-slate-600 mt-0.5">Daily signups — last 30 days</p>
            </div>
            <div className="flex gap-3 text-xs text-slate-500">
              <span>Total: <strong className="text-white">{growthData.reduce((s, d) => s + d.total, 0)}</strong></span>
              <span>Pro: <strong className="text-purple-400">{growthData.reduce((s, d) => s + d.pro, 0)}</strong></span>
              <span>Free: <strong className="text-indigo-400">{growthData.reduce((s, d) => s + d.free, 0)}</strong></span>
            </div>
          </div>
          <GrowthChart data={growthData} />
        </div>
        <ElevenLabsCard usage={elevenLabsUsage} />
      </div>

      {/* Revenue row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-green-500/15 to-slate-900 border border-green-800/40 rounded-2xl p-6">
          <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Est. MRR</p>
          <p className="text-4xl font-extrabold text-white">${estimatedMRR.toLocaleString()}</p>
          <p className="text-xs text-green-400 mt-1.5">{proUsers} Pro {proUsers === 1 ? "subscriber" : "subscribers"} × $9</p>
          <span className="absolute top-5 right-5 text-3xl opacity-20">💰</span>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-violet-500/15 to-slate-900 border border-violet-800/40 rounded-2xl p-6">
          <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Platform Revenue</p>
          <p className="text-4xl font-extrabold text-white">{fmt(platformRevenue)}</p>
          <p className="text-xs text-violet-400 mt-1.5">20% cut · {fmt(totalLicenseVolume)} license volume</p>
          <span className="absolute top-5 right-5 text-3xl opacity-20">🏦</span>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500/15 to-slate-900 border border-indigo-800/40 rounded-2xl p-6">
          <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">New This Month</p>
          <p className="text-4xl font-extrabold text-white">{signupsThisMonth}</p>
          <p className={`text-xs mt-1.5 font-medium ${growthPct >= 0 ? "text-green-400" : "text-red-400"}`}>
            {growthPct >= 0 ? "+" : ""}{growthPct}% vs last month ({signupsLastMonth})
          </p>
          <span className="absolute top-5 right-5 text-3xl opacity-20">📈</span>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-red-500/10 to-slate-900 border border-red-900/30 rounded-2xl p-6">
          <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Churn Rate</p>
          <p className="text-4xl font-extrabold text-white">—</p>
          <p className="text-xs text-slate-600 mt-1.5">Requires billing integration</p>
          <span className="absolute top-3 right-3 text-xs bg-slate-800 border border-slate-700 text-slate-500 px-2 py-1 rounded-full">Coming soon</span>
          <span className="absolute top-5 right-5 text-3xl opacity-10">📉</span>
        </div>
      </div>

      {/* User breakdown + activity */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Users"     value={totalUsers}             sub={`${verifiedUsers} verified`}       color="indigo" icon="👥" />
        <StatCard label="Pro Users"       value={proUsers}               sub={`${conversionRate}% conversion`}  color="green"  icon="⭐" />
        <StatCard label="Active Twins"    value={activeThisWeek.length}  sub={`${activePct}% of twins this wk`} color="violet" icon="🤖" />
        <StatCard label="On Marketplace"  value={marketplaceTwins}       sub={`of ${totalTwins} twins`}         color="pink"   icon="🏪" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — recent signups */}
        <div className="lg:col-span-2 space-y-6">

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-semibold text-white">Recent Signups</h2>
              <Link href="/admin/users" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
            </div>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Plan</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {recentUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-3.5">
                        <p className="font-medium text-white truncate max-w-[160px]">{u.name ?? "No name"}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[160px]">{u.email}</p>
                        <p className="text-xs text-slate-600 mt-0.5 capitalize">{u.accountType}</p>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                          u.plan === "pro"
                            ? "bg-green-900/40 text-green-400 border-green-800/50"
                            : "bg-slate-800 text-slate-500 border-slate-700"
                        }`}>
                          {u.plan === "pro" ? "⭐ Pro" : "Free"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-3 text-xs text-slate-500">
                          <span title="Memories">🧠 {u.twin?._count.memories ?? 0}</span>
                          <span title="Replies">💬 {Math.floor((u.twin?._count.messages ?? 0) / 2)}</span>
                          <span title="Photos">📸 {u._count.photos}</span>
                        </div>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          {u.emailVerified         && <span className="text-xs bg-green-900/30 text-green-500 border border-green-800/30 px-1.5 py-0.5 rounded">✓ Email</span>}
                          {u.twin?.marketplaceVisible && <span className="text-xs bg-violet-900/30 text-violet-400 border border-violet-800/30 px-1.5 py-0.5 rounded">🏪 Listed</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="sm:hidden divide-y divide-slate-800">
              {recentUsers.map((u) => (
                <div key={u.id} className="px-4 py-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-white text-sm truncate">{u.name ?? "No name"}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.plan === "pro" ? "text-green-400" : "text-slate-500"}`}>
                      {u.plan === "pro" ? "⭐ Pro" : "Free"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{u.email}</p>
                  <div className="flex gap-3 text-xs text-slate-600">
                    <span>🧠 {u.twin?._count.memories ?? 0}</span>
                    <span>💬 {Math.floor((u.twin?._count.messages ?? 0) / 2)}</span>
                    <span>📸 {u._count.photos}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent paid licenses */}
          {recentPaid.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800">
                <h2 className="font-semibold text-white">Recent License Payments</h2>
              </div>
              <div className="divide-y divide-slate-800/50">
                {recentPaid.map((r, i) => (
                  <div key={i} className="px-6 py-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white font-medium">{r.buyerName}</p>
                      <p className="text-xs text-slate-500">
                        {LICENSE_LABELS[r.usageType] ?? r.usageType} · {r.twin?.name ?? "Unknown Twin"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-400">{fmt(r.agreedPrice)}</p>
                      <p className="text-xs text-slate-600">
                        {r.paidAt ? new Date(r.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Plan breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-4">Plan Breakdown</h2>
            <div className="space-y-4">
              <Meter label={`Free (${freeUsers})`} value={freeUsers} total={totalUsers} color="slate" />
              <Meter label={`Pro (${proUsers})`}   value={proUsers}  total={totalUsers} color="green" />
            </div>
            <div className="mt-5 pt-5 border-t border-slate-800 flex items-center justify-between text-sm">
              <span className="text-slate-500">Free → Pro rate</span>
              <span className="font-bold text-green-400">{conversionRate}%</span>
            </div>
          </div>

          {/* Licensing funnel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-4">Licensing Funnel</h2>
            <div className="space-y-4">
              <FunnelRow label="Submitted"  value={totalRequests}    pct={100} />
              <FunnelRow label="Approved"   value={approvedRequests} pct={funnelApproval} />
              <FunnelRow label="Paid"       value={paidRequests}     pct={funnelPayment} color="green" />
            </div>
          </div>

          {/* Engagement */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-4">Engagement</h2>
            <div className="space-y-4">
              <Meter label="Email verified"    value={verifiedUsers}          total={totalUsers}       color="green"  />
              <Meter label="KYC verified"      value={kycVerifiedUsers}       total={totalUsers}       color="green"  />
              <Meter label="Twin configured"   value={configuredTwins}        total={totalTwins || 1}  color="indigo" />
              <Meter label="Active this week"  value={activeThisWeek.length}  total={totalTwins || 1}  color="violet" />
            </div>
          </div>

          {/* Media */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-4">Content Created</h2>
            <div className="space-y-3">
              {[
                { icon: "🧠", label: "Memories",      value: totalMemories  },
                { icon: "💬", label: "AI Replies",     value: totalMessages  },
                { icon: "📸", label: "Photos",         value: totalPhotos    },
                { icon: "🎙️", label: "Voice samples",  value: totalVoice     },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span>{row.icon}</span><span>{row.label}</span>
                  </div>
                  <span className="font-bold text-white">{row.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="bg-gradient-to-br from-green-900/20 to-slate-900 border border-green-800/30 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
              <h3 className="font-semibold text-white text-sm">Platform Status</h3>
            </div>
            <div className="space-y-1.5 text-xs text-slate-500 mt-3">
              <div className="flex justify-between"><span>Database</span><span className="text-green-400">✓ Online</span></div>
              <div className="flex justify-between"><span>AI (Anthropic)</span><span className="text-green-400">✓ Online</span></div>
              <div className="flex justify-between"><span>Payments (Paystack)</span><span className="text-green-400">✓ Online</span></div>
              <div className="flex justify-between"><span>Auth</span><span className="text-green-400">✓ Online</span></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color, icon }: {
  label: string; value: number; sub: string;
  color: "indigo" | "violet" | "green" | "pink"; icon: string;
}) {
  const colors = {
    indigo: "from-indigo-500/10 border-indigo-800/40 text-indigo-400",
    violet: "from-violet-500/10 border-violet-800/40 text-violet-400",
    green:  "from-green-500/10  border-green-800/40  text-green-400",
    pink:   "from-pink-500/10   border-pink-800/40   text-pink-400",
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} to-slate-900 border rounded-2xl p-5`}>
      <div className="text-2xl mb-3">{icon}</div>
      <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
      <p className="text-sm font-medium text-slate-300 mt-0.5">{label}</p>
      <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
    </div>
  );
}

function Meter({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const bar =
    color === "green"  ? "bg-green-500"  :
    color === "indigo" ? "bg-indigo-500" :
    color === "violet" ? "bg-violet-500" : "bg-slate-600";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 font-semibold">{value.toLocaleString()} <span className="text-slate-600">({pct}%)</span></span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-1.5 rounded-full ${bar} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function FunnelRow({ label, value, pct, color = "indigo" }: { label: string; value: number; pct: number; color?: string }) {
  const bar = color === "green" ? "bg-green-500" : "bg-indigo-500";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 font-semibold">{value} <span className="text-slate-600">({pct}%)</span></span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-1.5 rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
