import { auth } from "@/auth";
import { db } from "@/lib/db";
import { uploadToR2 } from "@/lib/r2";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const photos = await db.likenessPhoto.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  return Response.json({ photos });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file  = formData.get("photo") as File | null;
  const label = (formData.get("label") as string | null) ?? null;

  if (!file) return Response.json({ error: "No file provided" }, { status: 400 });

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return Response.json({ error: "Only JPEG, PNG, and WebP images are allowed" }, { status: 400 });
  }

  const ext    = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const key    = `photos/${session.user.id}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const url    = await uploadToR2(key, buffer, file.type);

  const photo = await db.likenessPhoto.create({
    data: { userId: session.user.id, url, label },
  });

  return Response.json({ photo });
}
