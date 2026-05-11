import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/landing/navbar";
import { ActivityFeed } from "@/components/landing/activity-feed";
import { db } from "@/lib/db";

/* ─── Data ──────────────────────────────────────────────────────── */

const STATS = [
  { value: "R0",    label: "What you earn when brands use your AI likeness without your permission" },
  { value: "80%",   label: "of every licensing deal goes directly to you — your money, your rules" },
  { value: "24/7",  label: "your Twin replies to DMs, handles enquiries, and earns while you sleep" },
  { value: "3 min", label: "to build your AI Twin and go live on the marketplace" },
];

const CREATOR_TYPES = [
  { icon: "💄", label: "Fashion & Beauty" },
  { icon: "💪", label: "Fitness & Wellness" },
  { icon: "🎭", label: "Comedy & Lifestyle" },
  { icon: "🎵", label: "Music & Artists" },
  { icon: "🏆", label: "Sports & Athletes" },
  { icon: "🍕", label: "Food & Culture" },
  { icon: "💼", label: "Business & Finance" },
  { icon: "🎮", label: "Gaming & Tech" },
];

const FEATURES = [
  {
    icon: "💬",
    title: "Reply to every DM in your exact voice",
    desc: "Paste any message — brand deal, fan question, collab request. Your Twin replies exactly how you would. Your rhythm, your slang, your energy. Nobody can tell the difference.",
    tag: "Live now", tagColor: "green",
  },
  {
    icon: "🎬",
    title: "Reel Creator — your voice, your content",
    desc: "Prompt your Twin to write captions, scripts, and reel hooks in your authentic style. Consistent content across every platform — without the creative block.",
    tag: "Live now", tagColor: "green",
  },
  {
    icon: "💰",
    title: "License your likeness to brands",
    desc: "Brands want your face, your voice, your style in their AI campaigns. You set the rates. You set the rules. You approve every deal. You keep 80% of every rand.",
    tag: "Live now", tagColor: "green",
  },
  {
    icon: "🪪",
    title: "Your complete digital identity",
    desc: "Personality, tone, values, humour, signature phrases — all captured and locked in. Not a generic chatbot. A genuine digital version of you that brands and fans can engage with.",
    tag: "Live now", tagColor: "green",
  },
  {
    icon: "🧠",
    title: "Memory that never forgets",
    desc: "Your Twin knows your brand partnerships, your stories, your opinions, your history. Every response feels authentic because it genuinely reflects who you are.",
    tag: "Live now", tagColor: "green",
  },
  {
    icon: "🔒",
    title: "You own it. No asterisks.",
    desc: "Your data is never sold, never used to train models for other people. Export everything. Delete everything. No brand or platform touches your Twin without your explicit approval.",
    tag: "Always", tagColor: "indigo",
  },
];

const STEPS = [
  { number: "01", title: "Build your digital self",   desc: "Upload your photos. Define your personality, tone, and values. Add your signature phrases, your humour, your stories. Takes 3 minutes." },
  { number: "02", title: "Put your Twin to work",      desc: "Reply to DMs and brand enquiries in your voice. Generate content at scale. Stay present on every platform — even when you're completely off the grid." },
  { number: "03", title: "Get paid for being you.",    desc: "Set your licensing rates. Approve the brands you want. Earn 80% of every deal. Your identity is an asset — it's time to treat it like one." },
];

const PROOF_POINTS = [
  { icon: "🔒", title: "Zero data selling",       desc: "Your identity is never sold to advertisers or third parties" },
  { icon: "🚫", title: "No model training",       desc: "Your data never trains AI models for other users — ever" },
  { icon: "📦", title: "Full export — always",    desc: "Take every byte of your data with you, any time you choose" },
  { icon: "💰", title: "You earn the revenue",    desc: "80% of all licensing income goes directly to you" },
  { icon: "✋", title: "You approve every deal",  desc: "No brand uses your Twin without your explicit sign-off" },
  { icon: "⚡", title: "Delete on demand",         desc: "Remove everything instantly — no waiting, no questions asked" },
];

