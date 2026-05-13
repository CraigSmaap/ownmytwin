import { auth } from "@/auth";
import { db } from "@/lib/db";
import crypto from "crypto";
import { NextResponse } from "next/server";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(6);
  return Array.from(bytes).map((b) => chars[b % chars.length]).join("");
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let user = await db.user.findUnique({
    where:  { id: session.user.id },
    select: { referralCode: true, referralRewardMonths: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!user.referralCode) {
    let code = generateCode();
    while (await db.user.findUnique({ where: { referralCode: code } })) {
      code = generateCode();
    }
    user = await db.user.update({
      where:  { id: session.user.id },
      data:   { referralCode: code },
      select: { referralCode: true, referralRewardMonths: true },
    });
  }

  const successfulReferrals = await db.user.count({
    where: { referredByCode: user.referralCode!, referralRewardGiven: true },
  });

  const base        = process.env.NEXTAUTH_URL ?? "https://ownmytwin.com";
  const referralUrl = `${base}/register?ref=${user.referralCode}`;

  return NextResponse.json({
    code: user.referralCode,
    referralUrl,
    successfulReferrals,
    rewardMonths: user.referralRewardMonths,
  });
}
