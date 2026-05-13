import { db } from "@/lib/db";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { RequestForm } from "./request-form";

const LICENSE_META: Record<string, { label: string; icon: string }> = {
  voice_only:         { label: "Voice Only",         icon: "🎤" },
  voiceover:          { label: "Voiceover",           icon: "🎙️" },
  public_speaking:    { label: "Public Speaking",     icon: "📢" },
  face_avatar:        { label: "Face / Avatar",       icon: "🪞" },
  full_likeness:      { label: "Full Likeness",       icon: "👤" },
  social_media:       { label: "Social Media",        icon: "📱" },
  ads:                { label: "Advertising",         icon: "📺" },
  ai_presenter:       { label: "AI Presenter",        icon: "🎬" },
  virtual_influencer: { label: "Virtual Influencer",  icon: "⭐" },
  educational:        { label: "Educational",         icon: "📚" },
  corporate_training: { label: "Corporate Training",  icon: "🏢" },
  customer_service:   { label: "Customer Service",    icon: "🤝" },
  film_tv:            { label: "Film / TV",           icon: "🎥" },
  game_npc:           { label: "Game NPC",            icon: "🎮" },
  motion_style:       { label: "Motion Style",        icon: "🕺" },
};

type LicenseSetting = {
  enabled:   boolean;
  price:     number;
  approval:  string;
  territory: string;
};

type PersonalityData = {
  tone?:       string[];
  values?:     string[];
  profession?: string;
  location?:   string;
  humor?:      string;
};

async function getProfile(slug: string) {
  return db.user.findUnique({
    where: { publicSlug: slug },
    select: {
      verificationStatus: true,
      photos: {
        orderBy: { createdAt: "asc" },
        take:    1,
        select:  { url: true },
      },
      twin: {
        select: {
          id:                 true,
          name:               true,
          bio:                true,
          personality:        true,
          licensePermissions: true,
          reviews: {
            orderBy: { createdAt: "desc" },
            take:    10,
            select: {
              id:        true,
              rating:    true,
              comment:   true,
              createdAt: true,
              buyer:     { select: { name: true } },
            },
          },
        },
      },
    },
  });
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const user = await getProfile(slug);
  if (!user?.twin) return { title: "OwnMyTwin" };

  const twin        = user.twin;
  const personality = twin.personality as PersonalityData | null;
  const name        = twin.name ?? "AI Twin";
  const title       = `${name} — AI Twin`;
  const description = twin.bio
    ?? `${personality?.profession ? `${personality.profession} · ` : ""}License ${name}'s AI twin on OwnMyTwin`;
  const photoUrl    = user.photos[0]?.url ?? null;

  const images = photoUrl
    ? [{ url: photoUrl, width: 400, height: 400, alt: name }]
    : [{ url: "/ownmytwin-logo.png", width: 1200, height: 630, alt: "OwnMyTwin" }];

  return {
    title,
    description,
    openGraph: {
      type:        "profile",
      title,
      description,
      siteName:    "OwnMyTwin",
      images,
    },
    twitter: {
      card:        photoUrl ? "summary" : "summary_large_image",
      title,
      description,
      images:      images.map((i) => i.url),
    },
  };
}

