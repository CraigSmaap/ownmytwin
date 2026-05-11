import { db } from "@/lib/db";
import { verifyPayfastSignature } from "@/lib/payfast";
import { sendPaymentConfirmationEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

const SANDBOX = process.env.PAYFAST_SANDBOX === "true";
const PF_HOST = SANDBOX ? "sandbox.payfast.co.za" : "www.payfast.co.za";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const params  = new URLSearchParams(rawBody);
  const data: Record<string, string> = {};
  params.forEach((v, k) => { data[k] = v; });

  if (!verifyPayfastSignature(data)) {
    console.error("[PayFast Notify] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const verifyRes  = await fetch(`https://${PF_HOST}/eng/query/validate`, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    rawBody,
  });
  const verifyText = await verifyRes.text();
  if (verifyText.trim() !== "VALID") {
    console.error("[PayFast Notify] Server rejected:", verifyText);
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  const requestId = data.m_payment_id;
  const status    = data.payment_status;

  if (status === "COMPLETE" && requestId) {
    const licenseRequest = await db.licenseRequest.findUnique({
      where:   { id: requestId },
      include: { twin: { select: { name: true } } },
    });

    await db.licenseRequest.update({
      where: { id: requestId },
      data:  { paidAt: new Date() },
    });
    console.log(`[PayFast Notify] Request ${requestId} marked as paid`);

    if (licenseRequest) {
      sendPaymentConfirmationEmail({
        buyerEmail: licenseRequest.buyerEmail,
        buyerName:  licenseRequest.buyerName,
        twinName:   licenseRequest.twin.name ?? "the twin",
        usageType:  licenseRequest.usageType,
        amount:     licenseRequest.agreedPrice,
      }).catch(console.error);
    }
  }

  return NextResponse.json({ ok: true });
}
