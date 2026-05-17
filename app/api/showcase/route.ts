import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { uploadToR2 } from "@/lib/r2";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const twinId = searchParams.get("twinId") ?? undefined;
  const take   = 12;

  const posts = await db.showcasePost.findMany({
    where:   { ...(twinId ? { twinId } : {}) },
    orderBy: { createdAt: "desc" },
    take:    take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id:            true,
      title:         true,
      description:   true,
      mediaType:     true,
      mediaUrl:      true,
      isAiGenerated: true,
      isGuidedPost:  true,
      createdAt:     true,
      buyer: { select: { name: true, image: true } },
      twin:  {
        select: {
          id:   true,
          name: true,
          user: { select: { publicSlug: true, verificationStatus: true } },
        },
      },
      _count: { select: { comments: true, likes: true } },
    },
  });

  const hasMore    = posts.length > take;
  const items      = hasMore ? posts.slice(0, take) : posts;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ posts: items, nextCursor });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = req.headers.get("content-type") ?? "";

  let title: string, description: string, mediaType: string, twinId: string;
  let embedUrl: string | null = null;
  let licenseRequestId: string | null = null;
  let isGuidedPost = false;
  let image: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form       = await req.formData();
    title            = (form.get("title")            as string)?.trim();
    description      = (form.get("description")      as string)?.trim();
    mediaType        = (form.get("mediaType")        as string) || "text";
    embedUrl         = (form.get("embedUrl")         as string)?.trim() || null;
    twinId           = (form.get("twinId")           as string)?.trim();
    licenseRequestId = (form.get("licenseRequestId") as string)?.trim() || null;
    isGuidedPost     = form.get("isGuidedPost") === "true";
    image            = form.get("image") as File | null;
  } else {
    const body       = await req.json();
    title            = body.title?.trim();
    description      = body.description?.trim();
    mediaType        = body.mediaType || "text";
    embedUrl         = body.mediaUrl?.trim() || body.embedUrl?.trim() || null;
    twinId           = body.twinId?.trim();
    licenseRequestId = body.licenseRequestId?.trim() || null;
    isGuidedPost     = body.isGuidedPost === true;
  }

  if (!title || !description || !twinId) {
    return NextResponse.json({ error: "Title, description, and twin are required" }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where:  { id: session.user.id },
    select: { accountType: true },
  });

  if (isGuidedPost) {
    // Guided posts: talent must own the twin
    const ownedTwin = await db.twin.findUnique({
      where:  { id: twinId, userId: session.user.id },
      select: { id: true },
    });
    if (!ownedTwin) return NextResponse.json({ error: "Twin not found" }, { status: 404 });
  } else {
    // Regular posts: buyers only
    if (user?.accountType !== "buyer") {
      return NextResponse.json({ error: "Only buyers can post to the showcase" }, { status: 403 });
    }
    const twin = await db.twin.findUnique({ where: { id: twinId }, select: { id: true } });
    if (!twin) return NextResponse.json({ error: "Twin not found" }, { status: 404 });
  }

  if (licenseRequestId) {
    const existing = await db.showcasePost.findUnique({ where: { licenseRequestId } });
    if (existing) return NextResponse.json({ error: "Already posted for this license" }, { status: 400 });
  }

  let mediaUrl: string | null = null;

  if (mediaType === "image" && image) {
    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be under 10 MB" }, { status: 400 });
    }
    const ext    = image.type.includes("png") ? "png" : image.type.includes("webp") ? "webp" : "jpg";
    const ts     = Date.now();
    const key    = `showcase/${session.user.id}-${ts}.${ext}`;
    const buffer = Buffer.from(await image.arrayBuffer());
    mediaUrl     = await uploadToR2(key, buffer, image.type);

    // Also save as likeness photo so the AI twin learns from it
    if (isGuidedPost) {
      await db.likenessPhoto.create({
        data: { userId: session.user.id, url: mediaUrl, label: `Showcase photo — ${new Date().toLocaleDateString("en-GB")}` },
      });
    }
  } else if (mediaType === "embed" && embedUrl) {
    mediaUrl = embedUrl;
  }

  const post = await db.showcasePost.create({
    data: {
      buyerId:         session.user.id,
      twinId,
      licenseRequestId: licenseRequestId || null,
      title,
      description,
      mediaType,
      mediaUrl,
      isGuidedPost,
    },
    select: { id: true },
  });

  return NextResponse.json({ post });
}
