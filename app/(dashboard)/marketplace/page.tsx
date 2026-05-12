"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

interface License {
  id:        string;
  price:     number;
  approval:  "manual" | "auto";
  territory: "local" | "national" | "global";
}

interface Listing {
  id:                 string;
  name:               string;
  profession:         string | null;
  location:           string | null;
  tone:               string[];
  values:             string[];
  photoUrl:           string | null;
  licenses:           License[];
  startingPrice:      number | null;
  slug:               string | null;
  avgRating:          number | null;
  reviewCount:        number;
  verificationStatus: string;
}

function StarDisplay({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-amber-400 text-sm">{"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}</span>
      <span className="text-xs text-slate-500">{rating.toFixed(1)} ({count})</span>
    </div>
  );
}

const LICENSE_LABELS: Record<string, { label: string; icon: string }> = {
  voice_only:        { label: "Voice Only",        icon: "🎤" },
  voiceover:         { label: "Voiceover",          icon: "🎙️" },
  public_speaking:   { label: "Public Speaking",    icon: "📢" },
  face_avatar:       { label: "Face / Avatar",      icon: "🪞" },
  full_likeness:     { label: "Full Likeness",      icon: "👤" },
  social_media:      { label: "Social Media",       icon: "📱" },
  ads:               { label: "Advertising",        icon: "📺" },
  ai_presenter:      { label: "AI Presenter",       icon: "🎬" },
  virtual_influencer:{ label: "Virtual Influencer", icon: "⭐" },
  educational:       { label: "Educational",        icon: "📚" },
  corporate_training:{ label: "Corporate Training", icon: "🏢" },
  customer_service:  { label: "Customer Service",   icon: "🤝" },
  film_tv:           { label: "Film / TV",          icon: "🎥" },
  game_npc:          { label: "Game NPC",           icon: "🎮" },
  motion_style:      { label: "Motion Style",       icon: "🕺" },
};

const USAGE_OPTIONS = [
  { value: "",                 label: "All usage types"   },
  { value: "voice_only",       label: "🎤 Voice Only"     },
  { value: "voiceover",        label: "🎙️ Voiceover"      },
  { value: "public_speaking",  label: "📢 Public Speaking" },
  { value: "face_avatar",      label: "🪞 Face / Avatar"  },
  { value: "full_likeness",    label: "👤 Full Likeness"  },
  { value: "social_media",     label: "📱 Social Media"   },
  { value: "ads",              label: "📺 Advertising"    },
  { value: "ai_presenter",     label: "🎬 AI Presenter"   },
  { value: "educational",      label: "📚 Educational"    },
  { value: "corporate_training",label:"🏢 Corporate Training"},
  { value: "film_tv",          label: "🎥 Film / TV"      },
  { value: "game_npc",         label: "🎮 Game NPC"       },
];

const PRICE_OPTIONS = [
  { value: "",     label: "Any price"     },
  { value: "100",  label: "Under $100"    },
  { value: "500",  label: "Under $500"    },
  { value: "1000", label: "Under $1,000"  },
  { value: "5000", label: "Under $5,000"  },
];

