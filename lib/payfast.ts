import crypto from "crypto";

const SANDBOX     = process.env.PAYFAST_SANDBOX === "true";
const MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID ?? "";
const MERCHANT_KEY= process.env.PAYFAST_MERCHANT_KEY ?? "";
const PASSPHRASE  = process.env.PAYFAST_PASSPHRASE ?? "";
const APP_URL     = process.env.APP_URL ?? "http://localhost:3000";

export const PAYFAST_URL = SANDBOX
  ? "https://sandbox.payfast.co.za/eng/process"
  : "https://www.payfast.co.za/eng/process";

export function buildPayfastParams(opts: {
  requestId:   string;
  amount:      number;
  itemName:    string;
  buyerEmail:  string;
  buyerName:   string;
}): Record<string, string> {
  const { requestId, amount, itemName, buyerEmail, buyerName } = opts;

  const params: Record<string, string> = {
    merchant_id:   MERCHANT_ID,
    merchant_key:  MERCHANT_KEY,
    return_url:    `${APP_URL}/my-requests?paid=true`,
    cancel_url:    `${APP_URL}/my-requests?cancelled=true`,
    notify_url:    `${APP_URL}/api/payfast/notify`,
    email_address: buyerEmail,
    name_first:    buyerName.split(" ")[0] ?? buyerName,
    name_last:     buyerName.split(" ").slice(1).join(" ") || "-",
    m_payment_id:  requestId,
    amount:        amount.toFixed(2),
    item_name:     itemName.slice(0, 100),
  };

  params.signature = generateSignature(params);
  return params;
}

function generateSignature(params: Record<string, string>): string {
  const entries = Object.entries(params)
    .filter(([, v]) => v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, "+")}`)
    .join("&");

  const str = PASSPHRASE
    ? `${entries}&passphrase=${encodeURIComponent(PASSPHRASE).replace(/%20/g, "+")}`
    : entries;

  return crypto.createHash("md5").update(str).digest("hex");
}

export function verifyPayfastSignature(params: Record<string, string>): boolean {
  const { signature, ...rest } = params;
  const expected = generateSignature(rest);
  return signature === expected;
}
