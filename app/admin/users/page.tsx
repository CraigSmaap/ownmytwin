import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { UsersList } from "./users-list";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, role: true, image: true, plan: true,
      createdAt: true, emailVerified: true, onboardingComplete: true,
      _count: { select: { photos: true, voiceRecordings: true } },
      twin: {
        select: {
          name: true, systemPrompt: true,
          _count: { select: { memories: true, messages: true } },
        },
      },
    },
  });

  const serialized = users.map((u) => ({
    ...u,
    createdAt:     u.createdAt.toISOString(),
    emailVerified: u.emailVerified?.toISOString() ?? null,
  }));

  const proCount  = users.filter((u) => u.plan === "pro").length;
  const freeCount = users.filter((u) => u.plan === "free").length;

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">All Users</h1>
          <p className="text-slate-400 text-sm mt-1">
            {users.length} total · {proCount} Pro · {freeCount} Free
          </p>
        </div>
        <div className="flex items-center gap-2 bg-green-900/30 border border-green-800/50 text-green-400 text-xs font-semibold px-4 py-2.5 rounded-xl">
          ⭐ {proCount} Pro accounts
        </div>
      </div>

      <UsersList initialUsers={serialized} />
    </div>
  );
}
