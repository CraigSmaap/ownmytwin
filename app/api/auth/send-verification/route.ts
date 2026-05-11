import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, emailVerified: true },
  });

  if (!user?.email) return Response.json({ error: "No email on account" }, { status: 400 });
  if (user.emailVerified) return Response.json({ ok: true, alreadyVerified: true });

  // Delete any existing token for this email
  await db.verificationToken.deleteMany({ where: { identifier: user.email } });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db.verificationToken.create({
    data: { identifier: user.email, token, expires },
  });

  try {
    await sendVerificationEmail(user.email, token);
  } catch (err) {
    console.error("[send-verification] Resend error:", err);
    return Response.json({ error: "Failed to send email" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
