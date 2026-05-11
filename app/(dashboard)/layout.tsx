import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/db";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { MobileNav } from "@/components/dashboard/mobile-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { image: true, onboardingComplete: true, emailVerified: true, role: true, accountType: true },
  });

  if (!user?.emailVerified)                          redirect("/verify-email");
  if (!user?.onboardingComplete && user?.role !== "admin") redirect("/onboarding");

  const photoUrl    = user?.image ?? null;
  const userName    = session.user.name ?? session.user.email ?? "";
  const isAdmin     = user?.role === "admin";
  const accountType = user?.accountType ?? "talent";

  // Pending license request count for nav badge
  const twin = await db.twin.findUnique({
    where:  { userId: session.user.id },
    select: { id: true },
  });
  const pendingRequests = twin
    ? await db.licenseRequest.count({ where: { twinId: twin.id, status: "pending" } })
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Mobile top bar + drawer */}
      <MobileNav
        userName={userName}
        photoUrl={photoUrl}
        isAdmin={isAdmin}
        accountType={accountType}
        pendingRequests={pendingRequests}
      />

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col shrink-0">
        <div className="p-4 border-b border-slate-800">
          <div className="bg-white rounded-xl p-3 mb-3">
            <Image
              src="/ownmytwin-logo.png"
              alt="OwnMyTwin"
              width={180}
              height={61}
              className="object-contain w-full"
              priority
            />
          </div>
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-700 border border-slate-600 shrink-0 flex items-center justify-center">
              {photoUrl ? (
                <Image src={photoUrl} alt="avatar" width={28} height={28} className="object-cover w-full h-full" />
              ) : (
                <span className="text-xs">👤</span>
              )}
            </div>
            <p className="text-xs text-slate-400 truncate">{userName}</p>
          </div>
        </div>

        <SidebarNav isAdmin={isAdmin} accountType={accountType} pendingRequests={pendingRequests} />

        <div className="p-4 border-t border-slate-800">
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="w-full text-left px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-sm"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content — offset on mobile for top bar */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        <div className="p-4 sm:p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
