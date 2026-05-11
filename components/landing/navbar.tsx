"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const NAV_LINKS = [
  { href: "#features",     label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing",      label: "Pricing" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-slate-200 bg-white/50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 h-24 flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <Image
            src="/ownmytwin-logo.png"
            alt="OwnMyTwin"
            width={200}
            height={68}
            className="object-contain"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-10">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative text-base font-semibold text-slate-600 hover:text-indigo-600 transition-colors group"
            >
              {l.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 rounded-full transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="text-base font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
            Sign in
          </Link>
          <Link
            href="/login"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-base font-bold px-5 py-2.5 rounded-xl shadow-md shadow-indigo-200 hover:shadow-indigo-300 transition-all"
          >
            Get Started Free
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-slate-500 hover:text-slate-900"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white px-6 py-5 space-y-1">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="block text-base font-semibold text-slate-600 hover:text-indigo-600 transition-colors py-2.5 border-b border-slate-100"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <div className="pt-3 space-y-2">
            <Link href="/login" className="block text-base font-semibold text-slate-600 hover:text-indigo-600 transition-colors py-2 text-center">
              Sign in
            </Link>
            <Link
              href="/login"
              className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white text-base font-bold px-4 py-3 rounded-xl text-center transition-colors shadow-md shadow-indigo-200"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
