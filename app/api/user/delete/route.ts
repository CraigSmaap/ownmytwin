import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await db.user.delete({ where: { id: session.user.id } });

  return Response.json({ ok: true });
}
