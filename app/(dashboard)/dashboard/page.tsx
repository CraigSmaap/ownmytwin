import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ShareLinkCard } from "@/components/dashboard/share-link-card";
import { DailyUpdate } from "@/components/dashboard/daily-update";
import { PopiaBanner } from "@/components/dashboard/popia-banner";

const PLATFORM_ICONS: Record<string, string> = {
  whatsapp: "💬", email: "📧", instagram: "📸",
  twitter: "🐦", sms: "📱", other: "💭",
};

const CATEGORY_STYLES: Record<string, string> = {
  life_event:   "bg-blue-900/40 text-blue-300 border-blue-800/50",
  preference:   "bg-pink-900/40 text-pink-300 border-pink-800/50",
  relationship: "bg-purple-900/40 text-purple-300 border-purple-800/50",
  achievement:  "bg-amber-900/40 text-amber-300 border-amber-800/50",
  belief:       "bg-yellow-900/40 text-yellow-300 border-yellow-800/50",
  correction:   "bg-teal-900/40 text-teal-300 border-teal-800/50",
  other:        "bg-slate-800 text-slate-400 border-slate-700",
};

const CATEGORY_ICONS: Record<string, string> = {
  life_event: "📅", preference: "❤️", relationship: "👥",
  achievement: "🏆", belief: "💡", correction: "✏️", other: "📝",
};

type PersonalityData = {
  tone?: string[];
  values?: string[];
  profession?: string;
  location?: string;
  humor?: string;
};

