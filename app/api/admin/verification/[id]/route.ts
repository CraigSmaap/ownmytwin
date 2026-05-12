import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await db.user.findUnique({
    where:  { id: session.user.id },
    select: { role: true },
  });
  if (admin?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { status, note } = await req.json();

  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const request = await db.verificationRequest.findUnique({ where: { id } });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.$transaction([
    db.verificationRequest.update({
      where: { id },
      data: {
        status,
        reviewNote: note?.trim() || null,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
    }),
    db.user.update({
      where: { id: request.userId },
      data:  { verificationStatus: status === "approved" ? "verified" : "rejected" },
    }),
  ]);

  return NextResponse.json({ success: true });
}
