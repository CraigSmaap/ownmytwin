import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const recording = await db.voiceRecording.findUnique({ where: { id } });
  if (!recording || recording.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await unlink(path.join(process.cwd(), "public", recording.url));
  } catch {}

  await db.voiceRecording.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
