import { auth } from "@/auth";
import { db } from "@/lib/db";
import { initializeTransaction, generateReference } from "@/lib/paystack";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where:  { id: session.user.id },
    select: { email: true, plan: true },
  });
  if (!user)              return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.plan === "pro") return NextResponse.json({ error: "Already on Pro plan" }, { status: 400 });

  const reference = generateReference("pro");

  const data = await initializeTransaction({
    email:     user.email,
    amount:    2900, // $29.00 in cents
    reference,
    currency:  "USD",
    callback_url: `${process.env.APP_URL ?? "http://localhost:3000"}/settings?upgrade=success`,
    plan:      process.env.PAYSTACK_PRO_PLAN_CODE,
    metadata: {
      userId:     session.user.id,
      type:       "pro_subscription",
      cancel_action: "hide",
    },
  });

  return NextResponse.json({ authorization_url: data.authorization_url });
}
