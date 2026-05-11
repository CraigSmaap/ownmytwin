import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const recordings = await db.voiceRecording.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, url: true, label: true, duration: true, createdAt: true },
  });

  return NextResponse.json({ recordings });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const audio = form.get("audio") as File | null;
  const label = form.get("label") as string | null;
  const duration = form.get("duration") as string | null;

  if (!audio) return NextResponse.json({ error: "No audio" }, { status: 400 });

  const ext = audio.type.includes("mp4") ? "mp4" : "webm";
  const filename = `voice-${session.user.id}-${Date.now()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), Buffer.from(await audio.arrayBuffer()));

  const recording = await db.voiceRecording.create({
    data: {
      userId: session.user.id,
      url: `/uploads/${filename}`,
      label: label || null,
      duration: duration ? parseFloat(duration) : null,
    },
  });

  return NextResponse.json({ recording });
}
