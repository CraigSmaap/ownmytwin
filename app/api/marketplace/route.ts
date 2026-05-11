import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

interface LicenseSetting {
  enabled:  boolean;
  price:    number;
  approval: "manual" | "auto";
  territory: "local" | "national" | "global";
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const usage    = searchParams.get("usage") ?? "";
  const location = searchParams.get("location") ?? "";
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : null;

  const twins = await db.twin.findMany({
    where: { name: { not: null }, marketplaceVisible: true },
    select: {
      id:                 true,
      userId:             true,
      name:               true,
      personality:        true,
      licensePermissions: true,
      user:               { select: { publicSlug: true } },
      reviews:            { select: { rating: true } },
    },
  });

  // Fetch first photo per user
  const userIds = twins.map((t) => t.userId);
  const photos  = await db.likenessPhoto.findMany({
    where:   { userId: { in: userIds } },
    orderBy: { createdAt: "asc" },
    select:  { userId: true, url: true },
  });
  const photoByUser: Record<string, string> = {};
  for (const p of photos) {
    if (!photoByUser[p.userId]) photoByUser[p.userId] = p.url;
  }

  const listings = twins
    .map((twin) => {
      const perms       = (twin.licensePermissions ?? {}) as unknown as Record<string, LicenseSetting>;
      const personality = twin.personality as Record<string, unknown> | null;

      const enabledLicenses = Object.entries(perms)
        .filter(([, v]) => v.enabled)
        .map(([k, v]) => ({ id: k, price: v.price, approval: v.approval, territory: v.territory }));

      const prices       = enabledLicenses.map((l) => l.price).filter((p) => p > 0);
      const startingPrice = prices.length > 0 ? Math.min(...prices) : null;

      const reviewCount = twin.reviews.length;
      const avgRating   = reviewCount > 0
        ? Math.round((twin.reviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10
        : null;

      return {
        id:           twin.id,
        name:         twin.name as string,
        profession:   (personality?.profession  as string | null) ?? null,
        location:     (personality?.location    as string | null) ?? null,
        tone:         (personality?.tone        as string[])      ?? [],
        values:       (personality?.values      as string[])      ?? [],
        photoUrl:     photoByUser[twin.userId]  ?? null,
        licenses:     enabledLicenses,
        startingPrice,
        slug:         twin.user.publicSlug ?? null,
        avgRating,
        reviewCount,
      };
    })
    // Only show twins with at least one enabled license
    .filter((l) => l.licenses.length > 0)
    // Apply filters
    .filter((l) => {
      if (usage    && !l.licenses.some((lic) => lic.id === usage))                         return false;
      if (location && !l.location?.toLowerCase().includes(location.toLowerCase()))          return false;
      if (maxPrice !== null && l.startingPrice !== null && l.startingPrice > maxPrice)      return false;
      return true;
    });

  return NextResponse.json({ listings });
}
