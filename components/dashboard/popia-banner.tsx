"use client";

import { useState, useEffect } from "react";

export function PopiaBanner() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("popia_banner_dismissed") === "1") {
      setDismissed(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem("popia_banner_dismissed", "1");
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <div className="bg-indigo-950/60 border border-indigo-800/50 rounded-2xl p-4 flex items-start gap-4">
      <span className="text-2xl shrink-0">🛡️</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-indigo-200 mb-0.5">POPIA Compliance — Your data, your rights</p>
        <p className="text-xs text-slate-400 leading-relaxed">
          OwnMyTwin complies with the Protection of Personal Information Act (POPIA), No. 4 of 2013. Your personal data is processed solely to operate your AI Twin and facilitate approved licensing. You may export or delete your data at any time from{" "}
          <a href="/settings" className="text-indigo-400 hover:underline">Settings</a>.
          For data queries contact{" "}
          <a href="mailto:privacy@ownmytwin.com" className="text-indigo-400 hover:underline">privacy@ownmytwin.com</a>.
        </p>
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 text-slate-600 hover:text-slate-300 transition-colors text-lg leading-none mt-0.5"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
