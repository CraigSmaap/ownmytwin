import { db } from "@/lib/db";
import { validateApiKey } from "@/lib/api-keys";
import { anthropic } from "@/lib/anthropic";
import { getRelevantMemories } from "@/lib/memory-search";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await validateApiKey(req.headers.get("authorization"));
  if (!caller) return Response.json({ error: "Invalid or missing API key" }, { status: 401 });

  const { id } = await params;

  const twin = await db.twin.findFirst({
    where:  { id, marketplaceVisible: true, name: { not: null } },
    select: { id: true, systemPrompt: true, personality: true },
  });

  if (!twin) return Response.json({ error: "Twin not found" }, { status: 404 });

  let body: { messages?: { role: string; content: string }[]; message?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Accept either a messages array or a single message string
  let messages: { role: "user" | "assistant"; content: string }[];
  if (body.messages?.length) {
    const valid = body.messages.every((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string");
    if (!valid) return Response.json({ error: "messages must be array of {role, content}" }, { status: 400 });
    messages = body.messages as { role: "user" | "assistant"; content: string }[];
  } else if (typeof body.message === "string" && body.message.trim()) {
    messages = [{ role: "user", content: body.message.trim() }];
  } else {
    return Response.json({ error: "Provide messages array or message string" }, { status: 400 });
  }

  const lastUserContent = messages[messages.length - 1].content;
  const memories        = await getRelevantMemories(twin.id, lastUserContent, 10, "public");
  const memoryContext   = memories.length > 0
    ? `\n\nRelevant memories:\n${memories.map((m) => `- ${m.title}: ${m.content}`).join("\n")}`
    : "";

  const systemPrompt =
    (twin.systemPrompt ?? "You are an AI Twin. Reply as the person you represent would.") +
    memoryContext;

  const response = await anthropic.messages.create({
    model:      "claude-sonnet-4-6",
    max_tokens: 1024,
    system:     systemPrompt,
    messages,
  });

  const reply = response.content[0].type === "text" ? response.content[0].text : "";

  // Log the message exchange (platform = "api")
  await db.message.createMany({
    data: [
      { twinId: twin.id, role: "user",      content: messages[messages.length - 1].content, platform: "api" },
      { twinId: twin.id, role: "assistant", content: reply,                                  platform: "api" },
    ],
  });

  return Response.json({
    reply,
    usage: {
      inputTokens:  response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  });
}
