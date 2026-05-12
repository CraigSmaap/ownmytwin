import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await db.postLike.findUnique({
    where: { postId_userId: { postId: id, userId: session.user.id } },
  });

  if (existing) {
    await db.postLike.delete({ where: { id: existing.id } });
  } else {
    await db.postLike.create({ data: { postId: id, userId: session.user.id } });
  }

  const count = await db.postLike.count({ where: { postId: id } });
  return NextResponse.json({ liked: !existing, count });
}
