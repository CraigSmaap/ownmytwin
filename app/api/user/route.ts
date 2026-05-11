import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where:  { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, onboardingComplete: true, createdAt: true, publicSlug: true, accountType: true, buyerProfile: true, plan: true, planExpiresAt: true, role: true },
  });

  return Response.json({ user });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, onboardingComplete, publicSlug, accountType, buyerProfile, dateOfBirth, popiConsent } = body;

  let cleanSlug: string | undefined;
  if (publicSlug !== undefined) {
    cleanSlug = (publicSlug as string)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 50);

    if (!cleanSlug) return Response.json({ error: "Invalid slug" }, { status: 400 });

    const conflict = await db.user.findFirst({
      where: { publicSlug: cleanSlug, NOT: { id: session.user.id } },
    });
    if (conflict) return Response.json({ error: "That URL is already taken" }, { status: 409 });
  }

  const user = await db.user.update({
    where: { id: session.user.id },
    data: {
      ...(name               !== undefined && { name }),
      ...(onboardingComplete !== undefined && { onboardingComplete }),
      ...(cleanSlug          !== undefined && { publicSlug: cleanSlug }),
      ...(accountType        !== undefined && { accountType }),
      ...(buyerProfile       !== undefined && { buyerProfile }),
      ...(dateOfBirth        !== undefined && { dateOfBirth: new Date(dateOfBirth) }),
      ...(popiConsent        === true       && { popiConsent: true, popiConsentAt: new Date() }),
    },
    select: { id: true, name: true, email: true, onboardingComplete: true, publicSlug: true, accountType: true },
  });

  return Response.json({ user });
}
