import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where:  { id: session.user.id },
    select: {
      publicSlug: true,
      twin:       { select: { licensePermissions: true } },
    },
  });

  return NextResponse.json({
    permissions: user?.twin?.licensePermissions ?? {},
    publicSlug:  user?.publicSlug ?? null,
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { permissions } = await req.json();

  const twin = await db.twin.upsert({
    where:  { userId: session.user.id },
    update: { licensePermissions: permissions },
    create: { userId: session.user.id, licensePermissions: permissions },
    select: { licensePermissions: true },
  });

  return NextResponse.json({ permissions: twin.licensePermissions });
}
