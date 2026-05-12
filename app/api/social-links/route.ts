import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const links = await db.socialLink.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ links });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { platform, handle } = await req.json();

  if (!platform || !handle?.trim()) {
    return NextResponse.json({ error: "Platform and handle required" }, { status: 400 });
  }

  const link = await db.socialLink.upsert({
    where:  { userId_platform: { userId: session.user.id, platform } },
    create: { userId: session.user.id, platform, handle: handle.trim() },
    update: { handle: handle.trim() },
  });

  return NextResponse.json({ link });
}
