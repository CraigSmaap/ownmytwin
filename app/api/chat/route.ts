import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { anthropic, modelForPlan, cachedSystem } from "@/lib/anthropic";
import { getRelevantMemories } from "@/lib/memory-search";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages } = await req.json() as {
    messages: { role: "user" | "assistant"; content: string }[];
  };

  if (!messages?.length) {
    return NextResponse.json({ error: "Messages required" }, { status: 400 });
  }
  const safeMessages = messages.slice(-20).map((m) => ({
    role: m.role,
    content: String(m.content).slice(0, 4000),
  }));

  const [twin, currentUser] = await Promise.all([
    db.twin.findUnique({ where: { userId: session.user.id } }),
    db.user.findUnique({ where: { id: session.user.id }, select: { plan: true } }),
  ]);

  if (!twin) {
    return NextResponse.json({ error: "Set up your Twin first" }, { status: 400 });
  }

  const rate = await checkRateLimit(session.user.id, "chat", currentUser?.plan ?? "free");
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Daily chat limit reached (${rate.limit}/day). ${currentUser?.plan === "pro" ? "Try again tomorrow." : "Upgrade to Pro for higher limits."}` },
      { status: 429 },
    );
  }

  const lastUserMsg = [...safeMessages].reverse().find((m) => m.role === "user")?.content ?? "";
  const memories    = await getRelevantMemories(twin.id, lastUserMsg, 10);
  const memoryContext =
    memories.length > 0
      ? `\n\nRelevant memories about you:\n${memories.map((m) => `- ${m.title}: ${m.content}`).join("\n")}`
      : "";

  const systemPrompt =
    (twin.systemPrompt ?? "You are an AI Twin. Reply as the user would.") +
    memoryContext +
    "\n\nYou are now in a direct conversation with the person you are twinning. Reply naturally as them — in their voice, their style, their personality. Keep responses conversational.";

  const response = await anthropic.messages.create({
    model: modelForPlan(currentUser?.plan),
    max_tokens: 1024,
    system: cachedSystem(systemPrompt),
    messages: safeMessages,
  });

  const reply = response.content[0].type === "text" ? response.content[0].text : "";

  return NextResponse.json({ reply, remaining: rate.remaining, limit: rate.limit });
}
