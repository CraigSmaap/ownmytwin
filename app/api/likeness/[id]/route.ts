import { auth } from "@/auth";
import { db } from "@/lib/db";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const photo = await db.likenessPhoto.findUnique({ where: { id } });
  if (!photo || photo.userId !== session.user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Remove file from disk
  try {
    const filepath = path.join(process.cwd(), "public", photo.url);
    await unlink(filepath);
  } catch {
    // File may already be gone — continue
  }

  await db.likenessPhoto.delete({ where: { id } });

  return Response.json({ ok: true });
}
