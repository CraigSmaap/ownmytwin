import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/paystack";
import { sendPaymentConfirmationEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const rawBody  = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error("[Paystack Webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as {
    event: string;
    data: {
      reference:  string;
      status:     string;
      amount:     number;
      customer:   { email: string };
      metadata:   { userId?: string; type?: string; pack?: string; credits?: number; requestId?: string };
      subscription?: { status: string };
    };
  };

  const { event: eventType, data } = event;
  const meta = data.metadata ?? {};

  // ── Pro subscription payment ──────────────────────────────────────
  if (
    (eventType === "charge.success" || eventType === "invoice.update") &&
    meta.type === "pro_subscription" &&
    meta.userId
  ) {
    const planExpiresAt = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
    await db.user.update({
      where: { id: meta.userId },
      data:  { plan: "pro", planExpiresAt },
    });
    console.log(`[Paystack] Upgraded user ${meta.userId} to Pro until ${planExpiresAt.toISOString()}`);

    // Referral reward — only fires once
    const paidUser = await db.user.findUnique({
      where:  { id: meta.userId },
      select: { referredByCode: true, referralRewardGiven: true },
    });
    if (paidUser?.referredByCode && !paidUser.referralRewardGiven) {
      const referrer = await db.user.findFirst({
        where:  { referralCode: paidUser.referredByCode, referralRewardMonths: { lt: 6 } },
        select: { id: true, planExpiresAt: true },
      });
      if (referrer) {
        const base      = referrer.planExpiresAt && referrer.planExpiresAt > new Date() ? referrer.planExpiresAt : new Date();
        const newExpiry = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
        await db.user.update({
          where: { id: referrer.id },
          data:  { plan: "pro", planExpiresAt: newExpiry, referralRewardMonths: { increment: 1 } },
        });
        await db.user.update({
          where: { id: meta.userId },
          data:  { referralRewardGiven: true },
        });
        console.log(`[Paystack] Referral reward — referrer ${referrer.id} extended to ${newExpiry.toISOString()}`);
      }
    }
    return NextResponse.json({ ok: true });
  }

  // ── Subscription cancelled ────────────────────────────────────────
  if (eventType === "subscription.disable" && meta.userId) {
    await db.user.update({
      where: { id: meta.userId },
      data:  { plan: "free", planExpiresAt: null },
    });
    console.log(`[Paystack] Downgraded user ${meta.userId} to free (subscription cancelled)`);
    return NextResponse.json({ ok: true });
  }

  // ── TTS credit top-up ─────────────────────────────────────────────
  if (eventType === "charge.success" && meta.type === "tts_topup" && meta.userId && meta.credits) {
    await db.user.update({
      where: { id: meta.userId },
      data:  { ttsCredits: { increment: meta.credits } },
    });
    console.log(`[Paystack] Added ${meta.credits} TTS credits to user ${meta.userId}`);
    return NextResponse.json({ ok: true });
  }

  // ── License request payment ───────────────────────────────────────
  if (eventType === "charge.success" && meta.type === "license_payment" && meta.requestId) {
    const licenseRequest = await db.licenseRequest.findUnique({
      where:   { id: meta.requestId },
      include: { twin: { select: { name: true } } },
    });

    await db.licenseRequest.update({
      where: { id: meta.requestId },
      data:  { paidAt: new Date() },
    });
    console.log(`[Paystack] License request ${meta.requestId} marked as paid`);

    if (licenseRequest) {
      sendPaymentConfirmationEmail({
        buyerEmail: licenseRequest.buyerEmail,
        buyerName:  licenseRequest.buyerName,
        twinName:   licenseRequest.twin.name ?? "the twin",
        usageType:  licenseRequest.usageType,
        amount:     licenseRequest.agreedPrice,
      }).catch(console.error);
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
