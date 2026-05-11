import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { token, email, password } = await req.json();

  if (!token || !email || !password) {
    return Response.json({ error: "Missing fields." }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const record = await db.passwordResetToken.findUnique({ where: { token } });

  if (!record || record.identifier !== email || record.expires < new Date()) {
    return Response.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.user.update({ where: { email }, data: { passwordHash } });
  await db.passwordResetToken.delete({ where: { token } });

  return Response.json({ ok: true });
}
