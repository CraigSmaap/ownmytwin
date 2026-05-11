import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { PersonalityTraits, WritingStyle } from "@/types";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const twin = await db.twin.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json({ twin });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, personality, writingStyle, bio, marketplaceVisible } = (await req.json()) as {
    name?: string;
    personality?: PersonalityTraits;
    writingStyle?: WritingStyle;
    bio?: string;
    marketplaceVisible?: boolean;
  };

  // Gate marketplace visibility behind Pro plan
  let safeMarketplaceVisible = marketplaceVisible;
  if (marketplaceVisible === true) {
    const user = await db.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });
    if (user?.plan !== "pro") safeMarketplaceVisible = false;
  }

  const systemPrompt = buildSystemPrompt(name, personality, writingStyle);

  const twin = await db.twin.upsert({
    where:  { userId: session.user.id },
    update: {
      name,
      personality:       personality as never,
      writingStyle:      writingStyle as never,
      systemPrompt,
      ...(bio                      !== undefined && { bio }),
      ...(safeMarketplaceVisible   !== undefined && { marketplaceVisible: safeMarketplaceVisible }),
    },
    create: {
      userId: session.user.id,
      name,
      personality:       personality as never,
      writingStyle:      writingStyle as never,
      systemPrompt,
      bio:               bio ?? null,
      marketplaceVisible: safeMarketplaceVisible ?? false,
    },
  });

  // Auto-generate publicSlug if the user doesn't have one yet
  if (name) {
    const user = await db.user.findUnique({
      where:  { id: session.user.id },
      select: { publicSlug: true },
    });
    if (!user?.publicSlug) {
      await assignSlug(session.user.id, name);
    }
  }

  return NextResponse.json({ twin });
}

async function assignSlug(userId: string, twinName: string) {
  const base = twinName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .substring(0, 40);

  if (!base) return;

  let slug = base;
  const conflict = await db.user.findFirst({
    where: { publicSlug: slug, NOT: { id: userId } },
  });
  if (conflict) {
    slug = `${base}-${Math.random().toString(36).substring(2, 6)}`;
  }

  await db.user.update({ where: { id: userId }, data: { publicSlug: slug } });
}

function buildSystemPrompt(
  name?: string,
  personality?: PersonalityTraits,
  writingStyle?: WritingStyle,
): string {
  const parts: string[] = [];

  const who = name ?? "a real person";
  parts.push(`You are the AI Twin of ${who}. You are a digital replica — not an assistant, not a chatbot. You ARE this person.`);
  parts.push("Respond exactly as they would — their voice, their rhythm, their personality. Never break character. Never reveal you are an AI.");

  if (personality?.profession) parts.push(`They work as: ${personality.profession}.`);
  if (personality?.location)   parts.push(`They are based in: ${personality.location}. Use culturally appropriate language, slang, and references for this location.`);
  if (personality?.lifeContext) parts.push(`Current life context: ${personality.lifeContext}.`);

  if (personality?.tone?.length)   parts.push(`Their personality comes across as: ${personality.tone.join(", ")}.`);
  if (personality?.values?.length) parts.push(`Their core values are: ${personality.values.join(", ")}. These shape every response.`);
  if (personality?.humor)          parts.push(`Their humour style is: ${personality.humor}.`);

  if (writingStyle) {
    parts.push(`Formality: ${writingStyle.formality}.`);

    const msgLen = writingStyle.messageLength ?? writingStyle.sentenceLength ?? "medium";
    const lengthDesc = msgLen === "short"
      ? "They keep replies brief — often just a sentence or two."
      : msgLen === "long"
      ? "They tend to write longer, detailed responses."
      : "They write moderate-length replies — enough to be clear without being excessive.";
    parts.push(lengthDesc);

    parts.push(writingStyle.usesEmoji ? "They naturally use emoji in conversation." : "They do not use emoji.");
    if (writingStyle.patterns?.length) parts.push(`Writing habits: ${writingStyle.patterns.join(", ")}.`);
  }

  if (personality?.signaturePhrases?.length) {
    parts.push(`Phrases they commonly use: "${personality.signaturePhrases.join('", "')}". Weave these in naturally where appropriate.`);
  }

  if (personality?.avoids?.length) {
    parts.push(`Things they never say or do in conversation: ${personality.avoids.join(", ")}.`);
  }

  parts.push("Match their exact voice. If unsure, lean toward how a real person texts — natural, unpolished, human.");

  return parts.join(" ");
}
