"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type FeedItem = {
  id: string; type: string; icon: string; twinName: string;
  slug: string; photoUrl: string | null; description: string; timestamp: string;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60)   return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function ActivityFeed({ initialItems }: { initialItems: FeedItem[] }) {
  const [items, setItems]       = useState(initialItems);
  const [visible, setVisible]   = useState(false);

  useEffect(() => {
    setVisible(true);
    // Refresh feed every 90s
    const id = setInterval(async () => {
      const res  = await fetch("/api/public/feed");
      const data = await res.json();
      if (data.items?.length) setItems(data.items);
    }, 90_000);
    return () => clearInterval(id);
  }, []);

  if (!items.length) return null;

  return (
    <section className="py-14 px-6 bg-slate-950 border-y border-slate-800">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </span>
          <h2 className="text-white font-bold text-lg">What AI Twins are doing right now</h2>
        </div>

        {/* Feed */}
        <div className="space-y-1">
          {items.map((item, i) => {
            const initials = item.twinName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
            return (
              <Link
                key={item.id}
                href={`/p/${item.slug}`}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-slate-800/60 transition-all group ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                }`}
                style={{ transitionDelay: `${i * 60}ms`, transitionDuration: "400ms" }}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-slate-700 shrink-0 flex items-center justify-center">
                  {item.photoUrl ? (
                    <Image src={item.photoUrl} alt={item.twinName} width={36} height={36} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-xs font-bold text-indigo-300">{initials}</span>
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 leading-snug">
                    <span className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      {item.twinName}
                    </span>
                    {" "}
                    <span className="text-slate-400">{item.description}</span>
                  </p>
                </div>

                {/* Meta */}
                <div className="shrink-0 flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-xs text-slate-600 tabular-nums w-14 text-right">{timeAgo(item.timestamp)}</span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-5 text-center">
          <Link href="/search" className="text-xs text-slate-500 hover:text-indigo-400 transition-colors">
            Browse all profiles →
          </Link>
        </div>
      </div>
    </section>
  );
}
