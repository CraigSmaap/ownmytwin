import { auth } from "@/auth";
import { db } from "@/lib/db";
import { buildPayfastParams, PAYFAST_URL } from "@/lib/payfast";
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

  const pfParams = buildPayfastParams({
    requestId:  request.id,
    amount:     request.agreedPrice,
    itemName:   `${request.twin.name ?? "Twin"} – ${request.usageType}`,
    buyerEmail: user!.email,
    buyerName:  user!.name ?? request.buyerName,
  });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 text-sm">Redirecting to payment…</p>
      <form id="pf-form" method="POST" action={PAYFAST_URL} className="hidden">
        {Object.entries(pfParams).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
      </form>
      <script
        dangerouslySetInnerHTML={{
          __html: "document.getElementById('pf-form').submit();",
        }}
      />
    </div>
  );
}
