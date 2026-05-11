import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const twin = await db.twin.findUnique({ where: { userId: session.user.id } });
  if (!twin) return NextResponse.json({ memories: [] });

  const memories = await db.memory.findMany({
    where: { twinId: twin.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ memories });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, content, category, visibility, importance } = (await req.json()) as {
    title: string;
    content: string;
    category?: string;
    visibility?: string;
    importance?: string;
  };

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
  }

  let twin = await db.twin.findUnique({ where: { userId: session.user.id } });
  if (!twin) {
    twin = await db.twin.create({ data: { userId: session.user.id } });
  }

  const memory = await db.memory.create({
    data: {
      twinId: twin.id,
      title: title.trim(),
      content: content.trim(),
      category,
      visibility: visibility ?? "twin_only",
      importance: importance ?? "medium",
    },
  });

  return NextResponse.json({ memory }, { status: 201 });
}