const PRICING = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Build your digital identity and start getting discovered.",
    features: [
      "10 AI replies per month",
      "Unlimited memories",
      "Full personality & identity profile",
      "Likeness photo collection",
      "Public profile link",
      "Receive license requests",
      "Keep 70% of every licensing deal",
      "Full data ownership — always",
    ],
    cta: "Claim My Twin — Free",
    href: "/login",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "per month",
    description: "Unlock earning, creation, and your full digital self.",
    badge: "Most Popular",
    features: [
      "Unlimited AI replies",
      "Marketplace listing — get discovered by brands",
      "Keep 80% of every licensing deal",
      "Voice cloning — your exact voice",
      "Reel Creator — scripts & captions",
      "Writing style analysis",
      "Developer API access",
      "Full data ownership — always",
    ],
    cta: "Start Pro — 7 Days Free",
    href: "/login",
    highlight: true,
  },
];

const TAG_COLORS: Record<string, string> = {
  green:  "bg-green-50 text-green-700 border-green-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

/* ─── Page ──────────────────────────────────────────────────────── */

export default async function Home() {
  // ── Activity feed ────────────────────────────────────────────────
  const LICENSE_LABELS: Record<string, string> = {
    voice_only: "Voice Only", voiceover: "Voiceover", public_speaking: "Public Speaking",
    face_avatar: "Face / Avatar", full_likeness: "Full Likeness", social_media: "Social Media",
    ads: "Advertising", ai_presenter: "AI Presenter", virtual_influencer: "Virtual Influencer",
    educational: "Educational", corporate_training: "Corporate Training",
    customer_service: "Customer Service", film_tv: "Film / TV", game_npc: "Game NPC",
    motion_style: "Motion Style",
  };
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo  = new Date(Date.now() -  7 * 24 * 60 * 60 * 1000);

  const [feedApprovals, feedListings, feedMemories, feedMessages] = await Promise.all([
    db.licenseRequest.findMany({
      where: { status: "approved", updatedAt: { gte: thirtyDaysAgo }, twin: { marketplaceVisible: true, user: { publicSlug: { not: null } } } },
      select: { id: true, usageType: true, updatedAt: true, twin: { select: { name: true, userId: true, user: { select: { publicSlug: true, image: true } } } } },
      orderBy: { updatedAt: "desc" }, take: 6,
    }),
    db.twin.findMany({
      where: { marketplaceVisible: true, user: { publicSlug: { not: null } }, updatedAt: { gte: thirtyDaysAgo } },
      select: { id: true, name: true, updatedAt: true, userId: true, user: { select: { publicSlug: true, image: true } } },
      orderBy: { updatedAt: "desc" }, take: 6,
    }),
    db.memory.findMany({
      where: { visibility: "marketplace", createdAt: { gte: thirtyDaysAgo }, twin: { marketplaceVisible: true, user: { publicSlug: { not: null } } } },
      select: { id: true, title: true, createdAt: true, twin: { select: { name: true, userId: true, user: { select: { publicSlug: true, image: true } } } } },
      orderBy: { createdAt: "desc" }, take: 6,
    }),
    db.message.findMany({
      where: { role: "assistant", createdAt: { gte: sevenDaysAgo }, twin: { marketplaceVisible: true, user: { publicSlug: { not: null } } } },
      select: { twinId: true, createdAt: true, twin: { select: { name: true, userId: true, user: { select: { publicSlug: true, image: true } } } } },
    }),
  ]);

  const replyMap: Record<string, { count: number; twin: typeof feedMessages[0]["twin"]; latest: Date }> = {};
  for (const m of feedMessages) {
    if (!replyMap[m.twinId]) replyMap[m.twinId] = { count: 0, twin: m.twin, latest: m.createdAt };
    replyMap[m.twinId].count++;
    if (m.createdAt > replyMap[m.twinId].latest) replyMap[m.twinId].latest = m.createdAt;
  }
  const feedReplies = Object.entries(replyMap).filter(([, v]) => v.count >= 5).sort((a, b) => b[1].count - a[1].count).slice(0, 3);

  const feedUserIds = [
    ...feedApprovals.map((r) => r.twin.userId),
    ...feedListings.map((t) => t.userId),
    ...feedMemories.map((m) => m.twin.userId),
    ...feedReplies.map(([, v]) => v.twin.userId),
  ];
  const feedPhotos = await db.likenessPhoto.findMany({
    where: { userId: { in: feedUserIds } }, orderBy: { createdAt: "asc" }, select: { userId: true, url: true },
  });
  const feedPhotoByUser: Record<string, string> = {};
  for (const p of feedPhotos) { if (!feedPhotoByUser[p.userId]) feedPhotoByUser[p.userId] = p.url; }

  type FeedItem = { id: string; type: string; icon: string; twinName: string; slug: string; photoUrl: string | null; description: string; timestamp: string };
  const feedItems: FeedItem[] = [
    ...feedApprovals.map((r) => ({ id: `a-${r.id}`, type: "license_approved",   icon: "🤝", twinName: r.twin.name ?? "", slug: r.twin.user.publicSlug!, photoUrl: feedPhotoByUser[r.twin.userId] ?? r.twin.user.image ?? null, description: `just had a ${LICENSE_LABELS[r.usageType] ?? r.usageType} license approved`, timestamp: r.updatedAt.toISOString() })),
    ...feedListings.map((t) => ({ id: `l-${t.id}`, type: "marketplace_joined",  icon: "🚀", twinName: t.name ?? "",        slug: t.user.publicSlug!,       photoUrl: feedPhotoByUser[t.userId] ?? t.user.image ?? null,           description: "is now available for licensing",                                                                        timestamp: t.updatedAt.toISOString() })),
    ...feedMemories.map((m) => ({ id: `m-${m.id}`, type: "memory_shared",       icon: "🧠", twinName: m.twin.name ?? "", slug: m.twin.user.publicSlug!, photoUrl: feedPhotoByUser[m.twin.userId] ?? m.twin.user.image ?? null, description: `just shared a new memory — "${m.title}"`,                                                              timestamp: m.createdAt.toISOString() })),
    ...feedReplies.map(([tid, v]) => ({ id: `r-${tid}`, type: "reply_milestone", icon: "💬", twinName: v.twin.name ?? "", slug: v.twin.user.publicSlug!, photoUrl: feedPhotoByUser[v.twin.userId] ?? v.twin.user.image ?? null, description: `generated ${v.count} replies in their voice this week`,                                               timestamp: v.latest.toISOString() })),
  ].filter((i) => i.twinName && i.slug).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

  // ── Featured profiles ────────────────────────────────────────────
  type Personality = { profession?: string; location?: string; tone?: string[] };
  const featuredTwins = await db.twin.findMany({
    where: { marketplaceVisible: true, user: { publicSlug: { not: null } } },
    select: {
      id: true, name: true, bio: true, personality: true, userId: true,
      user: { select: { publicSlug: true, image: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 6,
  });
  const featuredUserIds = featuredTwins.map((t) => t.userId);
  const featuredPhotos  = await db.likenessPhoto.findMany({
    where:   { userId: { in: featuredUserIds } },
    orderBy: { createdAt: "asc" },
    select:  { userId: true, url: true },
  });
  const photoByUser: Record<string, string> = {};
  for (const p of featuredPhotos) { if (!photoByUser[p.userId]) photoByUser[p.userId] = p.url; }
  const featured = featuredTwins.map((t) => {
    const per = (t.personality ?? {}) as Personality;
    return {
      id: t.id, name: t.name ?? "", slug: t.user.publicSlug!,
      profession: per.profession ?? null,
      tone: per.tone ?? [],
      photoUrl: photoByUser[t.userId] ?? t.user.image ?? null,
    };
  });

  return (
    <div className="relative text-slate-900 min-h-screen">

      {/* Full-page background */}
      <div className="fixed inset-0 -z-10">
        <Image src="/background2.png" alt="" fill className="object-cover object-center" priority />
      </div>

      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative pt-40 pb-28 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-white/50" />

        <div className="relative max-w-6xl mx-auto">

          {/* SA first-mover badge */}
          <div className="flex justify-center mb-8">
            <span className="inline-flex items-center gap-2.5 bg-indigo-600 text-white text-xs font-bold px-5 py-2.5 rounded-full tracking-wide shadow-lg shadow-indigo-200">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              🇿🇦 South Africa&apos;s First AI Creator Platform — Early Access Open
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-center text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6 text-slate-900 max-w-5xl mx-auto">
            Your audience never stops.
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Your Twin never sleeps.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-center text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            Reply to every DM in your exact voice. License your likeness to brands.
            <strong className="text-slate-900"> Earn while you&apos;re offline.</strong>{" "}
            SA&apos;s biggest creators are building their Twins right now.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link
              href="/login"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-12 py-5 rounded-2xl text-xl transition-all shadow-2xl shadow-indigo-300 hover:shadow-indigo-400 hover:scale-[1.02] active:scale-[0.98]"
            >
              Claim My Twin — Free
            </Link>
            <a
              href="#how-it-works"
              className="border-2 border-slate-300 hover:border-slate-400 text-slate-600 hover:text-slate-900 font-semibold px-10 py-5 rounded-2xl text-lg transition-colors"
            >
              See how it works ↓
            </a>
          </div>

          {/* Micro-copy */}
          <p className="text-center text-sm text-slate-400 mb-10">
            Free to start · No credit card · 3 minutes to go live
          </p>

          {/* Search bar */}
          <form action="/search" method="GET" className="max-w-xl mx-auto mb-16">
            <div className="flex gap-2 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-lg shadow-slate-200/60">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                <input
                  name="q"
                  placeholder="Search creators by name, niche, or location..."
                  className="w-full bg-transparent pl-9 pr-4 py-2.5 text-slate-700 placeholder-slate-400 focus:outline-none text-sm"
                />
              </div>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors shrink-0"
              >
                Search →
              </button>
            </div>
            <p className="text-center text-xs text-slate-400 mt-2">Find influencers · voice artists · presenters · AI twins available for licensing</p>
          </form>

          {/* Hero mockup — brand DM scenario */}
          <div className="max-w-md mx-auto">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl shadow-slate-300/60 text-left">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                  T
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Your Twin</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                    Handling your brand DMs · 100% your voice
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                  <p className="text-xs text-slate-400 mb-1 font-medium">Brand enquiry</p>
                  <p className="text-sm text-slate-700">Hi! We&apos;d love you for our new launch. What are your rates for a 3-post deal? 💼</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="font-medium">✦ Your Twin is responding</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                <div className="bg-indigo-600 rounded-2xl rounded-tr-sm px-4 py-3 ml-auto max-w-[85%]">
                  <p className="text-sm text-white">Thanks for reaching out 🙏 My 3-post rate starts at R15K. Send me the brief — if it aligns with my audience I&apos;d love to chat.</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                <div className="flex gap-3 text-xs text-slate-400 font-medium">
                  <span>🎙️ Your voice</span>
                  <span>💰 Your rate</span>
                  <span>✋ Your approval</span>
                </div>
                <span className="text-xs bg-green-50 text-green-600 border border-green-200 px-2.5 py-1 rounded-full font-medium">Sounds just like you</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ACTIVITY FEED ───────────────────────────────────── */}
      <ActivityFeed initialItems={feedItems} />

      {/* ── BUILT FOR SA CREATORS ───────────────────────────── */}
      <section className="py-16 px-6 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Every creator. Every niche.</p>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Built for SA&apos;s creators</h2>
          <p className="text-slate-500 mb-10">Whether you&apos;re at 5K or 5M — your digital Twin works for you 24/7.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {CREATOR_TYPES.map((c) => (
              <div
                key={c.label}
                className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 rounded-full px-5 py-2.5 transition-colors cursor-default"
              >
                <span className="text-lg">{c.icon}</span>
                <span className="text-sm font-semibold text-slate-700">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DISCOVER PROFILES ───────────────────────────────── */}
      {featured.length > 0 && (
        <section className="py-16 px-6 bg-slate-50 border-b border-slate-100">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Live on the platform</p>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900">SA Twins available for licensing</h2>
              </div>
              <Link href="/search" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors hidden sm:block">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map((f) => {
                const initials = f.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
                return (
                  <Link
                    key={f.id}
                    href={`/p/${f.slug}`}
                    className="bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-50 rounded-2xl p-5 flex items-start gap-4 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-100 to-violet-100 border border-slate-200 shrink-0 flex items-center justify-center">
                      {f.photoUrl ? (
                        <Image src={f.photoUrl} alt={f.name} width={48} height={48} className="object-cover w-full h-full" />
                      ) : (
                        <span className="text-base font-bold text-indigo-400">{initials}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{f.name}</p>
                      {f.profession && <p className="text-sm text-indigo-500 truncate">{f.profession}</p>}
                      {f.tone.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {f.tone.slice(0, 3).map((t: string) => (
                            <span key={t} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full capitalize">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="text-center mt-6 sm:hidden">
              <Link href="/search" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                View all profiles →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── STATS ───────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-slate-500 text-sm font-semibold uppercase tracking-widest mb-10">The creator economy reality</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-4xl md:text-5xl font-extrabold text-white mb-2">{s.value}</p>
                <p className="text-slate-400 text-sm leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEM → OPPORTUNITY ───────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4 block">The Problem</span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-5 leading-tight">
                Brands are already building AI versions of creators like you.
              </h2>
              <p className="text-slate-500 leading-relaxed mb-4">
                AI-generated influencers. AI voice clones. AI brand ambassadors.
                Companies are paying for digital likenesses — and creators are the last to know.
              </p>
              <p className="text-slate-500 leading-relaxed font-medium">
                Without your permission. Without paying you. Without you even finding out.
              </p>
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4 block">The Opportunity</span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-5 leading-tight">
                Own your digital self. Set the price. Collect the money.
              </h2>
              <p className="text-slate-500 leading-relaxed mb-4">
                OwnMyTwin is the first platform in SA built entirely around creators controlling their AI identity.
                You build it. You own it. You decide which brands get access — and at what price.
              </p>
              <p className="text-indigo-600 font-semibold leading-relaxed">
                When brands license your Twin, you keep 80% of every rand earned.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3 block">Simple. Powerful. Yours.</span>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">Three steps to owning your digital future</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">Takes 3 minutes to set up. Pays off forever.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.number} className="relative bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-full w-8 h-px bg-gradient-to-r from-slate-300 to-transparent z-10" />
                )}
                <div className="text-6xl font-extrabold text-slate-100 mb-4 leading-none">{step.number}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR BRANDS ──────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-4 block">For Brands &amp; Agencies</span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-5 leading-tight">
                The fastest way to work with SA&apos;s best creators.
              </h2>
              <p className="text-slate-500 leading-relaxed mb-4">
                Browse verified AI twins from South Africa&apos;s top creators. Every likeness is creator-owned,
                legally licensed, and ready to activate — no chasing agents, no NDAs from scratch.
              </p>
              <p className="text-slate-500 leading-relaxed mb-8">
                Find the right voice, face, or persona for your campaign in minutes. Submit a request,
                agree a price, and you&apos;re live.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/marketplace"
                  className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-7 py-3.5 rounded-2xl text-base transition-all shadow-lg shadow-violet-200 hover:shadow-violet-300"
                >
                  🏪 Browse Creators
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 border-2 border-slate-200 hover:border-violet-300 text-slate-600 hover:text-violet-700 font-semibold px-7 py-3.5 rounded-2xl text-base transition-colors"
                >
                  Create Buyer Account →
                </Link>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { icon: "🔍", title: "Browse by niche, tone, and usage", desc: "Filter by license type — voice, face, full likeness — and find exactly what your campaign needs." },
                { icon: "📝", title: "Request directly. No middleman.", desc: "Submit a license request in seconds. The OwnMyTwin team handles the rest." },
                { icon: "✅", title: "Legally licensed from day one", desc: "Every twin is creator-approved. You get a clear license, agreed pricing, and peace of mind." },
                { icon: "⚡", title: "Move fast without the risk", desc: "No more unlicensed likeness liability. SA's first verified digital identity marketplace." },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-5">
                  <span className="text-2xl shrink-0">{item.icon}</span>
                  <div>
                    <p className="font-bold text-slate-900 mb-1">{item.title}</p>
                    <p className="text-sm text-slate-500 leading-snug">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3 block">Everything you need</span>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              Your complete creator identity platform
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Built for today&apos;s creator economy. Designed for the future of digital identity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 rounded-3xl p-7 transition-all flex flex-col gap-4 group"
              >
                <div className="flex items-start justify-between">
                  <span className="text-4xl group-hover:scale-110 transition-transform">{f.icon}</span>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${TAG_COLORS[f.tagColor]}`}>
                    {f.tag}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OWNERSHIP PROOF ─────────────────────────────────── */}
      <section className="py-24 px-6 bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3 block">Built differently</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Your Twin. Your rules.
              <span className="text-indigo-400"> Full stop.</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Every other platform profits from your identity without asking. We built OwnMyTwin on the opposite principle.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PROOF_POINTS.map((item) => (
              <div key={item.title} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 flex items-start gap-4">
                <span className="text-2xl shrink-0">{item.icon}</span>
                <div>
                  <p className="font-bold text-white mb-1">{item.title}</p>
                  <p className="text-sm text-slate-400 leading-snug">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3 block">Pricing</span>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">Start free. Own forever.</h2>
            <p className="text-slate-500 text-lg">Your data ownership rights are guaranteed on every plan.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...PRICING].reverse().map((plan) => (
              <div
                key={plan.name}
                className={`rounded-3xl p-8 border relative ${
                  plan.highlight
                    ? "bg-indigo-600 border-indigo-600 shadow-2xl shadow-indigo-200 order-first md:order-none"
                    : "bg-white border-slate-200 shadow-sm"
                }`}
              >
                {plan.highlight && plan.badge && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md tracking-wide">
                    ★ {plan.badge}
                  </span>
                )}

                <h3 className={`text-2xl font-bold mb-1 ${plan.highlight ? "text-white" : "text-slate-900"}`}>{plan.name}</h3>
                <p className={`text-sm mb-6 ${plan.highlight ? "text-indigo-200" : "text-slate-500"}`}>{plan.description}</p>

                <div className="mb-6">
                  <span className={`text-5xl font-extrabold ${plan.highlight ? "text-white" : "text-slate-900"}`}>{plan.price}</span>
                  <span className={`ml-2 text-sm ${plan.highlight ? "text-indigo-200" : "text-slate-400"}`}>/{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-start gap-3 text-sm ${plan.highlight ? "text-indigo-100" : "text-slate-600"}`}>
                      <span className={`shrink-0 font-bold mt-0.5 ${plan.highlight ? "text-white" : "text-indigo-600"}`}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`block w-full text-center font-bold py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    plan.highlight
                      ? "bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Cancel anytime · No hidden fees · Full data export always available
          </p>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────── */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-4 py-2 rounded-full mb-8 tracking-wide">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            SA&apos;s first creators are building their Twins right now
          </div>

          <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-4 leading-tight">
            The DMs won&apos;t stop.
          </h2>
          <h2 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
            The brand deals won&apos;t wait.
          </h2>
          <h2 className="text-4xl md:text-6xl font-extrabold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Your Twin is ready.
            </span>
          </h2>

          <p className="text-slate-500 text-xl mb-10 max-w-xl mx-auto leading-relaxed">
            Be the creator that other creators follow.
            Free to start. Yours to keep. Forever.
          </p>

          <Link
            href="/login"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-16 py-5 rounded-2xl text-xl transition-all shadow-2xl shadow-indigo-300 hover:shadow-indigo-400 hover:scale-[1.02] active:scale-[0.98] mb-4"
          >
            Claim My Twin — It&apos;s Free
          </Link>

          <p className="text-sm text-slate-400">
            No credit card · 3 minutes to go live · You own everything from day one
          </p>
        </div>
      </section>

      {/* ── POPIA COMPLIANCE ────────────────────────────────── */}
      <section className="py-12 px-6 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start gap-5">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl shrink-0">🛡️</div>
            <div className="flex-1">
              <p className="font-bold text-slate-900 mb-1">POPIA Compliant — We protect your personal information</p>
              <p className="text-sm text-slate-500 leading-relaxed">
                OwnMyTwin complies fully with the Protection of Personal Information Act (POPIA), No. 4 of 2013 (South Africa).
                Your personal data is collected and processed only for the purposes you consent to — operating your AI Twin and facilitating approved licensing deals.
                Your data is never sold, shared without consent, or used to train models for others.
                You may access, correct, or delete your information at any time.
                For data privacy enquiries, contact{" "}
                <a href="mailto:privacy@ownmytwin.com" className="text-indigo-600 hover:underline">privacy@ownmytwin.com</a>.
              </p>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                POPIA Compliant
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 py-12 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <Image src="/ownmytwin-logo.png" alt="OwnMyTwin" width={140} height={47} className="object-contain mb-1.5" />
            <p className="text-xs text-slate-400">South Africa&apos;s first AI identity platform for creators.</p>
          </div>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} OwnMyTwin. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Privacy</Link>
            <Link href="/terms"   className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Terms</Link>
            <Link href="/contact" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
