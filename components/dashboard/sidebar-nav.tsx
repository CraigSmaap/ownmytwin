"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  isAdmin?:            boolean;
  accountType?:        string;
  pendingRequests?:    number;
  verificationStatus?: string;
}

const TALENT_ITEMS = [
  { href: "/dashboard",   label: "Dashboard",       icon: "🏠", badge: 0 },
  { href: "/reply",       label: "Reply For Me",     icon: "💬", badge: 0 },
  { href: "/reels",       label: "Reel Creator",     icon: "🎬", badge: 0 },
  { href: "/chat",        label: "Talk to Twin",     icon: "🪞", badge: 0 },
  { href: "/twin",        label: "My Twin",          icon: "🤖", badge: 0 },
  { href: "/memories",    label: "Memories",         icon: "🧠", badge: 0 },
  { href: "/licensing",   label: "Licensing",        icon: "📜", badge: 0 },
  { href: "/requests",    label: "Requests",         icon: "📬", badge: 0 },
  { href: "/marketplace", label: "Marketplace",      icon: "🏪", badge: 0 },
  { href: "/verify",      label: "Verify Identity",  icon: "🛡️", badge: 0 },
  { href: "/developer",   label: "Developer",        icon: "🔑", badge: 0 },
  { href: "/settings",    label: "Settings",         icon: "⚙️", badge: 0 },
];

const BUYER_ITEMS = [
  { href: "/dashboard",   label: "Dashboard",   icon: "🏠", badge: 0 },
  { href: "/marketplace", label: "Marketplace", icon: "🏪", badge: 0 },
  { href: "/my-requests", label: "My Requests", icon: "📬", badge: 0 },
  { href: "/showcase",    label: "Showcase",    icon: "🎬", badge: 0 },
  { href: "/settings",    label: "Settings",    icon: "⚙️", badge: 0 },
];

export function SidebarNav({ isAdmin, accountType = "talent", pendingRequests = 0, verificationStatus = "unverified" }: Props) {
  const pathname  = usePathname();
  const isBuyer   = accountType === "buyer";
  const baseItems = isBuyer ? BUYER_ITEMS : TALENT_ITEMS;

  const verifyNeedsAction = verificationStatus === "unverified" || verificationStatus === "rejected";

  const NAV_ITEMS = baseItems.map((item) => {
    if (item.href === "/requests") return { ...item, badge: pendingRequests };
    if (item.href === "/verify")   return { ...item, badge: verifyNeedsAction ? 1 : 0 };
    return item;
  });

  const activeClass = isBuyer ? "bg-violet-600 text-white" : "bg-indigo-600 text-white";

  return (
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              active ? activeClass : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span>{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.badge > 0 && (
              <span className="bg-amber-500 text-slate-900 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {item.href === "/verify" ? "!" : item.badge}
              </span>
            )}
            {item.href === "/verify" && verificationStatus === "verified" && (
              <span className="text-green-400 text-xs">✓</span>
            )}
          </Link>
        );
      })}

      {isAdmin && (
        <>
          <div className="pt-3 pb-1 px-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Admin</p>
          </div>
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith("/admin") ? "bg-red-900/60 text-red-300" : "text-red-500 hover:bg-red-900/30 hover:text-red-300"
            }`}
          >
            <span>🛡️</span>
            <span>Admin Panel</span>
          </Link>
        </>
      )}
    </nav>
  );
}
