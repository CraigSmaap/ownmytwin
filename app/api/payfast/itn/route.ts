import { db } from "@/lib/db";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const PASSPHRASE = process.env.PAYFAST_PASSPHRASE ?? "";
const SANDBOX    = process.env.PAYFAST_SANDBOX !== "false";
const PF_HOST    = SANDBOX ? "sandbox.payfast.co.za" : "www.payfast.co.za";

function validateSignature(data: Record<string, string>): boolean {
  const { signature, ...rest } = data;
  const qs = Object.entries(rest)
    .filter(([, v]) => v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, "+")}`)
    .join("&");
  const toHash  = PASSPHRASE ? `${qs}&passphrase=${encodeURIComponent(PASSPHRASE)}` : qs;
  const computed = crypto.createHash("md5").update(toHash).digest("hex");
  return computed === signature;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const params  = new URLSearchParams(rawBody);
  const data: Record<string, string> = {};
  params.forEach((v, k) => { data[k] = v; });

  if (!validateSignature(data)) {
    console.error("[PayFast ITN] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Verify with PayFast to prevent replay attacks
  const verifyRes  = await fetch(`https://${PF_HOST}/eng/query/validate`, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    rawBody,
  });
  const verifyText = await verifyRes.text();
  if (verifyText.trim() !== "VALID") {
    console.error("[PayFast ITN] PayFast server rejected:", verifyText);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  const status      = data.payment_status;
  const userId      = data.m_payment_id;
  const gross       = parseFloat(data.amount_gross ?? "0");
  const customStr1  = data.custom_str1 ?? "";

  if (!userId) {
    console.error("[PayFast ITN] Missing m_payment_id");
    return NextResponse.json({ ok: true });
  }

  // TTS top-up pack
  if (status === "COMPLETE" && customStr1.startsWith("tts_topup_")) {
    const packSize = customStr1.replace("tts_topup_", "");
    const creditsMap: Record<string, number> = { "100": 100, "300": 300, "500": 500 };
    const credits = creditsMap[packSize];
    if (credits) {
      await db.user.update({
        where: { id: userId },
        data:  { ttsCredits: { increment: credits } },
      });
      console.log(`[PayFast ITN] Added ${credits} TTS credits to user ${userId}`);
    }
    return NextResponse.json({ ok: true });
  }

  if (status === "COMPLETE" && gross >= 499) {
    // Grant pro for 31 days — PayFast subscription ITN will fire monthly to renew
    const planExpiresAt = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
    await db.user.update({
      where: { id: userId },
      data:  { plan: "pro", planExpiresAt },
    });
    console.log(`[PayFast ITN] Upgraded user ${userId} to Pro until ${planExpiresAt.toISOString()}`);

    // Referral reward — only fires once per referred user
    const paidUser = await db.user.findUnique({
      where:  { id: userId },
      select: { referredByCode: true, referralRewardGiven: true },
    });
    if (paidUser?.referredByCode && !paidUser.referralRewardGiven) {
      const referrer = await db.user.findFirst({
        where:  { referralCode: paidUser.referredByCode, referralRewardMonths: { lt: 6 } },
        select: { id: true, planExpiresAt: true },
      });
      if (referrer) {
        const base       = referrer.planExpiresAt && referrer.planExpiresAt > new Date() ? referrer.planExpiresAt : new Date();
        const newExpiry  = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
        await db.user.update({
          where: { id: referrer.id },
          data:  { plan: "pro", planExpiresAt: newExpiry, referralRewardMonths: { increment: 1 } },
        });
        await db.user.update({
          where: { id: userId },
          data:  { referralRewardGiven: true },
        });
        console.log(`[PayFast ITN] Referral reward granted — referrer ${referrer.id} extended to ${newExpiry.toISOString()}`);
      }
    }
  } else if (status === "CANCELLED") {
    await db.user.update({
      where: { id: userId },
      data:  { plan: "free", planExpiresAt: null },
    });
    console.log(`[PayFast ITN] Downgraded user ${userId} to free (cancelled)`);
  }

  return NextResponse.json({ ok: true });
}
