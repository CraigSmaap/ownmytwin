import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      verificationStatus: true,
      verificationRequest: true,
      socialLinks: { orderBy: { createdAt: "asc" } },
    },
  });

  return NextResponse.json(user);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { fullName, idType, idNumber } = body;

  if (!fullName?.trim() || !idType || !idNumber?.trim()) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const existing = await db.verificationRequest.findUnique({
    where: { userId: session.user.id },
  });

  if (existing?.status === "pending") {
    return NextResponse.json({ error: "Verification already pending review" }, { status: 400 });
  }
  if (existing?.status === "approved") {
    return NextResponse.json({ error: "Already verified" }, { status: 400 });
  }

  await db.$transaction([
    db.verificationRequest.upsert({
      where: { userId: session.user.id },
      create: {
        userId:   session.user.id,
        fullName: fullName.trim(),
        idType,
        idNumber: idNumber.trim(),
        status:   "pending",
      },
      update: {
        fullName:   fullName.trim(),
        idType,
        idNumber:   idNumber.trim(),
        status:     "pending",
        reviewNote: null,
        reviewedBy: null,
        reviewedAt: null,
      },
    }),
    db.user.update({
      where: { id: session.user.id },
      data:  { verificationStatus: "pending" },
    }),
  ]);

  return NextResponse.json({ success: true });
}
