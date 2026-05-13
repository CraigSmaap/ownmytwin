"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface Profile {
  id:           string;
  name:         string;
  bio:          string | null;
  profession:   string | null;
  location:     string | null;
  tone:         string[];
  photoUrl:     string | null;
  slug:         string;
  licenseCount: number;
  startingPrice: number | null;
}

function ProfileCard({ p }: { p: Profile }) {
  const initials = p.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <Link
      href={`/p/${p.slug}`}
      className="bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-50 rounded-2xl p-5 flex flex-col gap-3 transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-100 to-violet-100 border border-slate-200 shrink-0 flex items-center justify-center">
          {p.photoUrl ? (
            <Image src={p.photoUrl} alt={p.name} width={56} height={56} className="object-cover w-full h-full" />
          ) : (
            <span className="text-lg font-bold text-indigo-400">{initials}</span>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{p.name}</h3>
          {p.profession && <p className="text-sm text-indigo-500 truncate">{p.profession}</p>}
          {p.location   && <p className="text-xs text-slate-400 flex items-center gap-1">📍 {p.location}</p>}
        </div>
      </div>

      {p.bio && (
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{p.bio}</p>
      )}

      {p.tone.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {p.tone.slice(0, 3).map((t) => (
            <span key={t} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full capitalize">{t}</span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-400">
          {p.licenseCount} license{p.licenseCount !== 1 ? "s" : ""} available
        </span>
        {p.startingPrice ? (
          <span className="text-xs font-semibold text-slate-700">from ${p.startingPrice.toLocaleString()}</span>
        ) : (
          <span className="text-xs text-slate-400">Contact for pricing</span>
        )}
      </div>
    </Link>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const initialQ     = searchParams.get("q") ?? "";

  const [query,    setQuery]    = useState(initialQ);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [total,    setTotal]    = useState(0);

  const fetchProfiles = useCallback(async (q: string) => {
    setLoading(true);
    const res  = await fetch(`/api/public/search?q=${encodeURIComponent(q)}&limit=48`);
    const data = await res.json();
    setProfiles(data.profiles ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProfiles(initialQ); }, [fetchProfiles, initialQ]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.replace(q ? `/search?q=${encodeURIComponent(q)}` : "/search", { scroll: false });
    fetchProfiles(q);
  }

  return (
    <div className="relative min-h-screen">
      <Image src="/background2.png" alt="" fill className="object-cover object-center" priority />
      <div className="absolute inset-0 bg-white/50" />
      <div className="relative z-10">

      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" className="shrink-0">
            <Image src="/ownmytwin-logo.png" alt="OwnMyTwin" width={120} height={40} className="object-contain" />
          </Link>
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, profession, location..."
                className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white text-sm transition-colors"
              />
            </div>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0"
            >
              Search
            </button>
          </form>
          <Link
            href="/login"
            className="shrink-0 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors hidden sm:block"
          >
            Sign up free →
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Heading */}
        <div className="mb-6">
          {initialQ ? (
            <h1 className="text-xl font-bold text-slate-900">
              Results for &ldquo;{initialQ}&rdquo;
              <span className="ml-2 text-sm font-normal text-slate-400">{total} found</span>
            </h1>
          ) : (
            <>
              <h1 className="text-xl font-bold text-slate-900 mb-1">Discover AI Twins</h1>
              <p className="text-sm text-slate-500">Browse creators, professionals, and talent who have built their digital identity.</p>
            </>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse h-44" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && profiles.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-slate-500 font-medium">
              {initialQ ? `No profiles found for "${initialQ}"` : "No profiles available yet"}
            </p>
            <p className="text-slate-400 text-sm mt-1">
              {initialQ ? "Try a different name, profession, or location." : "Be the first to build your AI Twin."}
            </p>
            <Link href="/login" className="inline-block mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
              Build My Twin — Free
            </Link>
          </div>
        )}

        {/* Grid */}
        {!loading && profiles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((p) => <ProfileCard key={p.id} p={p} />)}
          </div>
        )}

        {/* CTA */}
        {!loading && (
          <div className="mt-12 text-center bg-indigo-50 border border-indigo-100 rounded-2xl p-8">
            <p className="text-lg font-bold text-slate-900 mb-2">Want your profile here?</p>
            <p className="text-slate-500 text-sm mb-5">Build your AI Twin and enable your public profile to appear in search.</p>
            <Link href="/login" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-xl transition-colors">
              Build My Twin — Free
            </Link>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
