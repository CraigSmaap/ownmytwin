"use client";

import { useEffect } from "react";

export function ReferralApplier() {
  useEffect(() => {
    const code = localStorage.getItem("pending_referral");
    if (!code) return;
    fetch("/api/referral/apply", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ code }),
    }).finally(() => {
      localStorage.removeItem("pending_referral");
    });
  }, []);

  return null;
}
