import { auth } from "@/auth";
import { db } from "@/lib/db";
import crypto from "crypto";
import { NextResponse } from "next/server";

const MERCHANT_ID  = process.env.PAYFAST_MERCHANT_ID  ?? "10000100";
const MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY ?? "46f0cd694581a";
const PASSPHRASE   = process.env.PAYFAST_PASSPHRASE   ?? "";
const SANDBOX      = process.env.PAYFAST_SANDBOX !== "false";
const PAYFAST_URL  = SANDBOX
  ? "https://sandbox.payfast.co.za/eng/process"
  : "https://www.payfast.co.za/eng/process";

const PACKS: Record<string, { credits: number; amount: string; label: string }> = {
  "100": { credits: 100, amount: "49.00",  label: "100 Voice Credits"  },
  "300": { credits: 300, amount: "129.00", label: "300 Voice Credits"  },
  "500": { credits: 500, amount: "199.00", label: "500 Voice Credits"  },
};

function signature(data: Record<string, string>): string {
  const qs = Object.entries(data)
    .filter(([, v]) => v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, "+")}`)
    .join("&");
  const toHash = PASSPHRASE ? `${qs}&passphrase=${encodeURIComponent(PASSPHRASE)}` : qs;
  return crypto.createHash("md5").update(toHash).digest("hex");
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pack } = await req.json() as { pack: string };
  const selected = PACKS[pack];
  if (!selected) return NextResponse.json({ error: "Invalid pack" }, { status: 400 });

  const user = await db.user.findUnique({
    where:  { id: session.user.id },
    select: { email: true, name: true, plan: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.plan !== "pro") return NextResponse.json({ error: "Voice credits require a Pro plan" }, { status: 403 });

  const base = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000";

  const data: Record<string, string> = {
    merchant_id:      MERCHANT_ID,
    merchant_key:     MERCHANT_KEY,
    return_url:       `${base}/settings?topup=success`,
    cancel_url:       `${base}/settings?topup=cancelled`,
    notify_url:       `${base}/api/payfast/itn`,
    email_address:    user.email,
    m_payment_id:     session.user.id,
    amount:           selected.amount,
    item_name:        `OwnMyTwin ${selected.label}`,
    item_description: `${selected.credits} TTS voice credits added to your account`,
    custom_str1:      `tts_topup_${pack}`,
  };

  data.signature = signature(data);

  return NextResponse.json({ url: PAYFAST_URL, data });
}
