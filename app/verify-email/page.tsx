"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

function VerifyEmailContent() {
  const params    = useSearchParams();
  const router    = useRouter();
  const success   = params.get("success") === "1";
  const error     = params.get("error");
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [autoSent, setAutoSent] = useState(false);

  useEffect(() => {
    if (!success && !error && !autoSent) {
      setAutoSent(true);
      fetch("/api/auth/send-verification", { method: "POST" });
    }
  }, [success, error, autoSent]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => router.push("/dashboard"), 3000);
      return () => clearTimeout(t);
    }
  }, [success, router]);

  async function handleResend() {
    setSending(true);
    await fetch("/api/auth/send-verification", { method: "POST" });
    setSending(false);
    setSent(true);
    setTimeout(() => setSent(false), 5000);
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">

        {success ? (
          <div className="bg-slate-900 border border-green-800/50 rounded-2xl p-10">
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-white mb-2">Email verified!</h1>
            <p className="text-slate-400 mb-6">Your account is confirmed. Redirecting you now...</p>
            <div className="flex justify-center">
              <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          </div>
        ) : error ? (
          <div className="bg-slate-900 border border-red-800/50 rounded-2xl p-10">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {error === "expired" ? "Link expired" : "Invalid link"}
            </h1>
            <p className="text-slate-400 mb-6">
              {error === "expired"
                ? "This verification link has expired. Request a new one below."
                : "This link isn't valid. Request a new verification email below."}
            </p>
            <button
              onClick={handleResend}
              disabled={sending || sent}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {sent ? "✓ Email sent — check your inbox" : sending ? "Sending..." : "Send New Verification Email"}
            </button>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10">
            <div className="text-5xl mb-4">✉️</div>
            <h1 className="text-2xl font-bold text-white mb-2">Check your inbox</h1>
            <p className="text-slate-400 mb-2">
              We&apos;ve sent a verification link to your email address.
            </p>
            <p className="text-slate-500 text-sm mb-8">
              Click the link in the email to activate your account. It expires in 24 hours.
            </p>

            <div className="bg-slate-800 rounded-xl p-4 mb-6 text-left space-y-2">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Can&apos;t find it?</p>
              <p className="text-xs text-slate-400">• Check your spam or junk folder</p>
              <p className="text-xs text-slate-400">• Make sure you used the right email</p>
              <p className="text-xs text-slate-400">• Wait a minute and check again</p>
            </div>

            <button
              onClick={handleResend}
              disabled={sending || sent}
              className="w-full border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white py-3 rounded-xl text-sm transition-colors disabled:opacity-40"
            >
              {sent ? "✓ Resent — check your inbox" : sending ? "Sending..." : "Resend verification email"}
            </button>

            <p className="mt-4 text-xs text-slate-600">
              Wrong account?{" "}
              <Link href="/login" className="text-indigo-500 hover:text-indigo-400 transition-colors">Sign out and try again</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="px-6 py-5">
        <Link href="/">
          <div className="bg-white rounded-xl px-3 py-2 inline-block">
            <Image src="/ownmytwin-logo.png" alt="OwnMyTwin" width={160} height={54} className="object-contain" priority />
          </div>
        </Link>
      </header>
      <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
