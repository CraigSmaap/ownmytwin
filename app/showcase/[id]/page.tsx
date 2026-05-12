"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Comment {
  id:        string;
  content:   string;
  createdAt: string;
  author:    { id: string; name: string | null };
}

interface Post {
  id:            string;
  title:         string;
  description:   string;
  mediaType:     string;
  mediaUrl:      string | null;
  isAiGenerated: boolean;
  isGuidedPost:  boolean;
  createdAt:     string;
  buyer:         { id: string; name: string | null; image: string | null };
  twin: {
    id:   string;
    name: string | null;
    bio:  string | null;
    user: { publicSlug: string | null; verificationStatus: string };
  };
  _count: { comments: number; likes: number };
}

interface RelatedPost {
  id:            string;
  title:         string;
  description:   string;
  isGuidedPost:  boolean;
  isAiGenerated: boolean;
  buyer:         { name: string | null; image: string | null };
  _count:        { likes: number; comments: number };
}

function getEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?\s]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vi = url.match(/vimeo\.com\/(\d+)/);
  if (vi) return `https://player.vimeo.com/video/${vi[1]}`;
  return null;
}

export default function ShowcasePostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }     = use(params);
  const router     = useRouter();

  const [post,        setPost]        = useState<Post | null>(null);
  const [comments,    setComments]    = useState<Comment[]>([]);
  const [likeCount,   setLikeCount]   = useState(0);
  const [liked,       setLiked]       = useState(false);
  const [liking,      setLiking]      = useState(false);
  const [newComment,  setNewComment]  = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string | null; image: string | null } | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [notFound,    setNotFound]    = useState(false);
  const [morePosts,   setMorePosts]   = useState<RelatedPost[]>([]);

  const load = useCallback(async () => {
    const [postRes, commentsRes, meRes] = await Promise.all([
      fetch(`/api/showcase/${id}`),
      fetch(`/api/showcase/${id}/comments`),
      fetch("/api/user"),
    ]);

    if (!postRes.ok) { setNotFound(true); setLoading(false); return; }

    const { post }      = await postRes.json();
    const { comments }  = await commentsRes.json();
    const meData        = meRes.ok ? await meRes.json() : null;

    setPost(post);
    setComments(comments ?? []);
    setLikeCount(post._count.likes);
    setCurrentUser(meData?.user ? { id: meData.user.id, name: meData.user.name, image: meData.user.image } : null);

    // Fetch more from the same twin
    const moreRes  = await fetch(`/api/showcase?twinId=${post.twin.id}`);
    const moreData = moreRes.ok ? await moreRes.json() : null;
    const filtered = (moreData?.posts ?? []).filter((p: RelatedPost & { id: string }) => p.id !== id).slice(0, 3);
    setMorePosts(filtered);

    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleLike() {
    if (!currentUser) { router.push("/login"); return; }
    setLiking(true);
    const res  = await fetch(`/api/showcase/${id}/like`, { method: "POST" });
    const data = await res.json();
    setLiked(data.liked);
    setLikeCount(data.count);
    setLiking(false);
  }

  async function handleComment() {
    if (!currentUser) { router.push("/login"); return; }
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    const res  = await fetch(`/api/showcase/${id}/comments`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ content: newComment.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setComments((prev) => [...prev, data.comment]);
      setNewComment("");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4">
        <p className="text-5xl">🎬</p>
        <p className="font-semibold text-white">Post not found</p>
        <Link href="/showcase" className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
          ← Back to Showcase
        </Link>
      </div>
    );
  }

  const profileUrl = post.twin.user.publicSlug ? `/p/${post.twin.user.publicSlug}` : null;
  const isVerified = post.twin.user.verificationStatus === "verified";
  const embedUrl   = post.mediaType === "embed" && post.mediaUrl ? getEmbedUrl(post.mediaUrl) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-10 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/showcase" className="text-xs text-slate-400 hover:text-white transition-colors">
              ← Showcase
            </Link>
            <div className="w-px h-4 bg-slate-700" />
            <Link href="/" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-xs font-black">O</div>
              <span className="text-sm font-bold text-white hidden sm:block">OwnMyTwin</span>
            </Link>
          </div>
          {currentUser ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 px-3 py-1.5 rounded-xl transition-colors"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden bg-indigo-600/30 border border-indigo-700/50 flex items-center justify-center shrink-0">
                {currentUser.image ? (
                  <Image src={currentUser.image} alt="avatar" width={24} height={24} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-xs font-bold text-indigo-300">
                    {currentUser.name?.[0]?.toUpperCase() ?? "?"}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold text-slate-300 hidden sm:block">Dashboard</span>
            </Link>
          ) : (
            <Link href="/login" className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-colors">
              Sign in
            </Link>
          )}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 pt-20 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">

          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Media */}
            {post.mediaType === "image" && post.mediaUrl && (
              <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
                <Image
                  src={post.mediaUrl}
                  alt={post.title}
                  width={800}
                  height={450}
                  className="w-full object-contain max-h-[500px]"
                />
              </div>
            )}

            {post.mediaType === "embed" && (
              embedUrl ? (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
                  <iframe
                    src={embedUrl}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <p className="text-xs text-slate-500 mb-2">Embedded content</p>
                  <a
                    href={post.mediaUrl ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 text-sm break-all transition-colors"
                  >
                    {post.mediaUrl} ↗
                  </a>
                </div>
              )
            )}

            {/* Title + description */}
            <div>
              {post.isGuidedPost && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-300 bg-indigo-900/40 border border-indigo-700/50 px-2.5 py-1 rounded-full mb-3">
                  ✍️ Written by this twin from a real day
                </span>
              )}
              {post.isAiGenerated && !post.isGuidedPost && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-300 bg-violet-900/40 border border-violet-700/50 px-2.5 py-1 rounded-full mb-3">
                  ✨ AI Sample — generated by this twin&apos;s AI
                </span>
              )}
              <h1 className="text-2xl sm:text-3xl font-black text-white mb-4 leading-tight">{post.title}</h1>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line">{post.description}</p>
            </div>

            {/* Like + meta */}
            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={handleLike}
                disabled={liking}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  liked
                    ? "bg-red-900/40 text-red-400 border-red-800/50"
                    : "bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600 hover:text-white"
                } disabled:opacity-40`}
              >
                {liked ? "❤️" : "🤍"} {likeCount}
              </button>
              <span className="text-xs text-slate-500">
                {new Date(post.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </span>
              <span className="text-xs text-slate-600">by {post.buyer.name ?? "Anonymous"}</span>
            </div>

            {/* Comments */}
            <div className="space-y-4">
              <h2 className="font-semibold text-white">
                Comments <span className="text-slate-500 font-normal text-sm">({comments.length})</span>
              </h2>

              {/* Comment input */}
              {currentUser ? (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-700/50 flex items-center justify-center text-xs shrink-0">
                    {currentUser.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
                      placeholder="Add a comment..."
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                    />
                    <button
                      onClick={handleComment}
                      disabled={submitting || !newComment.trim()}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shrink-0"
                    >
                      {submitting ? "..." : "Post"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                  <p className="text-sm text-slate-400 mb-3">Sign in to leave a comment</p>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
                  >
                    Sign in →
                  </Link>
                </div>
              )}

              {/* Comment list */}
              {comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                        {comment.author.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-white">{comment.author.name ?? "User"}</span>
                          <span className="text-xs text-slate-600">
                            {new Date(comment.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600 text-center py-6">
                  No comments yet. Be the first.
                </p>
              )}
            </div>
          </div>

          {/* Sidebar — twin info */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">AI Twin used</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-700/40 flex items-center justify-center text-lg shrink-0">🤖</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-white truncate">{post.twin.name ?? "AI Twin"}</p>
                    {isVerified && (
                      <svg className="w-3.5 h-3.5 text-green-400 shrink-0" viewBox="0 0 12 12" fill="currentColor">
                        <path fillRule="evenodd" d="M6 1a5 5 0 100 10A5 5 0 006 1zm2.78 3.97a.75.75 0 00-1.06-1.06L5.25 6.44 4.28 5.47a.75.75 0 00-1.06 1.06l1.5 1.5a.75.75 0 001.06 0l3-3z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  {isVerified && <p className="text-xs text-green-400">Verified identity</p>}
                </div>
              </div>

              {post.twin.bio && (
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{post.twin.bio}</p>
              )}

              {profileUrl && (
                <Link
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center text-xs font-semibold border border-slate-700 hover:border-indigo-500 hover:text-indigo-400 text-slate-400 py-2.5 rounded-xl transition-colors"
                >
                  View Profile & License →
                </Link>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Want to create with AI Twins?</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Browse licensed AI twins from real creators and use them in your own campaigns.
              </p>
              <Link
                href="/marketplace"
                className="block w-full text-center text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl transition-colors"
              >
                Browse Marketplace →
              </Link>
            </div>
          </div>
        </div>

        {/* Back to feed */}
        <div className="mt-10 pt-8 border-t border-slate-800 flex items-center justify-between">
          <Link
            href="/showcase"
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            ← Back to Showcase
          </Link>
        </div>

        {/* More from this twin */}
        {morePosts.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">
                More from <span className="text-indigo-400">{post.twin.name ?? "this twin"}</span>
              </h2>
              <Link href="/showcase" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                All posts →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {morePosts.map((p) => (
                <Link
                  key={p.id}
                  href={`/showcase/${p.id}`}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col gap-3 group transition-all hover:shadow-lg hover:shadow-black/30"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-indigo-600/30 border border-indigo-700/50 flex items-center justify-center shrink-0">
                      {p.buyer.image ? (
                        <Image src={p.buyer.image} alt={p.buyer.name ?? ""} width={28} height={28} className="object-cover w-full h-full" />
                      ) : (
                        <span className="text-xs font-bold text-indigo-300">{p.buyer.name?.[0]?.toUpperCase() ?? "?"}</span>
                      )}
                    </div>
                    {p.isGuidedPost && (
                      <span className="text-xs text-indigo-400 font-medium">✍️ From their day</span>
                    )}
                    {p.isAiGenerated && !p.isGuidedPost && (
                      <span className="text-xs text-violet-400 font-medium">✨ AI Sample</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug">
                    {p.title}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed flex-1">{p.description}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-600 pt-1">
                    <span>❤️ {p._count.likes}</span>
                    <span>💬 {p._count.comments}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
