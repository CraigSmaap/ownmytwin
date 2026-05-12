"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface Props {
  userName:            string;
  photoUrl:            string | null;
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

export function MobileNav({ userName, photoUrl, isAdmin, accountType = "talent", pendingRequests = 0, verificationStatus = "unverified" }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isBuyer = accountType === "buyer";

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const verifyNeedsAction = verificationStatus === "unverified" || verificationStatus === "rejected";
  const baseItems  = isBuyer ? BUYER_ITEMS : TALENT_ITEMS;
  const navItems   = baseItems.map((item) => {
    if (item.href === "/requests") return { ...item, badge: pendingRequests };
    if (item.href === "/verify")   return { ...item, badge: verifyNeedsAction ? 1 : 0 };
    return item;
  });
  const activeClass = isBuyer ? "bg-violet-600 text-white" : "bg-indigo-600 text-white";

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 h-14">
        <button
          onClick={() => setOpen(true)}
          className="text-slate-400 hover:text-white p-2 -ml-2 touch-manipulation relative"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          {pendingRequests > 0 && !isBuyer && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full" />
          )}
        </button>

        <div className="bg-white rounded-lg px-2 py-1">
          <Image src="/ownmytwin-logo.png" alt="OwnMyTwin" width={100} height={34} className="object-contain" />
        </div>

        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700 border border-slate-600 flex items-center justify-center shrink-0">
          {photoUrl ? (
            <Image src={photoUrl} alt="avatar" width={40} height={40} className="object-cover w-full h-full" />
          ) : (
            <span className="text-sm">👤</span>
          )}
        </div>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      {/* Drawer */}
      <div className={`md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="bg-white rounded-xl px-3 py-2">
            <Image src="/ownmytwin-logo.png" alt="OwnMyTwin" width={120} height={40} className="object-contain" />
          </div>
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white p-2 touch-manipulation" aria-label="Close menu">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-700 border border-slate-600 shrink-0 flex items-center justify-center">
            {photoUrl ? (
              <Image src={photoUrl} alt="avatar" width={36} height={36} className="object-cover w-full h-full" />
            ) : (
              <span className="text-sm">👤</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-slate-300 truncate">{userName}</p>
            {isBuyer && <p className="text-xs text-violet-400">Buyer Account</p>}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-colors touch-manipulation ${
                  active ? activeClass : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
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
        </nav>

        {isAdmin && (
          <div className="px-3 pb-2 border-t border-slate-800 pt-3">
            <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-900/30 hover:text-red-300 transition-colors touch-manipulation">
              <span>🛡️</span>
              <span>Admin Panel</span>
            </Link>
          </div>
        )}

        <div className="p-4 border-t border-slate-800">
          <Link href="/login" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-sm touch-manipulation">
            <span>🚪</span>
            <span>Sign out</span>
          </Link>
        </div>
      </div>
    </>
  );
}
