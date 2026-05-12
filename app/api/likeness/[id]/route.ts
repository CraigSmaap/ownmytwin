import { auth } from "@/auth";
import { db } from "@/lib/db";
import { deleteFromR2 } from "@/lib/r2";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const photo  = await db.likenessPhoto.findUnique({ where: { id } });

  if (!photo || photo.userId !== session.user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try { await deleteFromR2(photo.url); } catch { /* already gone */ }

  await db.likenessPhoto.delete({ where: { id } });
  return Response.json({ ok: true });
}
