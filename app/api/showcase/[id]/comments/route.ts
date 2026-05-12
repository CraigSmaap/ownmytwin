import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const comments = await db.postComment.findMany({
    where:   { postId: id },
    orderBy: { createdAt: "asc" },
    select: {
      id:        true,
      content:   true,
      createdAt: true,
      author:    { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ comments });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id }    = await params;
  const { content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
  }

  const post = await db.showcasePost.findUnique({ where: { id }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const comment = await db.postComment.create({
    data: {
      postId:   id,
      authorId: session.user.id,
      content:  content.trim(),
    },
    select: {
      id:        true,
      content:   true,
      createdAt: true,
      author:    { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ comment });
}
