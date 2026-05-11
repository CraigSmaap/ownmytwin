import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const twin = await db.twin.findUnique({
    where:  { userId: session.user.id },
    select: { id: true },
  });

  if (!twin) return NextResponse.json({ requests: [] });

  const requests = await db.licenseRequest.findMany({
    where:   { twinId: twin.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ requests });
}
