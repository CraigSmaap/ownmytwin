import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return Response.json({ error: "Email required" }, { status: 400 });

  const user = await db.user.findUnique({ where: { email }, select: { id: true } });

  // Always return ok — don't reveal whether the email exists
  if (!user) return Response.json({ ok: true });

  await db.passwordResetToken.deleteMany({ where: { identifier: email } });

  const token   = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.passwordResetToken.create({
    data: { identifier: email, token, expires },
  });

  try {
    await sendPasswordResetEmail(email, token);
  } catch (err) {
    console.error("[forgot-password] Resend error:", err);
  }

  return Response.json({ ok: true });
}
