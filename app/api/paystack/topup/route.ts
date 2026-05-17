import { auth } from "@/auth";
import { db } from "@/lib/db";
import { initializeTransaction, generateReference } from "@/lib/paystack";
import { NextResponse } from "next/server";

const PACKS: Record<string, { credits: number; amount: number; label: string }> = {
  "100": { credits: 100, amount: 300,  label: "100 Voice Credits" }, // $3.00
  "300": { credits: 300, amount: 700,  label: "300 Voice Credits" }, // $7.00
  "500": { credits: 500, amount: 1100, label: "500 Voice Credits" }, // $11.00
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pack } = await req.json() as { pack: string };
  const selected = PACKS[pack];
  if (!selected) return NextResponse.json({ error: "Invalid pack" }, { status: 400 });

  const user = await db.user.findUnique({
    where:  { id: session.user.id },
    select: { email: true, plan: true },
  });
  if (!user)              return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.plan !== "pro") return NextResponse.json({ error: "Voice credits require a Pro plan" }, { status: 403 });

  const reference = generateReference("tts");

  const data = await initializeTransaction({
    email:     user.email,
    amount:    selected.amount,
    reference,
    currency:  "USD",
    callback_url: `${process.env.APP_URL ?? "http://localhost:3000"}/settings?topup=success`,
    metadata: {
      userId:  session.user.id,
      type:    "tts_topup",
      pack,
      credits: selected.credits,
      cancel_action: "hide",
    },
  });

  return NextResponse.json({ authorization_url: data.authorization_url });
}
