import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, createdAt: true,
      twin: {
        select: {
          name: true, personality: true, writingStyle: true, systemPrompt: true, createdAt: true,
          memories: { select: { title: true, content: true, category: true, createdAt: true } },
          messages: { select: { role: true, content: true, platform: true, createdAt: true }, orderBy: { createdAt: "asc" } },
        },
      },
      photos: { select: { url: true, label: true, createdAt: true } },
    },
  });

  const exportData = {
    exportedAt: new Date().toISOString(),
    platform: "OwnMyTwin",
    notice: "This is the complete export of your AI Twin data. You own this data entirely.",
    account: { id: user?.id, name: user?.name, email: user?.email, createdAt: user?.createdAt },
    twin: user?.twin ?? null,
    likenessPhotos: user?.photos ?? [],
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="aitwin-export-${Date.now()}.json"`,
    },
  });
}
