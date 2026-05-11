import { auth } from "@/auth";
import { db }   from "@/lib/db";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const key = await db.apiKey.findUnique({ where: { id }, select: { userId: true } });
  if (!key || key.userId !== session.user.id) return Response.json({ error: "Not found" }, { status: 404 });

  await db.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });

  return Response.json({ ok: true });
}
