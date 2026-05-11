"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function Verify2FAPage() {
  const { update }  = useSession();
  const router      = useRouter();
  const [code,    setCode]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res  = await fetch("/api/auth/verify-2fa", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ code }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Invalid code.");
      setLoading(false);
      return;
    }

    // Update the JWT so twoFactorVerified becomes true
    await update({ twoFactorVerified: true });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="px-6 py-5">
        <Link href="/">
          <div className="bg-white rounded-xl px-3 py-2 inline-block">
            <Image src="/ownmytwin-logo.png" alt="OwnMyTwin" width={160} height={54} className="object-contain" priority />
          </div>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🔐</div>
              <h1 className="text-xl font-bold text-white">Two-factor authentication</h1>
              <p className="text-slate-400 text-sm mt-2">Enter the 6-digit code from your authenticator app.</p>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-800/50 text-red-400 text-sm rounded-xl px-4 py-3 mb-4 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                autoFocus
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-center text-2xl font-mono tracking-[0.5em] transition-colors"
              />
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
