import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "admin") redirect("/dashboard");

  const pendingRequests = await db.licenseRequest.count({ where: { status: "pending" } });

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Mobile nav */}
      <AdminMobileNav />

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 bg-slate-900 border-r border-slate-800 flex-col shrink-0 fixed top-0 bottom-0 left-0 z-30">
        <div className="p-4 border-b border-slate-800">
          <div className="bg-white rounded-xl p-2 mb-3">
            <Image src="/ownmytwin-logo.png" alt="OwnMyTwin" width={140} height={47} className="object-contain w-full" priority />
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-900/30 border border-red-800/40 px-2.5 py-1 rounded-full">
            🛡️ Admin Panel
          </span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {[
            { href: "/admin",           icon: "📊", label: "Overview",  badge: 0               },
            { href: "/admin/users",     icon: "👥", label: "Users",     badge: 0               },
            { href: "/admin/requests",  icon: "📬", label: "Requests",  badge: pendingRequests },
            { href: "/admin/content",   icon: "🧠", label: "Content",   badge: 0               },
            { href: "/admin/security",  icon: "🔐", label: "Security",   badge: 0               },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
              <span>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge > 0 && (
                <span className="bg-amber-500 text-slate-900 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 space-y-1">
          <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
            <button type="submit" className="w-full flex items-center gap-2 text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-2 rounded-lg hover:bg-slate-800">
              🚪 Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-56 pt-14 lg:pt-0 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