function TwinCard({ listing }: { listing: Listing }) {
  const visibleLicenses = listing.licenses.slice(0, 3);
  const extraCount      = listing.licenses.length - 3;
  const isVerified      = listing.verificationStatus === "verified";

  const initials = listing.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const profileUrl = listing.slug ? `/p/${listing.slug}` : null;

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col gap-4 transition-all group">

      {/* Top: photo + identity */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-600/30 to-violet-600/30 border border-slate-700 shrink-0 flex items-center justify-center">
          {listing.photoUrl ? (
            <Image
              src={listing.photoUrl}
              alt={listing.name}
              width={64}
              height={64}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-xl font-bold text-indigo-300">{initials}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-white text-base leading-tight truncate">{listing.name}</h3>
            {isVerified && (
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold bg-green-900/40 text-green-400 border border-green-800/50 px-1.5 py-0.5 rounded-full shrink-0">
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                  <path fillRule="evenodd" d="M6 1a5 5 0 100 10A5 5 0 006 1zm2.78 3.97a.75.75 0 00-1.06-1.06L5.25 6.44 4.28 5.47a.75.75 0 00-1.06 1.06l1.5 1.5a.75.75 0 001.06 0l3-3z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            )}
          </div>
          {listing.profession && (
            <p className="text-sm text-indigo-400 mt-0.5 truncate">{listing.profession}</p>
          )}
          {listing.location && (
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <span>📍</span> {listing.location}
            </p>
          )}
          {listing.avgRating !== null && (
            <div className="mt-1">
              <StarDisplay rating={listing.avgRating} count={listing.reviewCount} />
            </div>
          )}
        </div>
      </div>

      {/* Tone tags */}
      {listing.tone.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {listing.tone.slice(0, 4).map((t) => (
            <span key={t} className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-2.5 py-1 rounded-full capitalize">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* License badges */}
      <div className="flex flex-wrap gap-1.5">
        {visibleLicenses.map((lic) => {
          const meta = LICENSE_LABELS[lic.id];
          return (
            <span
              key={lic.id}
              className="text-xs bg-indigo-900/30 border border-indigo-800/50 text-indigo-300 px-2.5 py-1 rounded-full flex items-center gap-1"
            >
              {meta?.icon} {meta?.label ?? lic.id}
            </span>
          );
        })}
        {extraCount > 0 && (
          <span className="text-xs bg-slate-800 border border-slate-700 text-slate-500 px-2.5 py-1 rounded-full">
            +{extraCount} more
          </span>
        )}
      </div>

      {/* Footer: price + CTA */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800 mt-auto">
        <div>
          {listing.startingPrice !== null && listing.startingPrice > 0 ? (
            <>
              <p className="text-xs text-slate-500">Starting from</p>
              <p className="text-lg font-bold text-white">${listing.startingPrice.toLocaleString()}</p>
            </>
          ) : (
            <p className="text-sm text-slate-500 italic">Contact for pricing</p>
          )}
        </div>

        {profileUrl ? (
          <Link
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors touch-manipulation"
          >
            View &amp; Request →
          </Link>
        ) : (
          <span className="text-xs text-slate-600 italic">No public profile</span>
        )}
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const [listings,      setListings]      = useState<Listing[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [usage,         setUsage]         = useState("");
  const [location,      setLocation]      = useState("");
  const [maxPrice,      setMaxPrice]      = useState("");
  const [search,        setSearch]        = useState("");
  const [verifiedOnly,  setVerifiedOnly]  = useState(false);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (usage)        params.set("usage",    usage);
    if (location)     params.set("location", location);
    if (maxPrice)     params.set("maxPrice", maxPrice);
    if (verifiedOnly) params.set("verified", "1");

    const res  = await fetch(`/api/marketplace?${params}`);
    const data = await res.json();
    setListings(data.listings ?? []);
    setLoading(false);
  }, [usage, location, maxPrice]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const displayed = search.trim()
    ? listings.filter(
        (l) =>
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          l.profession?.toLowerCase().includes(search.toLowerCase()) ||
          l.location?.toLowerCase().includes(search.toLowerCase()),
      )
    : listings;

  const hasFilters = !!usage || !!location || !!maxPrice || !!search || verifiedOnly;

  function clearFilters() {
    setUsage("");
    setLocation("");
    setMaxPrice("");
    setSearch("");
    setVerifiedOnly(false);
  }

  return (
    <div className="max-w-6xl space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Marketplace</h1>
        <p className="text-slate-400 text-sm">
          Browse verified AI twins available for licensing. Request access to use a twin for your project.
        </p>
      </div>

      {/* Filter bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, profession..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
            />
          </div>

          {/* Usage type */}
          <select
            value={usage}
            onChange={(e) => setUsage(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 appearance-none"
          >
            {USAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Location */}
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="📍 Filter by location..."
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
          />

          {/* Max price */}
          <select
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 appearance-none"
          >
            {PRICE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
          <button
            onClick={() => setVerifiedOnly((v) => !v)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
              verifiedOnly
                ? "bg-green-900/40 text-green-400 border-green-800/50"
                : "bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300"
            }`}
          >
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
              <path fillRule="evenodd" d="M6 1a5 5 0 100 10A5 5 0 006 1zm2.78 3.97a.75.75 0 00-1.06-1.06L5.25 6.44 4.28 5.47a.75.75 0 00-1.06 1.06l1.5 1.5a.75.75 0 001.06 0l3-3z" clipRule="evenodd" />
            </svg>
            Verified only
          </button>

          {hasFilters && (
            <div className="flex items-center gap-4 ml-auto">
              <p className="text-xs text-slate-500">
                {displayed.length} {displayed.length === 1 ? "twin" : "twins"} found
              </p>
              <button
                onClick={clearFilters}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear all ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 animate-pulse h-64" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && displayed.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <p className="text-5xl mb-4">🏪</p>
          {hasFilters ? (
            <>
              <p className="font-medium text-slate-400">No twins match your filters</p>
              <p className="text-sm mt-1">Try adjusting your search or clearing the filters.</p>
              <button
                onClick={clearFilters}
                className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
              >
                Clear all filters
              </button>
            </>
          ) : (
            <>
              <p className="font-medium text-slate-400">No twins listed yet</p>
              <p className="text-sm mt-1 max-w-xs mx-auto">
                Twins appear here once they&apos;ve enabled at least one license on their Licensing page.
              </p>
            </>
          )}
        </div>
      )}

      {/* Grid */}
      {!loading && displayed.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map((listing) => (
              <TwinCard key={listing.id} listing={listing} />
            ))}
          </div>

          {!hasFilters && (
            <p className="text-xs text-slate-700 text-center">
              {displayed.length} {displayed.length === 1 ? "twin" : "twins"} available for licensing
            </p>
          )}
        </>
      )}
    </div>
  );
}
