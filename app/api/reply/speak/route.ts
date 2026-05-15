import { auth } from "@/auth";
import { db } from "@/lib/db";
import { textToSpeech, elevenLabsEnabled } from "@/lib/elevenlabs";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!elevenLabsEnabled) return Response.json({ error: "ElevenLabs not configured" }, { status: 503 });

  const user = await db.user.findUnique({
    where:  { id: session.user.id },
    select: { plan: true, ttsCredits: true },
  });

  // Use purchased credits first, then fall back to daily limit
  if ((user?.ttsCredits ?? 0) > 0) {
    await db.user.update({
      where: { id: session.user.id },
      data:  { ttsCredits: { decrement: 1 } },
    });
  } else {
    const { allowed, limit } = await checkRateLimit(session.user.id, "tts", user?.plan ?? "free");
    if (!allowed) {
      return Response.json(
        { error: `Daily voice limit reached (${limit}/day). Buy credits or wait until midnight.` },
        { status: 429 },
      );
    }
  }

  const { text } = await req.json() as { text: string };
  if (!text?.trim()) return Response.json({ error: "Text required" }, { status: 400 });

  const twin = await db.twin.findUnique({ where: { userId: session.user.id } });
  if (!twin?.elevenLabsVoiceId) {
    return Response.json({ error: "No voice clone yet — create one first" }, { status: 400 });
  }

  try {
    const audio = await textToSpeech(twin.elevenLabsVoiceId, text);
    return new Response(audio, {
      headers: {
        "Content-Type":  "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Voice generation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
