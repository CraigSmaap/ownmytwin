import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { deleteFromR2 } from "@/lib/r2";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const post = await db.showcasePost.findUnique({
    where:  { id },
    select: {
      id:          true,
      title:       true,
      description: true,
      mediaType:    true,
      mediaUrl:     true,
      isAiGenerated: true,
      isGuidedPost:  true,
      createdAt:     true,
      buyer: { select: { id: true, name: true, image: true } },
      twin: {
        select: {
          id:   true,
          name: true,
          bio:  true,
          user: { select: { publicSlug: true, verificationStatus: true } },
        },
      },
      _count: { select: { comments: true, likes: true } },
    },
  });

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ post });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const post   = await db.showcasePost.findUnique({ where: { id } });

  if (!post || post.buyerId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (post.mediaType === "image" && post.mediaUrl) {
    try { await deleteFromR2(post.mediaUrl); } catch { /* already gone */ }
  }

  await db.showcasePost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
