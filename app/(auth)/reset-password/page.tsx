"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function ResetPasswordContent() {
  const params   = useSearchParams();
  const router   = useRouter();
  const token    = params.get("token") ?? "";
  const email    = params.get("email") ?? "";

  const [password,  setPassword]  = useState("");
  const [password2, setPassword2] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [done,      setDone]      = useState(false);

  if (!token || !email) {
    return (
      <div className="text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid link</h1>
        <p className="text-slate-500 text-sm mb-6">This reset link is missing required information.</p>
        <Link href="/forgot-password" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
          Request a new one
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== password2) { setError("Passwords don't match."); return; }
    setLoading(true);
    const res  = await fetch("/api/auth/reset-password", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ token, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
    setDone(true);
    setTimeout(() => router.push("/login"), 3000);
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Password updated!</h1>
        <p className="text-slate-500 text-sm mb-2">Your password has been changed. Redirecting to sign in...</p>
        <div className="flex justify-center mt-4">
          <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Set new password</h1>
      <p className="text-slate-500 text-sm mb-8">Choose a strong password for your account.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Confirm password</label>
          <input
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            placeholder="Repeat your password"
            required
            autoComplete="new-password"
            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !password || !password2}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
        >
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
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
            <Suspense fallback={<div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>}>
              <ResetPasswordContent />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
