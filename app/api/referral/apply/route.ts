import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const code = typeof body.code === "string" ? body.code.toUpperCase().trim() : null;
  if (!code) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

  const user = await db.user.findUnique({
    where:  { id: session.user.id },
    select: { referralCode: true, referredByCode: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.referredByCode)      return NextResponse.json({ ok: true, skipped: true });
  if (user.referralCode === code) return NextResponse.json({ error: "Cannot use your own code" }, { status: 400 });

  const referrer = await db.user.findUnique({ where: { referralCode: code }, select: { id: true } });
  if (!referrer) return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });

  await db.user.update({ where: { id: session.user.id }, data: { referredByCode: code } });

  return NextResponse.json({ ok: true });
}
