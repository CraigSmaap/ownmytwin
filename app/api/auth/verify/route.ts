import { db } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const email = req.nextUrl.searchParams.get("email");

  if (!token || !email) {
    return Response.redirect(new URL("/verify-email?error=invalid", req.nextUrl.origin));
  }

  const record = await db.verificationToken.findUnique({
    where: { token },
  });

  if (!record || record.identifier !== email || record.expires < new Date()) {
    return Response.redirect(new URL("/verify-email?error=expired", req.nextUrl.origin));
  }

  await db.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });

  await db.verificationToken.delete({ where: { token } });

  return Response.redirect(new URL("/verify-email?success=1", req.nextUrl.origin));
}
