import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const user = await db.user.findUnique({
    where: { publicSlug: slug },
    select: {
      id: true,
      photos: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { url: true },
      },
      twin: {
        select: {
          id:                 true,
          name:               true,
          bio:                true,
          personality:        true,
          licensePermissions: true,
          reviews: {
            orderBy: { createdAt: "desc" },
            take:    20,
            select: {
              id:        true,
              rating:    true,
              comment:   true,
              createdAt: true,
              buyer:     { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!user?.twin) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const reviews     = user.twin.reviews;
  const reviewCount = reviews.length;
  const avgRating   = reviewCount > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10
    : null;

  return NextResponse.json({
    twinId:             user.twin.id,
    name:               user.twin.name,
    bio:                user.twin.bio,
    photoUrl:           user.photos[0]?.url ?? null,
    personality:        user.twin.personality,
    licensePermissions: user.twin.licensePermissions,
    reviews:            reviews.map((r) => ({
      id:        r.id,
      rating:    r.rating,
      comment:   r.comment,
      createdAt: r.createdAt.toISOString(),
      buyerName: r.buyer.name,
    })),
    avgRating,
    reviewCount,
  });
}
