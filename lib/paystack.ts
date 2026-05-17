import crypto from "crypto";

export const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY ?? "";
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export interface PaystackInitResult {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export async function initializeTransaction(opts: {
  email:     string;
  amount:    number; // in cents (USD: $29 = 2900)
  reference: string;
  metadata:  Record<string, unknown>;
  currency?: string;
  callback_url?: string;
  plan?: string;
}): Promise<PaystackInitResult> {
  const body: Record<string, unknown> = {
    email:        opts.email,
    amount:       opts.amount,
    reference:    opts.reference,
    metadata:     opts.metadata,
    currency:     opts.currency ?? "USD",
    callback_url: opts.callback_url ?? `${APP_URL}/settings`,
  };
  if (opts.plan) body.plan = opts.plan;

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json() as { status: boolean; data: PaystackInitResult };
  if (!json.status) throw new Error("Paystack initialization failed");
  return json.data;
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");
  return hash === signature;
}

export function generateReference(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
