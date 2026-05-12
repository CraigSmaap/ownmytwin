import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await db.user.findUnique({
    where:  { id: session.user.id },
    select: { role: true },
  });
  if (admin?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const requests = await db.verificationRequest.findMany({
    where:   { status: "pending" },
    orderBy: { submittedAt: "asc" },
    include: {
      user: {
        select: {
          id:                 true,
          name:               true,
          email:              true,
          verificationStatus: true,
          socialLinks:        { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  return NextResponse.json({ requests });
}
