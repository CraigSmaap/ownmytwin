import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sendLicenseRequestStatusEmail } from "@/lib/email";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body   = await req.json() as { status: "approved" | "rejected"; responseNote?: string; agreedPrice?: number };
  const { status, responseNote, agreedPrice } = body;

  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Verify the request belongs to this user's twin
  const licenseRequest = await db.licenseRequest.findUnique({
    where:   { id },
    include: { twin: { select: { userId: true, name: true } } },
  });

  if (!licenseRequest || licenseRequest.twin.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await db.licenseRequest.update({
    where: { id },
    data:  {
      status,
      respondedAt:  new Date(),
      responseNote: responseNote?.trim() || null,
      ...(status === "approved" && agreedPrice != null ? {
        agreedPrice: typeof agreedPrice === "number" && agreedPrice > 0 ? agreedPrice : undefined,
      } : {}),
    },
  });

  // Notify the buyer — fire and forget
  sendLicenseRequestStatusEmail({
    buyerEmail: licenseRequest.buyerEmail,
    buyerName:  licenseRequest.buyerName,
    twinName:   licenseRequest.twin.name ?? "the twin",
    usageType:  licenseRequest.usageType,
    status,
  }).catch(console.error);

  return NextResponse.json({ request: updated });
}
