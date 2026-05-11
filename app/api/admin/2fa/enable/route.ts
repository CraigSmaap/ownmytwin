import { auth } from "@/auth";
import { db }   from "@/lib/db";
import { verifyTOTP } from "@/lib/totp";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { secret, code } = await req.json();
  if (!secret || !code)  return Response.json({ error: "Missing fields" }, { status: 400 });

  if (!verifyTOTP(code, secret)) {
    return Response.json({ error: "Invalid code — try again." }, { status: 400 });
  }

  await db.user.update({
    where: { id: session.user.id },
    data:  { twoFactorEnabled: true, twoFactorSecret: secret },
  });

  return Response.json({ ok: true });
}
