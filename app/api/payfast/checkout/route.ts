import { auth } from "@/auth";
import { db } from "@/lib/db";
import crypto from "crypto";
import { NextResponse } from "next/server";

const MERCHANT_ID  = process.env.PAYFAST_MERCHANT_ID  ?? "10000100";
const MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY ?? "46f0cd694581a";
const PASSPHRASE   = process.env.PAYFAST_PASSPHRASE   ?? "";
const SANDBOX      = process.env.PAYFAST_SANDBOX !== "false"; // default sandbox in dev
const PAYFAST_URL  = SANDBOX
  ? "https://sandbox.payfast.co.za/eng/process"
  : "https://www.payfast.co.za/eng/process";

function signature(data: Record<string, string>): string {
  const qs = Object.entries(data)
    .filter(([, v]) => v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, "+")}`)
    .join("&");
  const toHash = PASSPHRASE ? `${qs}&passphrase=${encodeURIComponent(PASSPHRASE)}` : qs;
  return crypto.createHash("md5").update(toHash).digest("hex");
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where:  { id: session.user.id },
    select: { email: true, name: true, plan: true },
  });
  if (!user)              return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.plan === "pro") return NextResponse.json({ error: "Already on Pro plan" }, { status: 400 });

  const base    = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000";
  const today   = new Date().toISOString().split("T")[0];

  const data: Record<string, string> = {
    merchant_id:      MERCHANT_ID,
    merchant_key:     MERCHANT_KEY,
    return_url:       `${base}/settings?upgrade=success`,
    cancel_url:       `${base}/settings?upgrade=cancelled`,
    notify_url:       `${base}/api/payfast/itn`,
    email_address:    user.email,
    m_payment_id:     session.user.id,
    amount:           "165.00",
    item_name:        "OwnMyTwin Pro Monthly",
    item_description: "Marketplace listing, earnings and unlimited voice replies",
    subscription_type: "1",
    billing_date:     today,
    recurring_amount: "165.00",
    frequency:        "3",
    cycles:           "0",
  };

  data.signature = signature(data);

  return NextResponse.json({ url: PAYFAST_URL, data });
}
