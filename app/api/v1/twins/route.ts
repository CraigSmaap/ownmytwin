import { db } from "@/lib/db";
import { validateApiKey } from "@/lib/api-keys";

export async function GET(req: Request) {
  const caller = await validateApiKey(req.headers.get("authorization"));
  if (!caller) return Response.json({ error: "Invalid or missing API key" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const usage    = searchParams.get("usage") ?? "";
  const location = searchParams.get("location") ?? "";

  interface LicenseSetting { enabled: boolean; price: number; approval: string; territory: string; }

  const twins = await db.twin.findMany({
    where: { marketplaceVisible: true, name: { not: null } },
    select: {
      id:                 true,
      name:               true,
      bio:                true,
      personality:        true,
      licensePermissions: true,
      user:               { select: { publicSlug: true } },
      reviews:            { select: { rating: true } },
      _count:             { select: { memories: true } },
    },
  });

  const results = twins
    .map((twin) => {
      const perms       = (twin.licensePermissions ?? {}) as unknown as Record<string, LicenseSetting>;
      const personality = twin.personality as Record<string, unknown> | null;
      const licenses    = Object.entries(perms)
        .filter(([, v]) => v.enabled)
        .map(([k, v]) => ({ type: k, price: v.price, approval: v.approval, territory: v.territory }));
      const prices      = licenses.map((l) => l.price).filter((p) => p > 0);
      const avgRating   = twin.reviews.length > 0
        ? Math.round((twin.reviews.reduce((s, r) => s + r.rating, 0) / twin.reviews.length) * 10) / 10
        : null;
      return {
        id:           twin.id,
        name:         twin.name,
        bio:          twin.bio,
        slug:         twin.user.publicSlug,
        profileUrl:   twin.user.publicSlug ? `${process.env.APP_URL}/p/${twin.user.publicSlug}` : null,
        profession:   (personality?.profession as string) ?? null,
        location:     (personality?.location   as string) ?? null,
        tone:         (personality?.tone        as string[]) ?? [],
        licenses,
        startingPrice: prices.length > 0 ? Math.min(...prices) : null,
        avgRating,
        reviewCount:  twin.reviews.length,
        memoryCount:  twin._count.memories,
      };
    })
    .filter((t) => t.licenses.length > 0)
    .filter((t) => !usage    || t.licenses.some((l) => l.type === usage))
    .filter((t) => !location || t.location?.toLowerCase().includes(location.toLowerCase()));

  return Response.json({ twins: results, count: results.length });
}
