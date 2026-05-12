import { db } from "@/lib/db";

type Action = "reply" | "chat" | "reels" | "analyze" | "showcase_preview";

const LIMITS: Record<Action, { free: number; pro: number }> = {
  reply:             { free: 10,  pro: 100 },
  chat:              { free: 20,  pro: 200 },
  reels:             { free: 5,   pro: 50  },
  analyze:           { free: 3,   pro: 20  },
  showcase_preview:  { free: 5,   pro: 50  },
};

function today(): string {
  return new Date().toISOString().slice(0, 10); // "2026-05-12"
}

export async function checkRateLimit(
  userId: string,
  action: Action,
  plan: string,
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const limit  = plan === "pro" ? LIMITS[action].pro : LIMITS[action].free;
  const date   = today();

  const record = await db.rateLimit.upsert({
    where:  { userId_action_date: { userId, action, date } },
    update: { count: { increment: 1 } },
    create: { userId, action, date, count: 1 },
  });

  const allowed   = record.count <= limit;
  const remaining = Math.max(0, limit - record.count);
  return { allowed, remaining, limit };
}
