import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { uploadToR2 } from "@/lib/r2";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const recordings = await db.voiceRecording.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select:  { id: true, url: true, label: true, duration: true, createdAt: true },
  });

  return NextResponse.json({ recordings });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form     = await req.formData();
  const audio    = form.get("audio") as File | null;
  const label    = form.get("label") as string | null;
  const duration = form.get("duration") as string | null;

  if (!audio) return NextResponse.json({ error: "No audio" }, { status: 400 });
  if (audio.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: "Audio must be under 50 MB" }, { status: 400 });
  }

  const ext    = audio.type.includes("mp4") ? "mp4" : "webm";
  const key    = `voice/${session.user.id}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await audio.arrayBuffer());
  const url    = await uploadToR2(key, buffer, audio.type || "audio/webm");

  const recording = await db.voiceRecording.create({
    data: {
      userId:   session.user.id,
      url,
      label:    label || null,
      duration: duration ? parseFloat(duration) : null,
    },
  });

  return NextResponse.json({ recording });
}
