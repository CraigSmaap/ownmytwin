"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="px-6 py-5">
        <Link href="/">
          <Image src="/ownmytwin-logo.png" alt="OwnMyTwin" width={160} height={54} className="object-contain" priority />
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
            {sent ? (
              <div className="text-center">
                <div className="text-5xl mb-4">📬</div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Check your inbox</h1>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link. It expires in 1 hour.
                </p>
                <Link href="/login" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors">
                  Back to sign in
                </Link>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">Forgot your password?</h1>
                <p className="text-slate-500 text-sm mb-8">Enter your email and we&apos;ll send you a reset link.</p>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Email address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
                  >
                    {loading ? "Sending..." : "Send reset link"}
                  </button>
                </form>
              </>
            )}
          </div>

          <p className="text-center text-slate-500 text-xs mt-6">
            Remember your password?{" "}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
