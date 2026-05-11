import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Personality = { profession?: string; location?: string; tone?: string[]; values?: string[] };
type LicensePerm  = { enabled: boolean; price: number };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q     = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? "24"), 48);

  const twins = await db.twin.findMany({
    where: {
      marketplaceVisible: true,
      user: { publicSlug: { not: null } },
    },
    select: {
      id:                 true,
      name:               true,
      bio:                true,
      personality:        true,
      licensePermissions: true,
      userId:             true,
      user: {
        select: { publicSlug: true, image: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  // Fetch first photo per user
  const userIds     = twins.map((t) => t.userId);
  const photos      = await db.likenessPhoto.findMany({
    where:   { userId: { in: userIds } },
    orderBy: { createdAt: "asc" },
    select:  { userId: true, url: true },
  });
  const photoByUser: Record<string, string> = {};
  for (const p of photos) {
    if (!photoByUser[p.userId]) photoByUser[p.userId] = p.url;
  }

  const results = twins
    .map((twin) => {
      const p           = (twin.personality ?? {}) as Personality;
      const perms       = (twin.licensePermissions ?? {}) as Record<string, LicensePerm>;
      const licenseCount = Object.values(perms).filter((v) => v.enabled).length;
      const prices       = Object.values(perms).filter((v) => v.enabled && v.price > 0).map((v) => v.price);
      const startingPrice = prices.length > 0 ? Math.min(...prices) : null;

      return {
        id:           twin.id,
        name:         twin.name ?? "",
        bio:          twin.bio ?? null,
        profession:   p.profession ?? null,
        location:     p.location   ?? null,
        tone:         p.tone        ?? [],
        photoUrl:     photoByUser[twin.userId] ?? twin.user.image ?? null,
        slug:         twin.user.publicSlug!,
        licenseCount,
        startingPrice,
      };
    })
    .filter((t) => {
      if (!t.name) return false;
      if (!q)      return true;
      return (
        t.name.toLowerCase().includes(q)       ||
        t.profession?.toLowerCase().includes(q) ||
        t.location?.toLowerCase().includes(q)   ||
        t.bio?.toLowerCase().includes(q)
      );
    })
    .slice(0, limit);

  return NextResponse.json({ profiles: results, total: results.length });
}
