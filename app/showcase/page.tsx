"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";

interface Post {
  id:            string;
  title:         string;
  description:   string;
  mediaType:     string;
  mediaUrl:      string | null;
  isAiGenerated: boolean;
  isGuidedPost:  boolean;
  createdAt:     string;
  buyer:         { name: string | null; image: string | null };
  twin: {
    id:   string;
    name: string | null;
    user: { publicSlug: string | null; verificationStatus: string };
  };
  _count: { comments: number; likes: number };
}

interface CurrentUser {
  id:    string;
  name:  string | null;
  image: string | null;
}

function embedThumbnail(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?\s]+)/);
  if (yt) return `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg`;
  return null;
}

function PostCard({ post }: { post: Post }) {
  const router = useRouter();
  const isVerified = post.twin.user.verificationStatus === "verified";
  const thumb      = post.mediaType === "image" ? post.mediaUrl : post.mediaType === "embed" && post.mediaUrl ? embedThumbnail(post.mediaUrl) : null;

  function handleCreatorClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/showcase?twinId=${post.twin.id}`);
  }

  return (
    <Link
      href={`/showcase/${post.id}`}
      className="bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-2xl overflow-hidden flex flex-col group transition-all"
    >
      {/* Media preview */}
      {thumb ? (
        <div className="relative w-full aspect-video bg-slate-800 overflow-hidden">
          <Image src={thumb} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
          {post.mediaType === "embed" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <svg className="w-5 h-5 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
        </div>
      ) : post.mediaType === "embed" && post.mediaUrl ? (
        <div className="w-full aspect-video bg-slate-800 flex items-center justify-center">
          <span className="text-4xl">🔗</span>
        </div>
      ) : post.isGuidedPost ? (
        <div className="relative w-full aspect-video bg-gradient-to-br from-indigo-900/40 to-violet-900/40 overflow-hidden flex items-center justify-center">
          {post.buyer.image ? (
            <button onClick={handleCreatorClick} className="focus:outline-none">
              <Image
                src={post.buyer.image}
                alt={post.buyer.name ?? "Creator"}
                width={96}
                height={96}
                className="w-24 h-24 rounded-full object-cover border-4 border-indigo-700/50 shadow-lg group-hover:scale-105 transition-transform duration-500"
              />
            </button>
          ) : (
            <div className="w-24 h-24 rounded-full bg-indigo-900/60 border-4 border-indigo-700/50 flex items-center justify-center text-4xl shadow-lg">
              {post.buyer.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <span className="text-xs text-indigo-300 font-medium">{post.buyer.name ?? "Creator"}</span>
          </div>
        </div>
      ) : null}

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Post type badge */}
        {post.isGuidedPost && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-300 bg-indigo-900/40 border border-indigo-700/50 px-2 py-0.5 rounded-full w-fit">
            ✍️ From their day
          </span>
        )}
        {post.isAiGenerated && !post.isGuidedPost && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-300 bg-violet-900/40 border border-violet-700/50 px-2 py-0.5 rounded-full w-fit">
            ✨ AI Sample
          </span>
        )}

        {/* Title */}
        <h3 className="font-bold text-white leading-snug group-hover:text-indigo-300 transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed flex-1">{post.description}</p>

        {/* Twin info */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
          <div className="w-6 h-6 rounded-full bg-indigo-900/40 border border-indigo-700/50 flex items-center justify-center text-xs shrink-0">🤖</div>
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <button
              onClick={handleCreatorClick}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 truncate transition-colors text-left"
            >
              {post.twin.name ?? "AI Twin"}
            </button>
            {isVerified && (
              <svg className="w-3 h-3 text-green-400 shrink-0" viewBox="0 0 12 12" fill="currentColor">
                <path fillRule="evenodd" d="M6 1a5 5 0 100 10A5 5 0 006 1zm2.78 3.97a.75.75 0 00-1.06-1.06L5.25 6.44 4.28 5.47a.75.75 0 00-1.06 1.06l1.5 1.5a.75.75 0 001.06 0l3-3z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
            <span>💬 {post._count.comments}</span>
            <span>❤️ {post._count.likes}</span>
          </div>
        </div>

        {/* Buyer + date */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {post.isGuidedPost ? (post.twin.name ?? "Creator") : post.isAiGenerated ? "AI generated" : (post.buyer.name ?? "Anonymous")}
          </span>
          <span>{new Date(post.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
        </div>
      </div>
    </Link>
  );
}

function ShowcaseContent() {
  const searchParams   = useSearchParams();
  const router         = useRouter();
  const activeTwinId   = searchParams.get("twinId");

  const [posts,          setPosts]          = useState<Post[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [nextCursor,     setNextCursor]     = useState<string | null>(null);
  const [loadingMore,    setLoadingMore]    = useState(false);
  const [currentUser,    setCurrentUser]    = useState<CurrentUser | null>(null);
  const [activeTwinName,   setActiveTwinName]   = useState<string | null>(null);
  const [activeTwinAvatar, setActiveTwinAvatar] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(async (cursor?: string, twinId?: string | null) => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (twinId) params.set("twinId", twinId);
    const res  = await fetch(`/api/showcase?${params}`);
    const data = await res.json();
    return { posts: data.posts ?? [], nextCursor: data.nextCursor ?? null };
  }, []);

  useEffect(() => {
    setLoading(true);
    setPosts([]);
    setNextCursor(null);
    Promise.all([
      fetchPosts(undefined, activeTwinId),
      fetch("/api/user").then((r) => r.ok ? r.json() : null),
    ]).then(([{ posts: fetched, nextCursor: nc }, meData]) => {
      setPosts(fetched);
      setNextCursor(nc);
      setCurrentUser(meData?.user ? { id: meData.user.id, name: meData.user.name, image: meData.user.image } : null);
      if (activeTwinId && fetched.length > 0) {
        const first = fetched[0] as Post;
        setActiveTwinName(first.twin.name);
        setActiveTwinAvatar(first.buyer.image);
      } else {
        setActiveTwinName(null);
        setActiveTwinAvatar(null);
      }
      setLoading(false);
    });
  }, [fetchPosts, activeTwinId]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const { posts: more, nextCursor: next } = await fetchPosts(nextCursor, activeTwinId);
    setPosts((prev) => [...prev, ...more]);
    setNextCursor(next);
    setLoadingMore(false);
  }

  return (
    <div
      className="min-h-screen text-white"
      style={{
        backgroundImage: `linear-gradient(rgba(2,6,23,0.72),rgba(2,6,23,0.72)),url('/dashboard-background.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-10 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-white rounded-lg px-2 py-1">
              <Image src="/ownmytwin-logo.png" alt="OwnMyTwin" width={100} height={34} className="object-contain h-7 w-auto" />
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/marketplace" className="text-xs text-slate-400 hover:text-white transition-colors hidden sm:block font-medium">
              Marketplace
            </Link>
            {currentUser ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-xl transition-colors"
              >
                <div className="w-6 h-6 rounded-full overflow-hidden bg-indigo-900/40 border border-indigo-700/50 flex items-center justify-center shrink-0">
                  {currentUser.image ? (
                    <Image src={currentUser.image} alt="avatar" width={24} height={24} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-xs font-bold text-indigo-400">
                      {currentUser.name?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-300 hidden sm:block">Dashboard</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 pt-20 pb-16">

        {/* Header — full or filtered */}
        {activeTwinId ? (
          <div className="py-10 mb-4">
            <div className="flex items-center gap-4">
              {activeTwinAvatar ? (
                <Image
                  src={activeTwinAvatar}
                  alt={activeTwinName ?? "Creator"}
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-full object-cover border-2 border-indigo-700/50 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-indigo-900/40 border-2 border-indigo-700/50 flex items-center justify-center text-2xl shrink-0">
                  🤖
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-0.5">Filtering by creator</p>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight truncate">
                  Posts by {activeTwinName ?? "this creator"}
                </h1>
              </div>
              <button
                onClick={() => router.push("/showcase")}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 rounded-xl transition-colors shrink-0"
              >
                <span>✕</span>
                <span className="hidden sm:inline">View all</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 mb-4">
            <div className="inline-flex items-center gap-2 bg-indigo-900/40 border border-indigo-700/50 text-indigo-300 text-xs font-semibold px-4 py-2 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
              Community Showcase
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
              Work made with AI Twins
            </h1>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Real campaigns, content, and projects created by brands using licensed twins from OwnMyTwin.
            </p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden animate-pulse">
                <div className="w-full aspect-video bg-slate-800" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-800 rounded w-full" />
                  <div className="h-3 bg-slate-800 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && posts.length === 0 && (
          <div className="text-center py-24 text-slate-500">
            <p className="text-5xl mb-4">🎬</p>
            {activeTwinId ? (
              <>
                <p className="font-medium text-slate-400">No posts from this creator yet</p>
                <button
                  onClick={() => router.push("/showcase")}
                  className="inline-flex items-center gap-2 mt-6 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold px-5 py-3 rounded-xl transition-colors border border-slate-700"
                >
                  ← View all posts
                </button>
              </>
            ) : (
              <>
                <p className="font-medium text-slate-400">No showcase posts yet</p>
                <p className="text-sm mt-1">Be the first to share your work.</p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 mt-6 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors"
                >
                  Get started →
                </Link>
              </>
            )}
          </div>
        )}

        {/* Grid */}
        {!loading && posts.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map((post) => <PostCard key={post.id} post={post} />)}
            </div>

            {nextCursor && (
              <div ref={bottomRef} className="flex justify-center mt-10">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 hover:border-slate-600 text-slate-300 font-semibold px-8 py-3 rounded-xl text-sm transition-colors"
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ShowcasePage() {
  return (
    <Suspense>
      <ShowcaseContent />
    </Suspense>
  );
}
