import crypto from "crypto";
import { db } from "@/lib/db";

export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const raw    = crypto.randomBytes(32).toString("hex");
  const key    = `omt_${raw}`;
  const hash   = crypto.createHash("sha256").update(key).digest("hex");
  const prefix = `omt_${raw.slice(0, 8)}`;
  return { key, hash, prefix };
}

export async function validateApiKey(authHeader: string | null): Promise<{
  userId: string;
  keyId: string;
} | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const key  = authHeader.slice(7);
  const hash = crypto.createHash("sha256").update(key).digest("hex");

  const apiKey = await db.apiKey.findUnique({
    where:  { keyHash: hash },
    select: { id: true, userId: true, revokedAt: true },
  });

  if (!apiKey || apiKey.revokedAt) return null;

  // Update lastUsedAt without blocking the response
  db.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

  return { userId: apiKey.userId, keyId: apiKey.id };
}
