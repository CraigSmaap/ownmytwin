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

  const status = data.payment_status;
  const userId = data.m_payment_id;
  const gross  = parseFloat(data.amount_gross ?? "0");

  if (!userId) {
    console.error("[PayFast ITN] Missing m_payment_id");
    return NextResponse.json({ ok: true });
  }

  if (status === "COMPLETE" && gross >= 165) {
    // Grant pro for 31 days — PayFast subscription ITN will fire monthly to renew
    const planExpiresAt = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
    await db.user.update({
      where: { id: userId },
      data:  { plan: "pro", planExpiresAt },
    });
    console.log(`[PayFast ITN] Upgraded user ${userId} to Pro until ${planExpiresAt.toISOString()}`);
  } else if (status === "CANCELLED") {
    await db.user.update({
      where: { id: userId },
      data:  { plan: "free", planExpiresAt: null },
    });
    console.log(`[PayFast ITN] Downgraded user ${userId} to free (cancelled)`);
  }

  return NextResponse.json({ ok: true });
}