export default async function PublicProfilePage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const [user, session] = await Promise.all([getProfile(slug), auth()]);

  if (!user?.twin) notFound();

  // Determine the CTA based on whether the visitor is logged in and their role
  let navCta: { href: string; label: string } = { href: "/login", label: "Create Your Twin →" };
  if (session?.user?.id) {
    const visitor = await db.user.findUnique({
      where:  { id: session.user.id },
      select: { accountType: true },
    });
    if (visitor?.accountType === "buyer") {
      navCta = { href: "/marketplace", label: "Browse Marketplace →" };
    } else {
      navCta = { href: "/dashboard", label: "My Dashboard →" };
    }
  }

  const twin        = user.twin;
  const personality = twin.personality as PersonalityData | null;
  const perms       = (twin.licensePermissions ?? {}) as Record<string, LicenseSetting>;
  const photoUrl    = user.photos[0]?.url ?? null;
  const isVerified  = user.verificationStatus === "verified";
  const reviews     = twin.reviews ?? [];
  const reviewCount = reviews.length;
  const avgRating   = reviewCount > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10
    : null;

  const enabledLicenses = Object.entries(perms)
    .filter(([, v]) => v.enabled)
    .map(([k, v]) => ({ id: k, price: v.price, approval: v.approval, territory: v.territory }));

  const toneTags  = (personality?.tone  ?? []).slice(0, 6);
  const valueTags = (personality?.values ?? []).slice(0, 6);

  const initials = (twin.name ?? "T")
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Top nav */}
      <nav className="fixed top-0 inset-x-0 z-10 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-black">O</div>
            <span className="text-sm font-bold text-white hidden sm:block">OwnMyTwin</span>
          </Link>
          <Link
            href={navCta.href}
            className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-colors"
          >
            {navCta.label}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative pt-14 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/60 via-slate-950 to-slate-950 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 pt-14 pb-10 text-center">

          {/* Photo */}
          <div className="flex justify-center mb-6">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-600/30 to-violet-600/30 border-2 border-slate-700 shadow-xl shadow-indigo-950/50">
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt={twin.name ?? "Profile"}
                  width={144}
                  height={144}
                  className="object-cover w-full h-full"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-black text-indigo-300">
                  {initials}
                </div>
              )}
            </div>
          </div>

          {/* Identity */}
          <div className="flex items-center justify-center gap-3 mb-2 flex-wrap">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {twin.name ?? "AI Twin"}
            </h1>
            {isVerified && (
              <span className="inline-flex items-center gap-1 text-sm font-semibold bg-green-900/40 text-green-400 border border-green-800/50 px-2.5 py-1 rounded-full">
                <svg className="w-4 h-4" viewBox="0 0 12 12" fill="currentColor">
                  <path fillRule="evenodd" d="M6 1a5 5 0 100 10A5 5 0 006 1zm2.78 3.97a.75.75 0 00-1.06-1.06L5.25 6.44 4.28 5.47a.75.75 0 00-1.06 1.06l1.5 1.5a.75.75 0 001.06 0l3-3z" clipRule="evenodd" />
                </svg>
                Verified Identity
              </span>
            )}
          </div>

          {(personality?.profession || personality?.location) && (
            <p className="text-slate-400 text-base mb-6 flex items-center justify-center flex-wrap gap-x-3 gap-y-1">
              {personality.profession && <span>{personality.profession}</span>}
              {personality.profession && personality.location && (
                <span className="text-slate-700">·</span>
              )}
              {personality.location && (
                <span className="flex items-center gap-1">
                  <span>📍</span> {personality.location}
                </span>
              )}
            </p>
          )}

          {/* Bio */}
          {twin.bio && (
            <p className="max-w-xl mx-auto text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
              {twin.bio}
            </p>
          )}

          {/* Rating summary */}
          {avgRating !== null && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-amber-400 text-lg">{"★".repeat(Math.round(avgRating))}{"☆".repeat(5 - Math.round(avgRating))}</span>
              <span className="text-white font-bold">{avgRating.toFixed(1)}</span>
              <span className="text-slate-500 text-sm">({reviewCount} {reviewCount === 1 ? "review" : "reviews"})</span>
            </div>
          )}

          {/* Tone tags */}
          {toneTags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-2">
              {toneTags.map((t) => (
                <span
                  key={t}
                  className="text-xs bg-indigo-900/40 border border-indigo-800/50 text-indigo-300 px-3 py-1.5 rounded-full capitalize"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Value tags */}
          {valueTags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {valueTags.map((v) => (
                <span
                  key={v}
                  className="text-xs bg-violet-900/30 border border-violet-800/40 text-violet-300 px-3 py-1.5 rounded-full capitalize"
                >
                  {v}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Licensing section */}
      <div className="max-w-4xl mx-auto px-4 pb-16 space-y-8">

        {enabledLicenses.length > 0 ? (
          <>
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 text-center">
                Available for Licensing
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {enabledLicenses.map((lic) => {
                  const meta = LICENSE_META[lic.id];
                  return (
                    <div
                      key={lic.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center hover:border-slate-700 transition-colors"
                    >
                      <div className="text-2xl mb-2">{meta?.icon ?? "📄"}</div>
                      <p className="text-xs font-medium text-slate-200 leading-snug mb-1">
                        {meta?.label ?? lic.id}
                      </p>
                      {lic.price > 0 ? (
                        <p className="text-sm font-bold text-white">${lic.price.toLocaleString()}</p>
                      ) : (
                        <p className="text-xs text-slate-500 italic">Contact for pricing</p>
                      )}
                      {lic.territory && lic.territory !== "global" && (
                        <p className="text-xs text-slate-600 mt-1 capitalize">{lic.territory}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-center">
              <RequestForm
                twinId={twin.id}
                twinName={twin.name ?? "This Twin"}
                enabledLicenses={enabledLicenses}
              />
              <p className="text-xs text-slate-600 mt-3">
                The OwnMyTwin team reviews every request and will be in touch shortly.
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-slate-600">
            <p className="text-4xl mb-3">🔒</p>
            <p className="font-medium text-slate-500">No licenses listed yet</p>
          </div>
        )}
      </div>

      {/* Reviews section */}
      {reviews.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 pb-16">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 text-center">
            Reviews
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-amber-400">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                  <span className="text-xs text-slate-600">
                    {new Date(review.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-slate-300 leading-relaxed">{review.comment}</p>
                )}
                <p className="text-xs text-slate-600 mt-3">{review.buyer.name ?? "Verified buyer"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-8 text-center">
        <Link href="/" className="inline-flex flex-col items-center gap-2 group">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-xs font-black">O</div>
            <span className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors">OwnMyTwin</span>
          </div>
          <p className="text-xs text-slate-700 group-hover:text-slate-500 transition-colors">
            Own yourself. License your future.
          </p>
        </Link>
      </footer>
    </div>
  );
}
