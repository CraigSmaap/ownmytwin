import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  sendLicenseRequestNotification,
  sendBuyerRequestConfirmationEmail,
  sendLicenseRequestStatusEmail,
  sendAdminNewRequestEmail,
} from "@/lib/email";

export async function POST(req: Request) {
  const body = await req.json();
  const { twinId, buyerName, buyerEmail, company, usageType, message } = body as {
    twinId:     string;
    buyerName:  string;
    buyerEmail: string;
    company?:   string;
    usageType:  string;
    message:    string;
  };

  if (!twinId || !buyerName?.trim() || !buyerEmail?.trim() || !usageType || !message?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const twin = await db.twin.findUnique({
    where:   { id: twinId },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  if (!twin) return NextResponse.json({ error: "Twin not found" }, { status: 404 });

  // Link to buyer account if the requester is logged in as a buyer
  const session = await auth();
  const buyerId = session?.user?.id
    && session.user.id !== twin.user.id
    ? session.user.id
    : null;

  // Check if this license type is set to auto-approve
  type LicensePerm = { enabled: boolean; price: number; approval: string; territory: string };
  const perms = (twin.licensePermissions ?? {}) as Record<string, LicensePerm>;
  const isAuto = perms[usageType]?.approval === "auto";

  await db.licenseRequest.create({
    data: {
      twinId,
      buyerId,
      buyerName:   buyerName.trim(),
      buyerEmail:  buyerEmail.trim().toLowerCase(),
      company:     company?.trim() || null,
      usageType,
      message:     message.trim(),
      status:      isAuto ? "approved" : "pending",
      respondedAt: isAuto ? new Date() : null,
    },
  });

  if (isAuto) {
    // Auto-approved — send approval email to buyer immediately
    sendLicenseRequestStatusEmail({
      buyerEmail: buyerEmail.trim().toLowerCase(),
      buyerName:  buyerName.trim(),
      twinName:   twin.name ?? "the twin",
      usageType,
      status:     "approved",
    }).catch(console.error);
  } else {
    // Manual / admin review — notify talent, confirm to buyer
    sendLicenseRequestNotification({
      talentEmail: twin.user.email,
      talentName:  twin.user.name ?? "there",
      buyerName:   buyerName.trim(),
      company:     company?.trim() || null,
      usageType,
      message:     message.trim(),
    }).catch(console.error);

    sendBuyerRequestConfirmationEmail({
      buyerEmail: buyerEmail.trim().toLowerCase(),
      buyerName:  buyerName.trim(),
      twinName:   twin.name ?? "the twin",
      usageType,
    }).catch(console.error);

    sendAdminNewRequestEmail({
      buyerName:  buyerName.trim(),
      buyerEmail: buyerEmail.trim().toLowerCase(),
      company:    company?.trim() || null,
      twinName:   twin.name ?? "Unknown Twin",
      usageType,
      message:    message.trim(),
    }).catch(console.error);
  }

  return NextResponse.json({ success: true, autoApproved: isAuto });
}
