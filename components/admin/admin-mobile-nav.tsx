"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin",          icon: "📊", label: "Overview"  },
  { href: "/admin/users",    icon: "👥", label: "Users"     },
  { href: "/admin/requests", icon: "📬", label: "Requests"  },
  { href: "/admin/content",  icon: "🧠", label: "Content"   },
  { href: "/admin/security", icon: "🔐", label: "Security"  },
];

export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 h-14">
        <button onClick={() => setOpen(true)} className="text-slate-400 hover:text-white p-2 -ml-2 touch-manipulation" aria-label="Open menu">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-white rounded-lg px-2 py-1">
            <Image src="/ownmytwin-logo.png" alt="OwnMyTwin" width={90} height={30} className="object-contain" />
          </div>
          <span className="text-xs font-bold text-red-400 bg-red-900/30 border border-red-800/40 px-2 py-0.5 rounded-full">Admin</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Overlay */}
      {open && <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />}

      {/* Drawer */}
      <div className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="bg-white rounded-xl px-3 py-2">
            <Image src="/ownmytwin-logo.png" alt="OwnMyTwin" width={110} height={37} className="object-contain" />
          </div>
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white p-2 touch-manipulation">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-3 py-2 border-b border-slate-800">
          <span className="text-xs font-bold text-red-400 bg-red-900/30 border border-red-800/40 px-2.5 py-1 rounded-full">🛡️ Admin Panel</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-colors touch-manipulation ${pathname === item.href ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
              <span>{item.icon}</span><span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors px-2 py-2 touch-manipulation">← Back to Dashboard</Link>
        </div>
      </div>
    </>
  );
}
