import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const memory = await db.memory.findUnique({
    where: { id },
    include: { twin: { select: { userId: true } } },
  });

  if (!memory) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (memory.twin.userId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.memory.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
