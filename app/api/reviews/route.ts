import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { licenseRequestId, rating, comment } = await req.json() as {
    licenseRequestId: string;
    rating: number;
    comment?: string;
  };

  if (!licenseRequestId || typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const licenseRequest = await db.licenseRequest.findUnique({
    where:  { id: licenseRequestId },
    select: { id: true, twinId: true, buyerId: true, status: true, review: { select: { id: true } } },
  });

  if (!licenseRequest)                               return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (licenseRequest.buyerId !== session.user.id)    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (licenseRequest.status !== "approved")          return NextResponse.json({ error: "Can only review approved requests" }, { status: 400 });
  if (licenseRequest.review)                         return NextResponse.json({ error: "Already reviewed" }, { status: 409 });

  const review = await db.review.create({
    data: {
      twinId:          licenseRequest.twinId,
      buyerId:         session.user.id,
      licenseRequestId,
      rating:          Math.round(rating),
      comment:         comment?.trim() || null,
    },
  });

  return NextResponse.json({ review });
}
