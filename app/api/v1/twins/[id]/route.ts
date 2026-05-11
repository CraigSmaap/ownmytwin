import { db } from "@/lib/db";
import { validateApiKey } from "@/lib/api-keys";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await validateApiKey(req.headers.get("authorization"));
  if (!caller) return Response.json({ error: "Invalid or missing API key" }, { status: 401 });

  const { id } = await params;

  interface LicenseSetting { enabled: boolean; price: number; approval: string; territory: string; }

  const twin = await db.twin.findFirst({
    where: { id, marketplaceVisible: true, name: { not: null } },
    select: {
      id:                 true,
      name:               true,
      bio:                true,
      personality:        true,
      licensePermissions: true,
      user:               { select: { publicSlug: true } },
      reviews:            { select: { rating: true, comment: true, createdAt: true, buyer: { select: { name: true } } } },
      _count:             { select: { memories: true } },
    },
  });

  if (!twin) return Response.json({ error: "Twin not found" }, { status: 404 });

  const perms       = (twin.licensePermissions ?? {}) as unknown as Record<string, LicenseSetting>;
  const personality = twin.personality as Record<string, unknown> | null;
  const licenses    = Object.entries(perms)
    .filter(([, v]) => v.enabled)
    .map(([k, v]) => ({ type: k, price: v.price, approval: v.approval, territory: v.territory }));
  const prices      = licenses.map((l) => l.price).filter((p) => p > 0);
  const avgRating   = twin.reviews.length > 0
    ? Math.round((twin.reviews.reduce((s, r) => s + r.rating, 0) / twin.reviews.length) * 10) / 10
    : null;

  return Response.json({
    twin: {
      id:           twin.id,
      name:         twin.name,
      bio:          twin.bio,
      slug:         twin.user.publicSlug,
      profileUrl:   twin.user.publicSlug ? `${process.env.APP_URL}/p/${twin.user.publicSlug}` : null,
      profession:   (personality?.profession as string) ?? null,
      location:     (personality?.location   as string) ?? null,
      tone:         (personality?.tone        as string[]) ?? [],
      languages:    (personality?.languages   as string[]) ?? [],
      licenses,
      startingPrice: prices.length > 0 ? Math.min(...prices) : null,
      avgRating,
      reviewCount:  twin.reviews.length,
      memoryCount:  twin._count.memories,
      reviews: twin.reviews.map((r) => ({
        rating:    r.rating,
        comment:   r.comment,
        buyerName: r.buyer.name,
        date:      r.createdAt,
      })),
    },
  });
}
