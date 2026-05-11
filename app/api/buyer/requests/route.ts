import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requests = await db.licenseRequest.findMany({
    where:   { buyerId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id:           true,
      usageType:    true,
      message:      true,
      status:       true,
      responseNote: true,
      respondedAt:  true,
      createdAt:    true,
      agreedPrice:  true,
      paidAt:       true,
      twin: {
        select: {
          name: true,
          user: { select: { publicSlug: true } },
        },
      },
      review: { select: { id: true, rating: true, comment: true } },
    },
  });

  const serialized = requests.map((r) => ({
    ...r,
    createdAt:   r.createdAt.toISOString(),
    respondedAt: r.respondedAt?.toISOString() ?? null,
    paidAt:      r.paidAt?.toISOString() ?? null,
    twin:        r.twin ? { name: r.twin.name, slug: r.twin.user.publicSlug } : null,
  }));

  return NextResponse.json({ requests: serialized });
}
