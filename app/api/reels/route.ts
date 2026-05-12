import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { anthropic, cachedSystem } from "@/lib/anthropic";
import { checkRateLimit } from "@/lib/rate-limit";

const PLATFORM_CONTEXT: Record<string, string> = {
  tiktok:    "TikTok (short-form vertical video, Gen Z / millennial audience, fast-paced, trending hooks, energetic)",
  instagram: "Instagram Reels (short-form vertical video, aesthetic-driven, lifestyle-focused, community tone)",
  youtube:   "YouTube Shorts (short-form vertical video, slightly more depth ok, discovery-optimised)",
  twitter:   "Twitter/X Video (punchy, opinionated, thought-leader tone, direct)",
  linkedin:  "LinkedIn Video (professional audience, insight-driven, career and business focus)",
  other:     "short-form social video content",
};

const DURATION_GUIDANCE: Record<string, string> = {
  "15s": "very short — hook + 1 key point + CTA, roughly 35–50 words spoken",
  "30s": "short — hook + 2 key points + CTA, roughly 70–100 words spoken",
  "60s": "medium — hook + 3 key points + CTA, roughly 140–180 words spoken",
  "90s": "longer — hook + story arc + 3–4 points + CTA, roughly 210–260 words spoken",
};

const TWEAK_INSTRUCTIONS: Record<string, string> = {
  punchier: "Make the hook and script punchier, more energetic, and attention-grabbing. Keep the same authentic voice.",
  shorter:  "Cut this down significantly. Keep only the most essential lines. Preserve the voice and the hook.",
  local:    "Add South African flavour — references, slang, and local context where it feels natural and authentic. Don't force it.",
};

interface ReelInput {
  platform:    string;
  topic:       string;
  duration:    string;
  tweak?:      string;
  currentReel?: { hook: string; script: string; caption: string; hashtags: string[] };
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { platform, topic, duration, tweak, currentReel } = (await req.json()) as ReelInput;

  if (!topic?.trim()) return NextResponse.json({ error: "Topic is required" }, { status: 400 });

  const [currentUser, twin] = await Promise.all([
    db.user.findUnique({ where: { id: session.user.id }, select: { plan: true } }),
    db.twin.findUnique({
      where: { userId: session.user.id },
      include: {
        memories: {
          where: { visibility: { not: "private" } },
          take: 8,
          orderBy: { importance: "desc" },
        },
      },
    }),
  ]);

  if (!twin) return NextResponse.json({ error: "Set up your Twin first" }, { status: 400 });

  if (currentUser?.plan !== "pro") {
    return NextResponse.json({ error: "Reel Creator requires a Pro plan." }, { status: 403 });
  }

  if (!tweak) {
    const rate = await checkRateLimit(session.user.id, "reels", "pro");
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Daily reel limit reached (${rate.limit}/day). Try again tomorrow.` },
        { status: 429 },
      );
    }
  }

  const memoryContext =
    twin.memories.length > 0
      ? `\n\nPersonal context and memories to draw from:\n${twin.memories.map((m) => `- ${m.title}: ${m.content}`).join("\n")}`
      : "";

  const systemPrompt =
    (twin.systemPrompt ?? "You are a content creator. Write in an authentic, engaging voice.") + memoryContext;

  const platformCtx = PLATFORM_CONTEXT[platform] ?? PLATFORM_CONTEXT.other;
  const durationCtx = DURATION_GUIDANCE[duration]  ?? DURATION_GUIDANCE["30s"];

  // ── Tweak a selected reel ────────────────────────────────────────────────────
  if (tweak && currentReel) {
    const instruction = TWEAK_INSTRUCTIONS[tweak] ?? "Improve this reel script.";
    const tweakPrompt = [
      `Platform: ${platformCtx}`,
      `Duration: ${durationCtx}`,
      `Topic: ${topic}`,
      `\nCurrent reel:\nHook: ${currentReel.hook}\nScript: ${currentReel.script}\nCaption: ${currentReel.caption}`,
      `\n${instruction}`,
      `Return ONLY valid JSON with no markdown: {"hook":"...","script":"...","caption":"...","hashtags":["..."]}`,
    ].join("\n");

    const res = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: cachedSystem(systemPrompt),
      messages: [{ role: "user", content: tweakPrompt }],
    });

    const text = res.content[0].type === "text" ? res.content[0].text : "";
    try {
      const match  = text.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(match?.[0] ?? text);
      return NextResponse.json({ reels: [{ label: "Tweaked", ...parsed }] });
    } catch {
      return NextResponse.json({ reels: [{ label: "Tweaked", hook: "", script: text.trim(), caption: "", hashtags: [] }] });
    }
  }

  // ── Generate 3 style variants ────────────────────────────────────────────────
  const userPrompt = [
    `Platform: ${platformCtx}`,
    `Duration: ${durationCtx}`,
    `Topic: ${topic}`,
    ``,
    `Generate 3 reel script variants in this creator's authentic voice. Each must have a distinct style:`,
    `- "Hook-First": Lead with the most scroll-stopping, attention-grabbing hook possible. Pure pattern interrupt.`,
    `- "Storytelling": Open with a personal moment or relatable scenario, build to the key point naturally.`,
    `- "Direct & Bold": Confident, punchy, no fluff. Gets straight to the value in the first breath.`,
    ``,
    `For each variant provide:`,
    `- hook: The opening line (first 3–5 seconds). The scroll-stopper. Make it impossible to skip.`,
    `- script: The full spoken script including the hook. Written as it would be spoken aloud, not read.`,
    `- caption: The written post caption — engaging, different from the script, adds context or intrigue.`,
    `- hashtags: 5–8 relevant hashtags as strings WITHOUT the # symbol.`,
    ``,
    `Return ONLY valid JSON with no markdown or explanation:`,
    `{"reels":[{"label":"Hook-First","hook":"...","script":"...","caption":"...","hashtags":["..."]},{"label":"Storytelling","hook":"...","script":"...","caption":"...","hashtags":["..."]},{"label":"Direct & Bold","hook":"...","script":"...","caption":"...","hashtags":["..."]}]}`,
  ].join("\n");

  const res = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    system: cachedSystem(systemPrompt),
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = res.content[0].type === "text" ? res.content[0].text : "";

  let reels: { label: string; hook: string; script: string; caption: string; hashtags: string[] }[];
  try {
    const match  = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match?.[0] ?? text);
    reels = parsed.reels;
    if (!Array.isArray(reels) || reels.length === 0) throw new Error("empty");
  } catch {
    reels = [{ label: "Hook-First", hook: "", script: text.trim(), caption: "", hashtags: [] }];
  }

  return NextResponse.json({ reels });
}
