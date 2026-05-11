import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createVoiceClone, elevenLabsEnabled } from "@/lib/elevenlabs";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!elevenLabsEnabled) {
    return NextResponse.json({ error: "ElevenLabs not configured" }, { status: 503 });
  }

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });
  if (user?.plan !== "pro") {
    return NextResponse.json({ error: "Voice cloning requires a Pro plan" }, { status: 403 });
  }

  const [twin, recordings] = await Promise.all([
    db.twin.findUnique({ where: { userId: session.user.id } }),
    db.voiceRecording.findMany({ where: { userId: session.user.id }, take: 25 }),
  ]);

  if (!twin) return NextResponse.json({ error: "Set up your Twin first" }, { status: 400 });
  if (recordings.length < 3) return NextResponse.json({ error: "Record at least 3 voice samples first" }, { status: 400 });

  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  const audioUrls = recordings.map((r) => `${baseUrl}${r.url}`);

  const voiceId = await createVoiceClone(twin.name ?? "My Twin", audioUrls);

  await db.twin.update({
    where: { id: twin.id },
    data:  { elevenLabsVoiceId: voiceId },
  });

  return NextResponse.json({ voiceId });
}
