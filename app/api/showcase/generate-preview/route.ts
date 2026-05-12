import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "@/lib/rate-limit";

const client = new Anthropic();

type Tone = "serious" | "funny" | "inspirational";

const TONE_INSTRUCTIONS: Record<Tone, string> = {
  serious:       "Write this as a thoughtful, direct, honest reflection. No hype, no fluff — just genuine insight from real experience. It should feel considered and mature.",
  funny:         "Write this with humour and self-awareness. Lean into the awkward or relatable parts. Make it witty and a bit self-deprecating where it fits — the kind of post that makes people laugh and say 'same'.",
  inspirational: "Write this as uplifting and motivating. Take what they experienced and turn it into something that encourages others. Energetic, forward-looking, the kind of post people screenshot and share.",
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { journalEntry, twinId, tone = "serious" } = await req.json();

  if (!journalEntry?.trim() || !twinId) {
    return NextResponse.json({ error: "journalEntry and twinId are required" }, { status: 400 });
  }

  const [currentUser, twin] = await Promise.all([
    db.user.findUnique({ where: { id: session.user.id }, select: { plan: true } }),
    db.twin.findUnique({
      where:  { id: twinId, userId: session.user.id },
      select: { id: true, name: true, bio: true, systemPrompt: true, personality: true, writingStyle: true },
    }),
  ]);

  if (!twin) return NextResponse.json({ error: "Twin not found" }, { status: 404 });

  const rate = await checkRateLimit(session.user.id, "showcase_preview", currentUser?.plan ?? "free");
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Daily preview limit reached (${rate.limit}/day). ${currentUser?.plan === "pro" ? "Try again tomorrow." : "Upgrade to Pro for higher limits."}` },
      { status: 429 },
    );
  }

  const personalityData = twin.personality  as Record<string, unknown> | null;
  const writingData     = twin.writingStyle as Record<string, unknown> | null;

  const contextParts = [
    twin.bio          ? `Bio: ${twin.bio}`                                                : null,
    twin.systemPrompt ? `Personality & voice: ${twin.systemPrompt.substring(0, 600)}`    : null,
    personalityData   ? `Traits: ${JSON.stringify(personalityData).substring(0, 300)}`   : null,
    writingData       ? `Writing style: ${JSON.stringify(writingData).substring(0, 200)}` : null,
  ].filter(Boolean);

  const context = contextParts.length > 0
    ? contextParts.join("\n")
    : "A creator sharing their authentic day-to-day experiences.";

  const name            = twin.name ?? "this creator";
  const toneInstruction = TONE_INSTRUCTIONS[tone as Tone] ?? TONE_INSTRUCTIONS.serious;

  const message = await client.messages.create({
    model:      "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [
      {
        role:    "user",
        content: `You write social media posts for ${name}, a creator on OwnMyTwin.

${name}'s voice and personality:
${context}

They journalled about their day:
"${journalEntry.trim()}"

Tone instruction: ${toneInstruction}

Write the post in their voice with this tone. Keep the specific personal details — don't make it generic.

Respond ONLY with valid JSON (no markdown fences):
{"title": "punchy post title under 80 chars matching the tone", "description": "the post in their voice, 2-4 sentences, specific and real"}`,
      },
    ],
  });

  const raw = (message.content[0] as { type: string; text: string }).text.trim();

  let parsed: { title: string; description: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: "Generation failed — try again" }, { status: 500 });
    try { parsed = JSON.parse(match[0]); }
    catch { return NextResponse.json({ error: "Generation failed — try again" }, { status: 500 }); }
  }

  if (!parsed?.title || !parsed?.description) {
    return NextResponse.json({ error: "Generation failed — try again" }, { status: 500 });
  }

  return NextResponse.json({
    title:       parsed.title.substring(0, 80),
    description: parsed.description.substring(0, 1000),
  });
}
