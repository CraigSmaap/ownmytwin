import { auth } from "@/auth";
import { db }   from "@/lib/db";
import { generateApiKey } from "@/lib/api-keys";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const keys = await db.apiKey.findMany({
    where:   { userId: session.user.id, revokedAt: null },
    select:  { id: true, name: true, prefix: true, lastUsedAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ keys });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });
  if (user?.plan !== "pro") return Response.json({ error: "API keys require a Pro plan." }, { status: 403 });

  const { name } = await req.json();
  if (!name?.trim()) return Response.json({ error: "Name is required" }, { status: 400 });

  const existing = await db.apiKey.count({ where: { userId: session.user.id, revokedAt: null } });
  if (existing >= 5) return Response.json({ error: "Maximum 5 API keys per account" }, { status: 400 });

  const { key, hash, prefix } = generateApiKey();

  await db.apiKey.create({
    data: { userId: session.user.id, name: name.trim(), keyHash: hash, prefix },
  });

  return Response.json({ key }); // Only time the raw key is returned
}
