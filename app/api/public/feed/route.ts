import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const LICENSE_LABELS: Record<string, string> = {
  voice_only: "Voice Only", voiceover: "Voiceover", public_speaking: "Public Speaking",
  face_avatar: "Face / Avatar", full_likeness: "Full Likeness", social_media: "Social Media",
  ads: "Advertising", ai_presenter: "AI Presenter", virtual_influencer: "Virtual Influencer",
  educational: "Educational", corporate_training: "Corporate Training",
  customer_service: "Customer Service", film_tv: "Film / TV", game_npc: "Game NPC",
  motion_style: "Motion Style",
};

const EVENT_ICONS: Record<string, string> = {
  license_approved:  "🤝",
  marketplace_joined: "🚀",
  memory_shared:     "🧠",
  reply_milestone:   "💬",
};

export type FeedItem = {
  id:          string;
  type:        string;
  icon:        string;
  twinName:    string;
  slug:        string;
  photoUrl:    string | null;
  description: string;
  timestamp:   string;
};

export async function GET() {
  const thirtyDaysAgo  = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo   = new Date(Date.now() -  7 * 24 * 60 * 60 * 1000);

  const [approvals, listings, memories, messages] = await Promise.all([
    // Approved license requests
    db.licenseRequest.findMany({
      where: {
        status: "approved",
        updatedAt: { gte: thirtyDaysAgo },
        twin: { marketplaceVisible: true, user: { publicSlug: { not: null } } },
      },
      select: {
        id: true, usageType: true, updatedAt: true,
        twin: { select: { name: true, userId: true, user: { select: { publicSlug: true, image: true } } } },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    // New / updated marketplace listings
    db.twin.findMany({
      where: { marketplaceVisible: true, user: { publicSlug: { not: null } }, updatedAt: { gte: thirtyDaysAgo } },
      select: { id: true, name: true, updatedAt: true, userId: true, user: { select: { publicSlug: true, image: true } } },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    // Public memories shared
    db.memory.findMany({
      where: {
        visibility: "marketplace",
        createdAt: { gte: thirtyDaysAgo },
        twin: { marketplaceVisible: true, user: { publicSlug: { not: null } } },
      },
      select: {
        id: true, title: true, createdAt: true,
        twin: { select: { name: true, userId: true, user: { select: { publicSlug: true, image: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    // Reply activity counts (last 7 days)
    db.message.findMany({
      where: {
        role: "assistant",
        createdAt: { gte: sevenDaysAgo },
        twin: { marketplaceVisible: true, user: { publicSlug: { not: null } } },
      },
      select: {
        twinId: true, createdAt: true,
        twin: { select: { name: true, userId: true, user: { select: { publicSlug: true, image: true } } } },
      },
    }),
  ]);

  // Aggregate reply counts per twin
  const replyMap: Record<string, { count: number; twin: typeof messages[0]["twin"]; latest: Date }> = {};
  for (const m of messages) {
    if (!replyMap[m.twinId]) replyMap[m.twinId] = { count: 0, twin: m.twin, latest: m.createdAt };
    replyMap[m.twinId].count++;
    if (m.createdAt > replyMap[m.twinId].latest) replyMap[m.twinId].latest = m.createdAt;
  }
  const replyActivity = Object.entries(replyMap)
    .filter(([, v]) => v.count >= 5)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 4);

  // Collect all userIds for a single photo lookup
  const userIds = [
    ...approvals.map((r) => r.twin.userId),
    ...listings.map((t) => t.userId),
    ...memories.map((m) => m.twin.userId),
    ...replyActivity.map(([, v]) => v.twin.userId),
  ];
  const photos = await db.likenessPhoto.findMany({
    where: { userId: { in: userIds } }, orderBy: { createdAt: "asc" }, select: { userId: true, url: true },
  });
  const photoByUser: Record<string, string> = {};
  for (const p of photos) { if (!photoByUser[p.userId]) photoByUser[p.userId] = p.url; }

  const items: FeedItem[] = [
    ...approvals.map((r) => ({
      id:          `approval-${r.id}`,
      type:        "license_approved",
      icon:        EVENT_ICONS.license_approved,
      twinName:    r.twin.name ?? "Unknown",
      slug:        r.twin.user.publicSlug!,
      photoUrl:    photoByUser[r.twin.userId] ?? r.twin.user.image ?? null,
      description: `just had a ${LICENSE_LABELS[r.usageType] ?? r.usageType} license approved`,
      timestamp:   r.updatedAt.toISOString(),
    })),
    ...listings.map((t) => ({
      id:          `listing-${t.id}`,
      type:        "marketplace_joined",
      icon:        EVENT_ICONS.marketplace_joined,
      twinName:    t.name ?? "Unknown",
      slug:        t.user.publicSlug!,
      photoUrl:    photoByUser[t.userId] ?? t.user.image ?? null,
      description: "is now available for licensing on the marketplace",
      timestamp:   t.updatedAt.toISOString(),
    })),
    ...memories.map((m) => ({
      id:          `memory-${m.id}`,
      type:        "memory_shared",
      icon:        EVENT_ICONS.memory_shared,
      twinName:    m.twin.name ?? "Unknown",
      slug:        m.twin.user.publicSlug!,
      photoUrl:    photoByUser[m.twin.userId] ?? m.twin.user.image ?? null,
      description: `just shared a new memory — "${m.title}"`,
      timestamp:   m.createdAt.toISOString(),
    })),
    ...replyActivity.map(([twinId, v]) => ({
      id:          `replies-${twinId}`,
      type:        "reply_milestone",
      icon:        EVENT_ICONS.reply_milestone,
      twinName:    v.twin.name ?? "Unknown",
      slug:        v.twin.user.publicSlug!,
      photoUrl:    photoByUser[v.twin.userId] ?? v.twin.user.image ?? null,
      description: `generated ${v.count} replies in their voice this week`,
      timestamp:   v.latest.toISOString(),
    })),
  ]
    .filter((item) => item.twinName && item.slug)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  return NextResponse.json({ items });
}
