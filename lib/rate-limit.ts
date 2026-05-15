import { db } from "@/lib/db";

type DailyAction   = "reply" | "chat" | "reels" | "analyze" | "showcase_preview" | "tts";
type MonthlyAction = "voice_clone";

const DAILY_LIMITS: Record<DailyAction, { free: number; pro: number }> = {
  reply:            { free: 10, pro: 100 },
  chat:             { free: 20, pro: 200 },
  reels:            { free: 5,  pro: 50  },
  analyze:          { free: 3,  pro: 20  },
  showcase_preview: { free: 5,  pro: 50  },
  tts:              { free: 0,  pro: 10  },
};

const MONTHLY_LIMITS: Record<MonthlyAction, { free: number; pro: number }> = {
  voice_clone: { free: 0, pro: 3 },
};

function today(): string {
  return new Date().toISOString().slice(0, 10); // "2026-05-15"
}

function thisMonth(): string {
  return new Date().toISOString().slice(0, 7); // "2026-05"
}

export async function checkRateLimit(
  userId: string,
  action: DailyAction,
  plan: string,
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const limit  = plan === "pro" ? DAILY_LIMITS[action].pro : DAILY_LIMITS[action].free;
  const date   = today();

  if (limit === 0) return { allowed: false, remaining: 0, limit };

  const record = await db.rateLimit.upsert({
    where:  { userId_action_date: { userId, action, date } },
    update: { count: { increment: 1 } },
    create: { userId, action, date, count: 1 },
  });

  const allowed   = record.count <= limit;
  const remaining = Math.max(0, limit - record.count);
  return { allowed, remaining, limit };
}

export async function checkMonthlyLimit(
  userId: string,
  action: MonthlyAction,
  plan: string,
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const limit = plan === "pro" ? MONTHLY_LIMITS[action].pro : MONTHLY_LIMITS[action].free;
  const date  = thisMonth();

  if (limit === 0) return { allowed: false, remaining: 0, limit };

  const record = await db.rateLimit.upsert({
    where:  { userId_action_date: { userId, action, date } },
    update: { count: { increment: 1 } },
    create: { userId, action, date, count: 1 },
  });

  const allowed   = record.count <= limit;
  const remaining = Math.max(0, limit - record.count);
  return { allowed, remaining, limit };
}
