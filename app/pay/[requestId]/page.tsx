import { auth } from "@/auth";
import { db } from "@/lib/db";
import { initializeTransaction, generateReference } from "@/lib/paystack";
import { redirect } from "next/navigation";

export default async function PayPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { requestId } = await params;

  const [request, user] = await Promise.all([
    db.licenseRequest.findUnique({
      where:   { id: requestId },
      include: { twin: { select: { name: true } } },
    }),
    db.user.findUnique({
      where:  { id: session.user.id },
      select: { email: true, name: true },
    }),
  ]);

  if (
    !request ||
    request.buyerId !== session.user.id ||
    request.status !== "approved" ||
    request.agreedPrice <= 0 ||
    request.paidAt
  ) {
    redirect("/my-requests");
  }

  const data = await initializeTransaction({
    email:    user!.email,
    amount:   Math.round(request.agreedPrice * 100), // convert to cents
    reference: generateReference("lic"),
    currency: "USD",
    callback_url: `${process.env.APP_URL ?? "http://localhost:3000"}/my-requests?paid=true`,
    metadata: {
      userId:    session.user.id,
      type:      "license_payment",
      requestId: request.id,
      cancel_action: "hide",
    },
  });

  redirect(data.authorization_url);
}
