import { auth } from "@/auth";
import { db }   from "@/lib/db";
import { verifyTOTP } from "@/lib/totp";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await req.json();
  if (!code) return Response.json({ error: "Code required" }, { status: 400 });

  const user = await db.user.findUnique({
    where:  { id: session.user.id },
    select: { twoFactorSecret: true },
  });

  if (!user?.twoFactorSecret) return Response.json({ error: "2FA not enabled" }, { status: 400 });

  if (!verifyTOTP(code, user.twoFactorSecret)) {
    return Response.json({ error: "Invalid code — try again." }, { status: 400 });
  }

  await db.user.update({
    where: { id: session.user.id },
    data:  { twoFactorEnabled: false, twoFactorSecret: null },
  });

  return Response.json({ ok: true });
}
