import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sendLicenseRequestStatusEmail, sendTalentRequestDecisionEmail } from "@/lib/email";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where:  { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id }                              = await params;
  const { status, responseNote, agreedPrice } = (await req.json()) as {
    status:       "approved" | "rejected";
    responseNote?: string;
    agreedPrice?:  number;
  };

  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const licenseRequest = await db.licenseRequest.findUnique({
    where:   { id },
    include: {
      twin: {
        select: {
          name: true,
          user: { select: { email: true, name: true } },
        },
      },
    },
  });
  if (!licenseRequest) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.licenseRequest.update({
    where: { id },
    data: {
      status,
      responseNote: responseNote?.trim() || null,
      respondedAt:  new Date(),
      ...(status === "approved" && typeof agreedPrice === "number"
        ? { agreedPrice }
        : {}),
    },
  });

  sendLicenseRequestStatusEmail({
    buyerEmail:   licenseRequest.buyerEmail,
    buyerName:    licenseRequest.buyerName,
    twinName:     licenseRequest.twin.name ?? "the twin",
    usageType:    licenseRequest.usageType,
    status,
    responseNote: responseNote?.trim() || undefined,
  }).catch(console.error);

  sendTalentRequestDecisionEmail({
    talentEmail:  licenseRequest.twin.user.email,
    talentName:   licenseRequest.twin.user.name ?? "there",
    buyerName:    licenseRequest.buyerName,
    company:      licenseRequest.company,
    usageType:    licenseRequest.usageType,
    status,
    responseNote: responseNote?.trim() || undefined,
  }).catch(console.error);

  return NextResponse.json({ request: updated });
}
