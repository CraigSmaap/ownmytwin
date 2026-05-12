import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { anthropic, modelForPlan, cachedSystem } from "@/lib/anthropic";
import { getRelevantMemories } from "@/lib/memory-search";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ReplyRequest } from "@/types";

const TWEAK_INSTRUCTIONS: Record<string, string> = {
  shorter:      "Rewrite this reply to be significantly shorter and more concise while keeping the same voice.",
  warmer:       "Rewrite this reply with a warmer, more personal and friendly tone.",
  professional: "Rewrite this reply in a more professional, polished tone.",
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { incomingMessage, platform, context, tweak, currentReply } =
    (await req.json()) as ReplyRequest;

  if (!incomingMessage?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const [twin, currentUser] = await Promise.all([
    db.twin.findUnique({ where: { userId: session.user.id } }),
    db.user.findUnique({ where: { id: session.user.id }, select: { plan: true } }),
  ]);

  if (!twin) return NextResponse.json({ error: "Set up your Twin first" }, { status: 400 });

  let remaining = 0;
  let dailyLimit = 0;

  if (!tweak) {
    const rate = await checkRateLimit(session.user.id, "reply", currentUser?.plan ?? "free");
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Daily reply limit reached (${rate.limit}/day). ${currentUser?.plan === "pro" ? "Try again tomorrow." : "Upgrade to Pro for higher limits."}` },
        { status: 429 },
      );
    }
    remaining  = rate.remaining;
    dailyLimit = rate.limit;
  }

  const memories = await getRelevantMemories(twin.id, incomingMessage, 10);
  const memoryContext =
    memories.length > 0
      ? `\n\nRelevant memories:\n${memories.map((m) => `- ${m.title}: ${m.content}`).join("\n")}`
      : "";

  const systemPrompt =
    (twin.systemPrompt ?? "You are an AI Twin. Reply as the user would.") + memoryContext;

  // ── Tweak a selected reply ──────────────────────────────────────────────────
  if (tweak && currentReply) {
    const instruction = TWEAK_INSTRUCTIONS[tweak] ?? "Improve this reply.";
    const tweakPrompt = [
      `Platform: ${platform}`,
      context ? `Context: ${context}` : null,
      `\nOriginal message received:\n${incomingMessage}`,
      `\nCurrent reply:\n${currentReply}`,
      `\n${instruction} Return only the rewritten reply text, nothing else.`,
    ].filter(Boolean).join("\n");

    const res = await anthropic.messages.create({
      model: modelForPlan(currentUser?.plan),
      max_tokens: 1024,
      system: cachedSystem(systemPrompt),
      messages: [{ role: "user", content: tweakPrompt }],
    });

    const content = res.content[0].type === "text" ? res.content[0].text.trim() : "";
    return NextResponse.json({ replies: [{ label: "Tweaked", content }] });
  }

  // ── Generate 3 options ──────────────────────────────────────────────────────
  const userPrompt = [
    `Platform: ${platform}`,
    context ? `Context: ${context}` : null,
    `\nMessage received:\n${incomingMessage}`,
    `\nGenerate exactly 3 reply options in this person's authentic voice.`,
    `Return ONLY valid JSON with no markdown or explanation:`,
    `{"replies":[{"label":"Natural","content":"..."},{"label":"Brief","content":"..."},{"label":"Warm","content":"..."}]}`,
    `Natural = how this person typically replies. Brief = shorter and more concise. Warm = more personal and friendly.`,
    `All three must sound authentically like this person.`,
  ].filter(Boolean).join("\n");

  const res = await anthropic.messages.create({
    model: modelForPlan(currentUser?.plan),
    max_tokens: 2048,
    system: cachedSystem(systemPrompt),
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = res.content[0].type === "text" ? res.content[0].text : "";

  let replies: { label: string; content: string }[];
  try {
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match?.[0] ?? text);
    replies = parsed.replies;
    if (!Array.isArray(replies) || replies.length === 0) throw new Error("empty");
  } catch {
    replies = [{ label: "Natural", content: text.trim() }];
  }

  await db.message.createMany({
    data: [
      { twinId: twin.id, role: "user",      content: incomingMessage, platform },
      { twinId: twin.id, role: "assistant", content: replies[0].content, platform },
    ],
  });

  return NextResponse.json({ replies, remaining, limit: dailyLimit });
}
