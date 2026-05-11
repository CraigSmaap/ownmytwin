"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

type Step = "idle" | "scanning" | "confirming" | "done";

export default function AdminSecurityPage() {
  const { data: session } = useSession();
  const enabled = (session?.user as { twoFactorEnabled?: boolean })?.twoFactorEnabled ?? false;

  const [step,     setStep]     = useState<Step>("idle");
  const [qr,       setQr]       = useState("");
  const [secret,   setSecret]   = useState("");
  const [code,     setCode]     = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [disabling,   setDisabling]   = useState(false);
  const [disableErr,  setDisableErr]  = useState("");
  const [showDisable, setShowDisable] = useState(false);

  async function startSetup() {
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/2fa/setup");
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to start setup."); setLoading(false); return; }
      setQr(data.qr);
      setSecret(data.secret);
      setStep("scanning");
    } catch {
      setError("Something went wrong. Try again.");
    }
    setLoading(false);
  }

  async function confirmEnable(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res  = await fetch("/api/admin/2fa/enable", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ secret, code }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setStep("done");
    // Sign out so they re-login and go through the 2FA gate
    setTimeout(() => signOut({ redirectTo: "/login" }), 2000);
  }

  async function handleDisable(e: React.FormEvent) {
    e.preventDefault();
    setDisableErr("");
    setDisabling(true);
    const res  = await fetch("/api/admin/2fa/disable", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ code: disableCode }),
    });
    const data = await res.json();
    setDisabling(false);
    if (!res.ok) { setDisableErr(data.error); return; }
    setShowDisable(false);
    setDisableCode("");
    // Sign out to refresh session
    signOut({ redirectTo: "/login" });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Security</h1>
        <p className="text-slate-400 text-sm mt-1">Manage two-factor authentication for your admin account.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-white font-semibold">Two-factor authentication</h2>
            <p className="text-slate-400 text-sm mt-1">
              Require a 6-digit code from your authenticator app every time you sign in.
            </p>
          </div>
          <span className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${
            enabled
              ? "bg-green-900/30 text-green-400 border-green-800/50"
              : "bg-slate-800 text-slate-500 border-slate-700"
          }`}>
            {enabled ? "✓ Enabled" : "Off"}
          </span>
        </div>

        {/* Enable flow */}
        {!enabled && step === "idle" && (
          <button
            onClick={startSetup}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            {loading ? "Loading..." : "Set up 2FA"}
          </button>
        )}

        {step === "scanning" && (
          <div className="space-y-5">
            <p className="text-slate-300 text-sm">
              Scan this QR code with <strong>Google Authenticator</strong>, <strong>Authy</strong>, or any TOTP app.
            </p>
            {qr && (
              <div className="bg-white rounded-2xl p-4 inline-block">
                <Image src={qr} alt="2FA QR Code" width={180} height={180} />
              </div>
            )}
            <div className="bg-slate-800 rounded-xl px-4 py-3">
              <p className="text-xs text-slate-500 mb-1">Manual entry code</p>
              <code className="text-indigo-400 text-sm font-mono break-all">{secret}</code>
            </div>
            <form onSubmit={confirmEnable} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Enter the 6-digit code from your app to confirm
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  required
                  className="w-40 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-center text-xl font-mono tracking-widest"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  {loading ? "Verifying..." : "Enable 2FA"}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep("idle"); setCode(""); setError(""); }}
                  className="text-slate-500 hover:text-slate-300 px-4 py-2.5 rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {step === "done" && (
          <div className="flex items-center gap-3 bg-green-900/20 border border-green-800/40 rounded-xl px-4 py-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-green-400 font-semibold text-sm">2FA enabled!</p>
              <p className="text-slate-400 text-xs">Signing you out so you can log back in with 2FA active...</p>
            </div>
          </div>
        )}

        {/* Disable flow */}
        {enabled && (
          <div className="space-y-3">
            {!showDisable ? (
              <button
                onClick={() => setShowDisable(true)}
                className="text-sm text-red-400 hover:text-red-300 border border-red-900/50 hover:border-red-800 px-4 py-2 rounded-xl transition-colors"
              >
                Disable 2FA
              </button>
            ) : (
              <form onSubmit={handleDisable} className="space-y-3">
                <p className="text-slate-400 text-sm">Enter your current authenticator code to disable 2FA.</p>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  required
                  className="w-40 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-center text-xl font-mono tracking-widest"
                />
                {disableErr && <p className="text-red-400 text-sm">{disableErr}</p>}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={disabling || disableCode.length !== 6}
                    className="bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    {disabling ? "Disabling..." : "Confirm disable"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowDisable(false); setDisableCode(""); setDisableErr(""); }}
                    className="text-slate-500 hover:text-slate-300 px-4 py-2.5 rounded-xl text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
