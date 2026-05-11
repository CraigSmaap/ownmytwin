import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "your-resend-api-key"
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";
const FROM    = process.env.EMAIL_FROM ?? "OwnMyTwin <noreply@ownmytwin.com>";

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${APP_URL}/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;

  if (!resend) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`[DEV] Verification email for: ${email}`);
    console.log(`[DEV] Click to verify:\n${url}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    return;
  }

  await resend.emails.send({
    from:    FROM,
    to:      email,
    subject: "Verify your OwnMyTwin account",
    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:480px;margin:40px auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
            <div style="background:#4f46e5;padding:32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">OwnMyTwin</h1>
              <p style="color:#a5b4fc;margin:6px 0 0;font-size:14px;">Your complete digital self</p>
            </div>
            <div style="padding:36px;">
              <h2 style="color:#0f172a;font-size:20px;margin:0 0 12px;">Verify your email</h2>
              <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 28px;">
                Click the button below to verify your email and activate your OwnMyTwin account.
                This link expires in 24 hours.
              </p>
              <a href="${url}" style="display:block;background:#4f46e5;color:#fff;text-align:center;padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">
                Verify My Email →
              </a>
              <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;line-height:1.5;">
                If you didn't create an OwnMyTwin account, you can safely ignore this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendLicenseRequestStatusEmail(opts: {
  buyerEmail:   string;
  buyerName:    string;
  twinName:     string;
  usageType:    string;
  status:       "approved" | "rejected";
  responseNote?: string;
}) {
  const { buyerEmail, buyerName, twinName, usageType, status, responseNote } = opts;
  const usageLabel    = LICENSE_LABELS_INTERNAL[usageType] ?? usageType;
  const isApproved    = status === "approved";
  const subject       = isApproved
    ? `Your license request for ${twinName} has been approved!`
    : `Update on your license request for ${twinName}`;
  const dashboardUrl  = `${APP_URL}/dashboard`;

  if (!resend) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`[DEV] License request ${status} email for: ${buyerEmail}`);
    console.log(`[DEV] Twin: ${twinName} | Usage: ${usageLabel}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    return;
  }

  await resend.emails.send({
    from:    FROM,
    to:      buyerEmail,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:520px;margin:40px auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
            <div style="background:${isApproved ? "#16a34a" : "#4f46e5"};padding:28px 32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">OwnMyTwin</h1>
            </div>
            <div style="padding:32px;">
              <p style="color:#64748b;font-size:14px;margin:0 0 4px;">Hi ${buyerName},</p>
              <h2 style="color:#0f172a;font-size:22px;font-weight:700;margin:0 0 16px;">
                ${isApproved ? "Your request was approved! 🎉" : "Request update"}
              </h2>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:0 0 24px;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;padding:4px 0;">Twin</td>
                    <td style="color:#0f172a;font-size:14px;font-weight:600;padding:4px 0;text-align:right;">${twinName}</td>
                  </tr>
                  <tr>
                    <td style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;padding:8px 0 4px;">Usage</td>
                    <td style="color:#0f172a;font-size:14px;padding:8px 0 4px;text-align:right;">${usageLabel}</td>
                  </tr>
                  <tr>
                    <td style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;padding:8px 0 4px;">Status</td>
                    <td style="color:${isApproved ? "#16a34a" : "#64748b"};font-size:14px;font-weight:700;padding:8px 0 4px;text-align:right;">${isApproved ? "Approved" : "Declined"}</td>
                  </tr>
                </table>
              </div>
              ${responseNote ? `
              <div style="background:#f8fafc;border-left:3px solid ${isApproved ? "#16a34a" : "#6366f1"};border-radius:0 8px 8px 0;padding:12px 16px;margin:0 0 20px;">
                <p style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;margin:0 0 6px;">Message from the team</p>
                <p style="color:#334155;font-size:14px;line-height:1.6;margin:0;">${responseNote.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
              </div>` : ""}
              <p style="color:#334155;font-size:14px;line-height:1.7;margin:0 0 24px;">
                ${isApproved
                  ? "Your license request has been approved. Log in to your dashboard to view the details and next steps."
                  : "Unfortunately this request has been declined. You can browse the marketplace to find other AI twins available for licensing."}
              </p>
              <a href="${dashboardUrl}" style="display:block;background:#4f46e5;color:#fff;text-align:center;padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">
                View My Requests →
              </a>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

const LICENSE_LABELS_INTERNAL: Record<string, string> = {
  voice_only:         "Voice Only",
  voiceover:          "Voiceover",
  public_speaking:    "Public Speaking",
  face_avatar:        "Face / Avatar",
  full_likeness:      "Full Likeness",
  social_media:       "Social Media",
  ads:                "Advertising",
  ai_presenter:       "AI Presenter",
  virtual_influencer: "Virtual Influencer",
  educational:        "Educational",
  corporate_training: "Corporate Training",
  customer_service:   "Customer Service",
  film_tv:            "Film / TV",
  game_npc:           "Game NPC",
  motion_style:       "Motion Style",
};

export async function sendLicenseRequestNotification(opts: {
  talentEmail: string;
  talentName:  string;
  buyerName:   string;
  company:     string | null;
  usageType:   string;
  message:     string;
}) {
  const { talentEmail, talentName, buyerName, company, usageType, message } = opts;
  const usageLabel = LICENSE_LABELS_INTERNAL[usageType] ?? usageType;
  const requestsUrl = `${APP_URL}/requests`;

  if (!resend) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`[DEV] New license request for: ${talentEmail}`);
    console.log(`[DEV] From: ${buyerName}${company ? ` (${company})` : ""}`);
    console.log(`[DEV] Usage: ${usageLabel}`);
    console.log(`[DEV] Review at: ${requestsUrl}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    return;
  }

  await resend.emails.send({
    from:    FROM,
    to:      talentEmail,
    subject: `New license request from ${buyerName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:520px;margin:40px auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
            <div style="background:#4f46e5;padding:28px 32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">OwnMyTwin</h1>
            </div>
            <div style="padding:32px;">
              <p style="color:#64748b;font-size:14px;margin:0 0 4px;">Hi ${talentName},</p>
              <h2 style="color:#0f172a;font-size:22px;font-weight:700;margin:0 0 20px;">You have a new license request</h2>

              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:0 0 24px;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;padding:4px 0;">From</td>
                    <td style="color:#0f172a;font-size:14px;font-weight:600;padding:4px 0;text-align:right;">${buyerName}${company ? `<br><span style="color:#64748b;font-weight:400;">${company}</span>` : ""}</td>
                  </tr>
                  <tr>
                    <td style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;padding:8px 0 4px;">Usage</td>
                    <td style="color:#0f172a;font-size:14px;padding:8px 0 4px;text-align:right;">${usageLabel}</td>
                  </tr>
                </table>
              </div>

              <div style="margin:0 0 24px;">
                <p style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;margin:0 0 8px;">Message</p>
                <p style="color:#334155;font-size:14px;line-height:1.7;margin:0;background:#f8fafc;border-left:3px solid #6366f1;padding:12px 16px;border-radius:0 8px 8px 0;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
              </div>

              <a href="${requestsUrl}" style="display:block;background:#4f46e5;color:#fff;text-align:center;padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">
                View Request →
              </a>

              <p style="color:#94a3b8;font-size:12px;margin:20px 0 0;text-align:center;line-height:1.5;">
                The OwnMyTwin team will review this request and be in touch before any approval.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendBuyerRequestConfirmationEmail(opts: {
  buyerEmail:  string;
  buyerName:   string;
  twinName:    string;
  usageType:   string;
}) {
  const { buyerEmail, buyerName, twinName, usageType } = opts;
  const usageLabel = LICENSE_LABELS_INTERNAL[usageType] ?? usageType;

  if (!resend) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`[DEV] Buyer confirmation email for: ${buyerEmail}`);
    console.log(`[DEV] Twin: ${twinName} | Usage: ${usageLabel}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    return;
  }

  await resend.emails.send({
    from:    FROM,
    to:      buyerEmail,
    subject: `We've received your request for ${twinName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:520px;margin:40px auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
            <div style="background:#4f46e5;padding:28px 32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">OwnMyTwin</h1>
            </div>
            <div style="padding:32px;">
              <p style="color:#64748b;font-size:14px;margin:0 0 4px;">Hi ${buyerName},</p>
              <h2 style="color:#0f172a;font-size:22px;font-weight:700;margin:0 0 16px;">Request received!</h2>
              <p style="color:#334155;font-size:14px;line-height:1.7;margin:0 0 24px;">
                We've received your license request for <strong>${twinName}</strong>. The OwnMyTwin team will review it and be in touch shortly.
              </p>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:0 0 24px;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;padding:4px 0;">Twin</td>
                    <td style="color:#0f172a;font-size:14px;font-weight:600;padding:4px 0;text-align:right;">${twinName}</td>
                  </tr>
                  <tr>
                    <td style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;padding:8px 0 4px;">Usage</td>
                    <td style="color:#0f172a;font-size:14px;padding:8px 0 4px;text-align:right;">${usageLabel}</td>
                  </tr>
                  <tr>
                    <td style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;padding:8px 0 4px;">Status</td>
                    <td style="color:#d97706;font-size:14px;font-weight:700;padding:8px 0 4px;text-align:right;">Under Review</td>
                  </tr>
                </table>
              </div>
              <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">
                You'll receive another email once a decision has been made.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendPaymentConfirmationEmail(opts: {
  buyerEmail:  string;
  buyerName:   string;
  twinName:    string;
  usageType:   string;
  amount:      number;
}) {
  const { buyerEmail, buyerName, twinName, usageType, amount } = opts;
  const usageLabel    = LICENSE_LABELS_INTERNAL[usageType] ?? usageType;
  const requestsUrl   = `${APP_URL}/my-requests`;
  const amountFmt     = `R${amount.toLocaleString("en-ZA")}`;

  if (!resend) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`[DEV] Payment confirmation for: ${buyerEmail}`);
    console.log(`[DEV] Twin: ${twinName} | Usage: ${usageLabel} | Amount: ${amountFmt}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    return;
  }

  await resend.emails.send({
    from:    FROM,
    to:      buyerEmail,
    subject: `Payment confirmed — ${twinName} license`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:520px;margin:40px auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
            <div style="background:#16a34a;padding:28px 32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">OwnMyTwin</h1>
            </div>
            <div style="padding:32px;">
              <p style="color:#64748b;font-size:14px;margin:0 0 4px;">Hi ${buyerName},</p>
              <h2 style="color:#0f172a;font-size:22px;font-weight:700;margin:0 0 16px;">Payment received! ✓</h2>
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin:0 0 24px;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;padding:4px 0;">Twin</td>
                    <td style="color:#0f172a;font-size:14px;font-weight:600;padding:4px 0;text-align:right;">${twinName}</td>
                  </tr>
                  <tr>
                    <td style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;padding:8px 0 4px;">License</td>
                    <td style="color:#0f172a;font-size:14px;padding:8px 0 4px;text-align:right;">${usageLabel}</td>
                  </tr>
                  <tr>
                    <td style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;padding:8px 0 4px;">Amount Paid</td>
                    <td style="color:#16a34a;font-size:16px;font-weight:700;padding:8px 0 4px;text-align:right;">${amountFmt}</td>
                  </tr>
                </table>
              </div>
              <p style="color:#334155;font-size:14px;line-height:1.7;margin:0 0 24px;">
                Your license is now active. The OwnMyTwin team will be in touch with next steps for your project.
              </p>
              <a href="${requestsUrl}" style="display:block;background:#4f46e5;color:#fff;text-align:center;padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">
                View My Requests →
              </a>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  if (!resend) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`[DEV] Password reset for: ${email}`);
    console.log(`[DEV] Reset link:\n${url}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    return;
  }

  await resend.emails.send({
    from:    FROM,
    to:      email,
    subject: "Reset your OwnMyTwin password",
    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:480px;margin:40px auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
            <div style="background:#4f46e5;padding:32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">OwnMyTwin</h1>
              <p style="color:#a5b4fc;margin:6px 0 0;font-size:14px;">Your complete digital self</p>
            </div>
            <div style="padding:36px;">
              <h2 style="color:#0f172a;font-size:20px;margin:0 0 12px;">Reset your password</h2>
              <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 28px;">
                Click the button below to set a new password. This link expires in 1 hour.
                If you didn't request this, you can safely ignore this email.
              </p>
              <a href="${url}" style="display:block;background:#4f46e5;color:#fff;text-align:center;padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">
                Reset My Password →
              </a>
              <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;line-height:1.5;">
                This link will expire in 1 hour for your security.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendAdminNewRequestEmail(opts: {
  buyerName:  string;
  buyerEmail: string;
  company:    string | null;
  twinName:   string;
  usageType:  string;
  message:    string;
}) {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "hiveopps.core@gmail.com";
  const { buyerName, buyerEmail, company, twinName, usageType, message } = opts;
  const usageLabel  = LICENSE_LABELS_INTERNAL[usageType] ?? usageType;
  const adminUrl    = `${APP_URL}/admin/requests`;

  if (!resend) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`[DEV] Admin new request: ${buyerName} → ${twinName} (${usageLabel})`);
    console.log(`[DEV] Review at: ${adminUrl}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    return;
  }

  await resend.emails.send({
    from:    FROM,
    to:      ADMIN_EMAIL,
    subject: `[Action Required] New license request — ${buyerName} → ${twinName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:520px;margin:40px auto;background:#1e293b;border:1px solid #334155;border-radius:16px;overflow:hidden;">
            <div style="background:#4f46e5;padding:20px 32px;display:flex;align-items:center;gap:12px;">
              <span style="background:#ffffff22;border-radius:8px;padding:4px 10px;color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Admin Alert</span>
              <h1 style="color:#fff;margin:0;font-size:18px;font-weight:700;">New License Request</h1>
            </div>
            <div style="padding:28px 32px;">
              <div style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:20px;margin:0 0 24px;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;padding:4px 0;">From</td>
                    <td style="color:#f1f5f9;font-size:14px;font-weight:600;padding:4px 0;text-align:right;">${buyerName}${company ? `<br><span style="color:#94a3b8;font-weight:400;">${company}</span>` : ""}</td>
                  </tr>
                  <tr>
                    <td style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;padding:8px 0 4px;">Email</td>
                    <td style="color:#94a3b8;font-size:13px;padding:8px 0 4px;text-align:right;">${buyerEmail}</td>
                  </tr>
                  <tr>
                    <td style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;padding:8px 0 4px;">Twin</td>
                    <td style="color:#f1f5f9;font-size:14px;font-weight:600;padding:8px 0 4px;text-align:right;">${twinName}</td>
                  </tr>
                  <tr>
                    <td style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;padding:8px 0 4px;">Usage</td>
                    <td style="color:#f1f5f9;font-size:14px;padding:8px 0 4px;text-align:right;">${usageLabel}</td>
                  </tr>
                </table>
              </div>
              <div style="margin:0 0 24px;">
                <p style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;margin:0 0 8px;">Message</p>
                <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0;background:#0f172a;border-left:3px solid #6366f1;padding:12px 16px;border-radius:0 8px 8px 0;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
              </div>
              <a href="${adminUrl}" style="display:block;background:#4f46e5;color:#fff;text-align:center;padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">
                Review in Admin →
              </a>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendTalentRequestDecisionEmail(opts: {
  talentEmail:  string;
  talentName:   string;
  buyerName:    string;
  company:      string | null;
  usageType:    string;
  status:       "approved" | "rejected";
  responseNote?: string;
}) {
  const { talentEmail, talentName, buyerName, company, usageType, status, responseNote } = opts;
  const usageLabel = LICENSE_LABELS_INTERNAL[usageType] ?? usageType;
  const isApproved = status === "approved";
  const requestsUrl = `${APP_URL}/requests`;

  if (!resend) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`[DEV] Talent decision email for: ${talentEmail}`);
    console.log(`[DEV] Request from ${buyerName} — ${status.toUpperCase()}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    return;
  }

  await resend.emails.send({
    from:    FROM,
    to:      talentEmail,
    subject: isApproved
      ? `License request from ${buyerName} was approved`
      : `License request from ${buyerName} was declined`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:520px;margin:40px auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
            <div style="background:${isApproved ? "#16a34a" : "#4f46e5"};padding:28px 32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">OwnMyTwin</h1>
            </div>
            <div style="padding:32px;">
              <p style="color:#64748b;font-size:14px;margin:0 0 4px;">Hi ${talentName},</p>
              <h2 style="color:#0f172a;font-size:22px;font-weight:700;margin:0 0 16px;">
                ${isApproved ? "A license request was approved 🎉" : "A license request was declined"}
              </h2>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:0 0 24px;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;padding:4px 0;">Buyer</td>
                    <td style="color:#0f172a;font-size:14px;font-weight:600;padding:4px 0;text-align:right;">${buyerName}${company ? `<br><span style="color:#64748b;font-weight:400;">${company}</span>` : ""}</td>
                  </tr>
                  <tr>
                    <td style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;padding:8px 0 4px;">Usage</td>
                    <td style="color:#0f172a;font-size:14px;padding:8px 0 4px;text-align:right;">${usageLabel}</td>
                  </tr>
                  <tr>
                    <td style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;padding:8px 0 4px;">Decision</td>
                    <td style="color:${isApproved ? "#16a34a" : "#64748b"};font-size:14px;font-weight:700;padding:8px 0 4px;text-align:right;">${isApproved ? "Approved" : "Declined"}</td>
                  </tr>
                </table>
              </div>
              ${responseNote ? `
              <div style="background:#f8fafc;border-left:3px solid ${isApproved ? "#16a34a" : "#6366f1"};border-radius:0 8px 8px 0;padding:12px 16px;margin:0 0 24px;">
                <p style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;margin:0 0 6px;">Team note</p>
                <p style="color:#334155;font-size:14px;line-height:1.6;margin:0;">${responseNote.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
              </div>` : ""}
              <a href="${requestsUrl}" style="display:block;background:#4f46e5;color:#fff;text-align:center;padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">
                View My Requests →
              </a>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}
