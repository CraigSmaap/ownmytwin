import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { anthropic } from "@/lib/anthropic";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = await db.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });
  if (currentUser?.plan !== "pro") {
    return NextResponse.json({ error: "Writing style analysis requires a Pro plan." }, { status: 403 });
  }

  const rate = await checkRateLimit(session.user.id, "analyze", "pro");
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Daily analysis limit reached (${rate.limit}/day). Try again tomorrow.` },
      { status: 429 },
    );
  }

  const { samples } = (await req.json()) as { samples: string[] };

  if (!samples?.length) {
    return NextResponse.json({ error: "No samples provided" }, { status: 400 });
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Analyze these writing samples and extract the person's communication style.

Return ONLY a JSON object with these fields:
{
  "tone": string[],        // 3-5 words e.g. ["warm", "casual", "witty"]
  "values": string[],      // 2-4 core values e.g. ["honesty", "humor"]
  "formality": "casual" | "professional" | "mixed",
  "usesEmoji": boolean,
  "patterns": string[],    // 2-4 writing habits e.g. ["asks follow-up questions", "uses short sentences"]
  "vocabulary": string[]   // 5-10 characteristic words/phrases
}

Writing samples:
${samples.map((s, i) => `[${i + 1}] ${s}`).join("\n\n")}`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";

  try {
    const match = text.match(/\{[\s\S]*\}/);
    const analysis = match ? JSON.parse(match[0]) : {};
    return NextResponse.json({ analysis });
  } catch {
    return NextResponse.json({ error: "Failed to parse analysis" }, { status: 500 });
  }
}
