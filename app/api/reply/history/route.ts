import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const twin = await db.twin.findUnique({ where: { userId: session.user.id } });
  if (!twin) return NextResponse.json({ history: [] });

  // Fetch last 20 messages in order, then pair user+assistant on the client
  const messages = await db.message.findMany({
    where: { twinId: twin.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, role: true, content: true, platform: true, createdAt: true },
  });

  return NextResponse.json({ messages });
}
