import { auth } from "@/auth";
import { db } from "@/lib/db";
import { textToSpeech, elevenLabsEnabled } from "@/lib/elevenlabs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!elevenLabsEnabled) return Response.json({ error: "ElevenLabs not configured" }, { status: 503 });

  const { text } = await req.json() as { text: string };
  if (!text?.trim()) return Response.json({ error: "Text required" }, { status: 400 });

  const twin = await db.twin.findUnique({ where: { userId: session.user.id } });
  if (!twin?.elevenLabsVoiceId) {
    return Response.json({ error: "No voice clone yet — create one first" }, { status: 400 });
  }

  const audio = await textToSpeech(twin.elevenLabsVoiceId, text);

  return new Response(audio, {
    headers: {
      "Content-Type":  "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