export default async function DashboardPage() {
  const session = await auth();
  const userId  = session!.user!.id;

  const [user, twin, photos, voiceRecordings] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { name: true, image: true, createdAt: true, onboardingComplete: true, publicSlug: true, accountType: true, buyerProfile: true, role: true } }),
    db.twin.findUnique({ where: { userId }, include: { _count: { select: { memories: true, messages: true } }, licenseRequests: { select: { agreedPrice: true, paidAt: true, status: true } } } }),
    db.likenessPhoto.count({ where: { userId } }),
    db.voiceRecording.count({ where: { userId } }),
  ]);

  const paidRequests    = twin?.licenseRequests.filter((r) => r.paidAt !== null) ?? [];
  const pendingRequests = twin?.licenseRequests.filter((r) => r.status === "pending") ?? [];
  const totalEarned     = paidRequests.reduce((s, r) => s + r.agreedPrice, 0);
  const thisMonth       = new Date(); thisMonth.setDate(1); thisMonth.setHours(0,0,0,0);
  const earnedThisMonth = paidRequests.filter((r) => r.paidAt! >= thisMonth).reduce((s, r) => s + r.agreedPrice, 0);

  if (user && !user.onboardingComplete && user.role !== "admin") redirect("/onboarding");

  if (user?.accountType === "buyer") {
    const buyerRequests = await db.licenseRequest.findMany({
      where:   { buyerId: userId },
      orderBy: { createdAt: "desc" },
      take:    10,
      include: { twin: { select: { name: true, user: { select: { name: true } } } } },
    });
    return <BuyerDashboard firstName={user.name?.split(" ")[0] ?? "there"} requests={buyerRequests} />;
  }

  const [recentMessages, recentMemories] = twin
    ? await Promise.all([
        db.message.findMany({ where: { twinId: twin.id }, orderBy: { createdAt: "desc" }, take: 12, select: { id: true, role: true, content: true, platform: true, createdAt: true } }),
        db.memory.findMany({ where: { twinId: twin.id }, orderBy: { createdAt: "desc" }, take: 3, select: { id: true, title: true, content: true, category: true } }),
      ])
    : [[], []];

  type MsgRow = typeof recentMessages[number];
  const replyPairs: { incoming: MsgRow; reply: MsgRow }[] = [];
  for (let i = 0; i < recentMessages.length; i++) {
    if (recentMessages[i].role === "assistant" && recentMessages[i + 1]?.role === "user") {
      replyPairs.push({ incoming: recentMessages[i + 1], reply: recentMessages[i] });
      i++;
      if (replyPairs.length >= 4) break;
    }
  }

  const twinConfigured = !!twin?.systemPrompt;
  const memCount       = twin?._count.memories ?? 0;
  const replyCount     = Math.floor((twin?._count.messages ?? 0) / 2);
  const personality    = twin?.personality as PersonalityData | null;
  const toneTags       = personality?.tone?.slice(0, 4) ?? [];
  const valueTags      = personality?.values?.slice(0, 4) ?? [];

  const checks     = [twinConfigured, memCount > 0, replyCount > 0, photos > 0, voiceRecordings > 0];
  const completeness = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const firstName  = user?.name?.split(" ")[0] ?? "there";
  const hour       = new Date().getHours();
  const greeting   = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const SETUP_ITEMS = [
    { label: "Configure your Twin",       done: twinConfigured,     href: "/twin",     icon: "🤖" },
    { label: "Add your first memory",     done: memCount > 0,       href: "/memories", icon: "🧠" },
    { label: "Generate your first reply", done: replyCount > 0,     href: "/reply",    icon: "💬" },
    { label: "Upload likeness photos",    done: photos > 0,         href: "/twin",     icon: "📸" },
    { label: "Record your voice samples", done: voiceRecordings > 0,href: "/twin",     icon: "🎙️" },
  ];
  const allDone = SETUP_ITEMS.every(s => s.done);

  return (
    <div className="max-w-6xl space-y-6">

      <PopiaBanner />

      {/* Hero greeting */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900/50 via-slate-900 to-slate-900 border border-indigo-800/30 rounded-2xl p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {user?.image ? (
              <Image src={user.image} alt="avatar" width={56} height={56} className="w-14 h-14 rounded-full border-2 border-indigo-500/50 object-cover shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-indigo-600/30 border-2 border-indigo-500/50 flex items-center justify-center text-2xl shrink-0">👤</div>
            )}
            <div>
              <p className="text-slate-400 text-sm">{greeting}</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{firstName} 👋</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                {allDone ? "Your Twin is fully configured and ready." : `Twin ${completeness}% complete — keep going!`}
              </p>
            </div>
          </div>
          <Link href="/reply" className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors shrink-0 touch-manipulation">
            <span>💬</span> Generate Reply
          </Link>
        </div>
        <div className="relative mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-medium">Twin completeness</span>
            <span className="text-xs font-bold text-indigo-400">{completeness}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700" style={{ width: `${completeness}%` }} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Replies Generated" value={replyCount}      icon="💬" color="indigo" href="/reply"    />
        <StatCard label="Memories Stored"   value={memCount}        icon="🧠" color="violet" href="/memories" />
        <StatCard label="Photos Uploaded"   value={photos}          icon="📸" color="pink"   href="/twin"     />
        <StatCard label="Voice Samples"     value={voiceRecordings} icon="🎙️" color="cyan"   href="/twin"     />
      </div>

      {/* Earnings summary — only show once there's activity */}
      {(totalEarned > 0 || pendingRequests.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/requests" className="relative overflow-hidden bg-gradient-to-br from-green-500/10 to-slate-900 border border-green-800/40 rounded-2xl p-5 hover:border-green-700/60 transition-colors">
            <p className="text-xs text-slate-500 mb-1">Total Earned</p>
            <p className="text-3xl font-bold text-white">R{totalEarned.toLocaleString("en-ZA")}</p>
            <p className="text-xs text-green-400 mt-1">{paidRequests.length} paid {paidRequests.length === 1 ? "license" : "licenses"}</p>
            <span className="absolute top-4 right-4 text-2xl opacity-20">💰</span>
          </Link>
          <Link href="/requests" className="relative overflow-hidden bg-gradient-to-br from-indigo-500/10 to-slate-900 border border-indigo-800/40 rounded-2xl p-5 hover:border-indigo-700/60 transition-colors">
            <p className="text-xs text-slate-500 mb-1">This Month</p>
            <p className="text-3xl font-bold text-white">R{earnedThisMonth.toLocaleString("en-ZA")}</p>
            <p className="text-xs text-indigo-400 mt-1">{new Date().toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}</p>
            <span className="absolute top-4 right-4 text-2xl opacity-20">📅</span>
          </Link>
          <Link href="/requests" className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 to-slate-900 border border-amber-800/40 rounded-2xl p-5 hover:border-amber-700/60 transition-colors">
            <p className="text-xs text-slate-500 mb-1">Pending Requests</p>
            <p className="text-3xl font-bold text-white">{pendingRequests.length}</p>
            <p className="text-xs text-amber-400 mt-1">{pendingRequests.length > 0 ? "Awaiting review" : "All clear"}</p>
            <span className="absolute top-4 right-4 text-2xl opacity-20">⏳</span>
          </Link>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        <div className="lg:col-span-2 space-y-6">

          {!allDone && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-semibold text-white">Get your Twin ready</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{SETUP_ITEMS.filter(s => s.done).length} of {SETUP_ITEMS.length} complete</p>
                </div>
                <div className="w-12 h-12 relative">
                  <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#1e293b" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#6366f1" strokeWidth="3"
                      strokeDasharray={`${completeness * 0.942} 94.2`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-indigo-400">{completeness}%</span>
                </div>
              </div>
              <div className="space-y-2">
                {SETUP_ITEMS.map((item) => (
                  <Link key={item.label} href={item.done ? "#" : item.href}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${item.done ? "opacity-40 pointer-events-none" : "hover:bg-slate-800 cursor-pointer"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${item.done ? "bg-green-900/50 border border-green-700 text-green-400" : "bg-slate-800 border border-slate-700"}`}>
                      {item.done ? "✓" : item.icon}
                    </div>
                    <p className={`text-sm font-medium flex-1 ${item.done ? "text-slate-500 line-through" : "text-slate-200"}`}>{item.label}</p>
                    {!item.done && <span className="text-indigo-400 text-xs shrink-0">Start →</span>}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">Recent Replies</h2>
              <Link href="/reply" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Generate new →</Link>
            </div>
            {replyPairs.length > 0 ? (
              <div className="space-y-4">
                {replyPairs.map(({ incoming, reply }) => {
                  const icon = PLATFORM_ICONS[reply.platform ?? "other"] ?? "💭";
                  return (
                    <div key={reply.id} className="rounded-xl border border-slate-800 overflow-hidden">
                      <div className="bg-slate-800/40 px-4 py-3 border-b border-slate-800">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-sm">{icon}</span>
                          <span className="text-xs text-slate-500 capitalize">{reply.platform ?? "message"}</span>
                          <span className="text-xs text-slate-700">·</span>
                          <span className="text-xs text-slate-600">{new Date(reply.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{incoming.content}</p>
                      </div>
                      <div className="px-4 py-3 flex gap-2">
                        <div className="w-5 h-5 rounded-full bg-indigo-600/30 border border-indigo-700/50 flex items-center justify-center text-xs shrink-0 mt-0.5">🤖</div>
                        <p className="text-sm text-slate-200 leading-relaxed line-clamp-3">{reply.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-xl">
                <p className="text-3xl mb-3">💬</p>
                <p className="text-slate-500 text-sm mb-4">No replies yet</p>
                <Link href="/reply" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
                  Generate your first reply
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <DailyUpdate twinId={twin?.id ?? null} />

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${twinConfigured ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" : "bg-amber-400"}`} />
              <h2 className="font-semibold text-white">{twin?.name ?? "My Twin"}</h2>
              <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${twinConfigured ? "bg-green-900/40 text-green-400" : "bg-amber-900/40 text-amber-400"}`}>
                {twinConfigured ? "Active" : "Incomplete"}
              </span>
            </div>

            {(personality?.profession || personality?.location) && (
              <div className="space-y-1 text-xs text-slate-400">
                {personality.profession && <p>💼 {personality.profession}</p>}
                {personality.location   && <p>📍 {personality.location}</p>}
                {personality.humor      && <p>😄 {personality.humor} humour</p>}
              </div>
            )}

            {toneTags.length > 0 && (
              <div>
                <p className="text-xs text-slate-600 mb-2">Tone</p>
                <div className="flex flex-wrap gap-1.5">
                  {toneTags.map((t) => (
                    <span key={t} className="text-xs bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-800/50">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {valueTags.length > 0 && (
              <div>
                <p className="text-xs text-slate-600 mb-2">Values</p>
                <div className="flex flex-wrap gap-1.5">
                  {valueTags.map((v) => (
                    <span key={v} className="text-xs bg-violet-900/40 text-violet-300 px-2 py-0.5 rounded-full border border-violet-800/50">{v}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-center">
              {[
                { label: "Memories", value: memCount,        color: "text-violet-400" },
                { label: "Replies",  value: replyCount,      color: "text-indigo-400" },
                { label: "Photos",   value: photos,          color: "text-pink-400"   },
                { label: "Voice",    value: voiceRecordings, color: "text-cyan-400"   },
              ].map(row => (
                <div key={row.label} className="bg-slate-800/50 rounded-xl py-2.5">
                  <p className={`text-lg font-bold ${row.color}`}>{row.value}</p>
                  <p className="text-xs text-slate-500">{row.label}</p>
                </div>
              ))}
            </div>

            <Link href="/twin" className="block w-full text-center text-xs font-semibold border border-slate-700 hover:border-indigo-500 hover:text-indigo-400 text-slate-400 py-2.5 rounded-xl transition-colors">
              Edit Twin →
            </Link>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { href: "/reply",    icon: "💬", label: "Generate a Reply",  desc: "In your exact voice"   },
                { href: "/memories", icon: "🧠", label: "Add a Memory",      desc: "Teach your Twin"       },
                { href: "/twin",     icon: "🎙️", label: "Record Voice",      desc: "Voice profile samples" },
                { href: "/showcase", icon: "🎬", label: "Showcase Feed",     desc: "See what's been made"  },
              ].map((a) => (
                <Link key={a.href} href={a.href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors group touch-manipulation">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-base shrink-0 group-hover:border-indigo-600 transition-colors">
                    {a.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{a.label}</p>
                    <p className="text-xs text-slate-500">{a.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <ShareLinkCard slug={user?.publicSlug ?? null} />
        </div>
      </div>

      {recentMemories.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Recent Memories</h2>
            <Link href="/memories" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recentMemories.map((mem) => {
              const cat   = mem.category ?? "other";
              const style = CATEGORY_STYLES[cat] ?? CATEGORY_STYLES.other;
              const icon  = CATEGORY_ICONS[cat]  ?? "📝";
              return (
                <div key={mem.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${style}`}>
                      <span>{icon}</span>
                      <span className="capitalize">{cat.replace("_", " ")}</span>
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white mb-1.5">{mem.title}</p>
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{mem.content}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

type BuyerRequest = {
  id: string; status: string; usageType: string; message: string; createdAt: Date;
  twin: { name: string | null; user: { name: string | null } } | null;
};

const STATUS_STYLES: Record<string, string> = {
  pending:  "bg-amber-900/40 text-amber-300 border-amber-800/50",
  approved: "bg-green-900/40 text-green-300 border-green-800/50",
  rejected: "bg-red-900/40 text-red-300 border-red-800/50",
};

const LICENSE_LABELS: Record<string, string> = {
  voice_only: "Voice Only", voiceover: "Voiceover", public_speaking: "Public Speaking",
  face_avatar: "Face / Avatar", full_likeness: "Full Likeness", social_media: "Social Media",
  ads: "Advertising", ai_presenter: "AI Presenter", virtual_influencer: "Virtual Influencer",
  educational: "Educational", corporate_training: "Corporate Training",
  customer_service: "Customer Service", film_tv: "Film / TV", game_npc: "Game NPC",
  motion_style: "Motion Style",
};

function BuyerDashboard({ firstName, requests }: { firstName: string; requests: BuyerRequest[] }) {
  const pending  = requests.filter((r) => r.status === "pending").length;
  const approved = requests.filter((r) => r.status === "approved").length;
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-4xl space-y-6">
      <PopiaBanner />

      <div className="relative overflow-hidden bg-gradient-to-br from-violet-900/50 via-slate-900 to-slate-900 border border-violet-800/30 rounded-2xl p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-slate-400 text-sm">{greeting}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{firstName} 👋</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {requests.length === 0 ? "Browse the marketplace to find AI twins to license." : `You have ${requests.length} license request${requests.length !== 1 ? "s" : ""} submitted.`}
            </p>
          </div>
          <Link href="/marketplace" className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors shrink-0 touch-manipulation">
            <span>🏪</span> Browse Marketplace
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Requests", value: requests.length, color: "text-violet-400", bg: "from-violet-500/10 border-violet-800/40" },
          { label: "Pending",        value: pending,         color: "text-amber-400",  bg: "from-amber-500/10 border-amber-800/40"  },
          { label: "Approved",       value: approved,        color: "text-green-400",  bg: "from-green-500/10 border-green-800/40"  },
        ].map((s) => (
          <div key={s.label} className={`relative overflow-hidden bg-gradient-to-br ${s.bg} to-slate-900 border rounded-2xl p-4 sm:p-5`}>
            <p className={`text-2xl sm:text-3xl font-bold ${s.color} mb-0.5`}>{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-white">Your License Requests</h2>
          <Link href="/marketplace" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Browse more →</Link>
        </div>
        {requests.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl">
            <p className="text-4xl mb-3">📬</p>
            <p className="text-slate-500 text-sm mb-4">No requests submitted yet</p>
            <Link href="/marketplace" className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
              Find AI Twins to License
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-white text-sm">
                      {req.twin?.name ?? "Unknown Twin"}
                      {req.twin?.user.name && <span className="text-slate-500 font-normal"> by {req.twin.user.name}</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">{LICENSE_LABELS[req.usageType] ?? req.usageType}</span>
                      <span className="text-xs text-slate-600">{new Date(req.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{req.message}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${STATUS_STYLES[req.status] ?? STATUS_STYLES.pending}`}>{req.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="font-semibold text-white mb-4">Explore</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { href: "/marketplace", icon: "🏪", label: "Browse Marketplace", desc: "Find and license AI twins"  },
            { href: "/showcase",    icon: "🎬", label: "Showcase Feed",      desc: "See work made with twins"   },
            { href: "/settings",    icon: "⚙️", label: "Account Settings",   desc: "Update your buyer profile"  },
          ].map((a) => (
            <Link key={a.href} href={a.href} className="flex items-center gap-3 p-4 rounded-xl border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 transition-colors group touch-manipulation">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-base shrink-0 group-hover:border-violet-600 transition-colors">{a.icon}</div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{a.label}</p>
                <p className="text-xs text-slate-500">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, href }: {
  label: string; value: number; icon: string;
  color: "indigo" | "violet" | "pink" | "cyan"; href: string;
}) {
  const colors = {
    indigo: "from-indigo-500/10 border-indigo-800/40 text-indigo-400",
    violet: "from-violet-500/10 border-violet-800/40 text-violet-400",
    pink:   "from-pink-500/10 border-pink-800/40 text-pink-400",
    cyan:   "from-cyan-500/10 border-cyan-800/40 text-cyan-400",
  };
  return (
    <Link href={href} className={`relative overflow-hidden bg-gradient-to-br ${colors[color]} to-slate-900 border rounded-2xl p-4 sm:p-5 block hover:scale-[1.02] transition-transform`}>
      <div className="text-2xl mb-3">{icon}</div>
      <p className="text-2xl sm:text-3xl font-bold text-white mb-0.5">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </Link>
  );
}
