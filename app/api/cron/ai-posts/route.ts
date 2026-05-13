import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret     = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const twins = await db.twin.findMany({
    where: {
      marketplaceVisible: true,
      OR: [
        { systemPrompt: { not: null } },
        { bio:          { not: null } },
      ],
    },
    select: {
      id:          true,
      userId:      true,
      name:        true,
      bio:         true,
      systemPrompt: true,
      personality:  true,
      writingStyle: true,
    },
    take: 50,
  });

  let created = 0;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  for (const twin of twins) {
    try {
      const alreadyPostedToday = await db.showcasePost.findFirst({
        where: {
          twinId:       twin.id,
          isAiGenerated: true,
          createdAt:    { gte: todayStart },
        },
        select: { id: true },
      });
      if (alreadyPostedToday) continue;

      const personalityData = twin.personality as Record<string, unknown> | null;
      const writingData     = twin.writingStyle as Record<string, unknown> | null;

      const contextParts = [
        twin.bio          ? `Bio: ${twin.bio}`                                               : null,
        twin.systemPrompt ? `Personality: ${twin.systemPrompt.substring(0, 600)}`           : null,
        personalityData   ? `Traits: ${JSON.stringify(personalityData).substring(0, 300)}`  : null,
        writingData       ? `Writing style: ${JSON.stringify(writingData).substring(0, 200)}` : null,
      ].filter(Boolean);

      if (contextParts.length === 0) continue;

      const context = contextParts.join("\n");
      const name    = twin.name ?? "this creator";

      const message = await client.messages.create({
        model:      "claude-haiku-4-5-20251001",
        max_tokens: 350,
        messages: [
          {
            role:    "user",
            content: `You manage an AI twin marketplace called OwnMyTwin, where brands license AI versions of real creators.

Generate a sample showcase post for an AI twin named "${name}". This post demonstrates what this twin's AI can produce — it might be a sample brand reply, a content hook, a personal message, or a short piece of writing.

Context about this twin:
${context}

Write something authentic that shows off their voice. Keep it real, not generic.

Respond ONLY with valid JSON (no markdown fences):
{"title": "punchy title under 80 chars", "description": "the sample content in this creator's voice, 2-4 sentences that feel real"}`,
          },
        ],
      });

      const raw = (message.content[0] as { type: string; text: string }).text.trim();

      let parsed: { title: string; description: string };
      try {
        parsed = JSON.parse(raw);
      } catch {
        const match = raw.match(/\{[\s\S]*\}/);
        if (!match) continue;
        try { parsed = JSON.parse(match[0]); } catch { continue; }
      }

      if (!parsed?.title || !parsed?.description) continue;

      await db.showcasePost.create({
        data: {
          buyerId:      twin.userId,
          twinId:       twin.id,
          title:        parsed.title.substring(0, 80),
          description:  parsed.description.substring(0, 1000),
          mediaType:    "text",
          isAiGenerated: true,
        },
      });

      created++;
    } catch (err) {
      console.error(`[ai-posts] twin ${twin.id} failed:`, err);
    }
  }

  return NextResponse.json({ ok: true, created, total: twins.length });
}
