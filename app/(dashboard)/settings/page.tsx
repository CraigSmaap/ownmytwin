"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function SettingsContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const upgradeParam = searchParams.get("upgrade");

  // Account
  const [name,          setName]          = useState("");
  const [email,         setEmail]         = useState("");
  const [createdAt,     setCreatedAt]     = useState("");
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [exporting,     setExporting]     = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [loaded,        setLoaded]        = useState(false);
  const [accountType,   setAccountType]   = useState<"talent" | "buyer">("talent");

  // Plan
  const [plan,           setPlan]           = useState<"free" | "pro">("free");
  const [planExpiresAt,  setPlanExpiresAt]  = useState<string | null>(null);
  const [upgrading,      setUpgrading]      = useState(false);
  const [upgradeError,   setUpgradeError]   = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  // Voice credits
  const [ttsCredits,   setTtsCredits]   = useState(0);
  const [topupPack,    setTopupPack]    = useState("100");
  const [toppingUp,    setToppingUp]    = useState(false);
  const [topupError,   setTopupError]   = useState("");
  const topupParam = searchParams.get("topup");

  // Public profile (talent only)
  const [slug,               setSlug]               = useState("");
  const [editingSlug,        setEditingSlug]         = useState("");
  const [bio,                setBio]                = useState("");
  const [marketplaceVisible, setMarketplaceVisible] = useState(false);
  const [savingProfile,      setSavingProfile]      = useState(false);
  const [savedProfile,       setSavedProfile]       = useState(false);
  const [profileError,       setProfileError]       = useState("");
  const [copied,             setCopied]             = useState(false);

  // Referral
  const [referralCode,        setReferralCode]        = useState("");
  const [referralUrl,         setReferralUrl]         = useState("");
  const [successfulReferrals, setSuccessfulReferrals] = useState(0);
  const [rewardMonths,        setRewardMonths]        = useState(0);
  const [copiedReferral,      setCopiedReferral]      = useState(false);

  // Buyer profile
  const [buyerCompany,      setBuyerCompany]      = useState("");
  const [buyerIndustry,     setBuyerIndustry]     = useState("");
  const [buyerIntendedUse,  setBuyerIntendedUse]  = useState("");
  const [savingBuyer,       setSavingBuyer]       = useState(false);
  const [savedBuyer,        setSavedBuyer]        = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/user").then((r) => r.json()),
      fetch("/api/twin").then((r) => r.json()),
      fetch("/api/referral").then((r) => r.json()),
    ]).then(([{ user }, { twin }, referral]) => {
      if (referral?.code) {
        setReferralCode(referral.code);
        setReferralUrl(referral.referralUrl);
        setSuccessfulReferrals(referral.successfulReferrals ?? 0);
        setRewardMonths(referral.rewardMonths ?? 0);
      }
      if (user) {
        setName(user.name ?? "");
        setEmail(user.email ?? "");
        setCreatedAt(
          user.createdAt
            ? new Date(user.createdAt).toLocaleDateString("en-ZA", {
                year: "numeric", month: "long", day: "numeric",
              })
            : "",
        );
        setAccountType(user.accountType ?? "talent");
        setSlug(user.publicSlug ?? "");
        setEditingSlug(user.publicSlug ?? "");
        setPlan(user.plan ?? "free");
        setPlanExpiresAt(user.planExpiresAt ?? null);
        setTtsCredits(user.ttsCredits ?? 0);
        const bp = user.buyerProfile ?? {};
        setBuyerCompany(bp.company ?? "");
        setBuyerIndustry(bp.industry ?? "");
        setBuyerIntendedUse(bp.intendedUse ?? "");
        setLoaded(true);
      }
      if (twin) {
        setBio(twin.bio ?? "");
        setMarketplaceVisible(twin.marketplaceVisible ?? false);
      }
    });
  }, []);

  async function handleSaveAccount() {
    setSaving(true);
    await fetch("/api/user", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    setProfileError("");

    const userRes = await fetch("/api/user", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ publicSlug: editingSlug }),
    });
    const userData = await userRes.json();
    if (!userRes.ok) {
      setProfileError(userData.error ?? "Failed to save");
      setSavingProfile(false);
      return;
    }
    setSlug(userData.user.publicSlug ?? editingSlug);
    setEditingSlug(userData.user.publicSlug ?? editingSlug);

    await fetch("/api/twin", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ bio, marketplaceVisible: plan === "pro" ? marketplaceVisible : false }),
    });

    setSavingProfile(false);
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 2500);
  }

  async function handleUpgrade() {
    setUpgrading(true);
    setUpgradeError("");
    try {
      const res  = await fetch("/api/paystack/checkout", { method: "POST" });
      const json = await res.json();
      if (!res.ok) { setUpgradeError(json.error ?? "Could not start checkout"); setUpgrading(false); return; }
      window.location.href = json.authorization_url;
    } catch {
      setUpgradeError("Network error — please try again");
      setUpgrading(false);
    }
  }

  async function handleTopup() {
    setToppingUp(true);
    setTopupError("");
    try {
      const res  = await fetch("/api/paystack/topup", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ pack: topupPack }),
      });
      const json = await res.json();
      if (!res.ok) { setTopupError(json.error ?? "Could not start checkout"); setToppingUp(false); return; }
      window.location.href = json.authorization_url;
    } catch {
      setTopupError("Network error — please try again");
      setToppingUp(false);
    }
  }

  async function handleSaveBuyerProfile() {
    setSavingBuyer(true);
    await fetch("/api/user", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        buyerProfile: {
          company:     buyerCompany.trim(),
          industry:    buyerIndustry,
          intendedUse: buyerIntendedUse.trim(),
        },
      }),
    });
    setSavingBuyer(false);
    setSavedBuyer(true);
    setTimeout(() => setSavedBuyer(false), 2500);
  }

  async function handleExport() {
    setExporting(true);
    const res  = await fetch("/api/user/export");
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `aitwin-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  async function handleDelete() {
    setDeleting(true);
    await fetch("/api/user/delete", { method: "DELETE" });
    await signOut({ redirect: false });
    router.push("/");
  }

  function handleCopyReferralLink() {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopiedReferral(true);
      setTimeout(() => setCopiedReferral(false), 2000);
    });
  }

  function handleCopyLink() {
    if (!slug) return;
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const profileUrl = slug ? `${typeof window !== "undefined" ? window.location.origin : "https://ownmytwin.com"}/p/${slug}` : "";
  const isPro      = plan === "pro";
  const isBuyer    = accountType === "buyer";

  return (
    <div className="max-w-2xl space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Settings</h1>
        <p className="text-slate-400">Manage your account, plan, and privacy.</p>
      </div>

      {/* Upgrade success / cancelled banner */}
      {topupParam === "success" && (
        <div className="bg-emerald-950/40 border border-emerald-700/60 rounded-xl px-4 py-3 text-sm text-emerald-400">
          Voice credits added to your account!
        </div>
      )}
      {topupParam === "cancelled" && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-400">
          Top-up was cancelled — no charge was made.
        </div>
      )}
      {upgradeParam === "success" && (
        <div className="bg-green-900/30 border border-green-700 text-green-300 rounded-2xl px-5 py-4 text-sm font-medium">
          🎉 Welcome to Pro! Your plan has been activated.
        </div>
      )}
      {upgradeParam === "cancelled" && (
        <div className="bg-amber-900/30 border border-amber-700 text-amber-300 rounded-2xl px-5 py-4 text-sm">
          Payment was cancelled — you&apos;re still on the free plan.
        </div>
      )}

      {/* Buyer Profile — buyers only */}
      {isBuyer && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Buyer Profile</h2>
            <p className="text-xs text-slate-600 mt-1">This information helps talent understand who you are and what you need.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Company / Organisation</label>
            <input
              value={buyerCompany}
              onChange={(e) => setBuyerCompany(e.target.value)}
              placeholder="e.g. Acme Studios"
              disabled={!loaded}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm disabled:opacity-40"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Industry</label>
            <select
              value={buyerIndustry}
              onChange={(e) => setBuyerIndustry(e.target.value)}
              disabled={!loaded}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 text-sm appearance-none disabled:opacity-40"
            >
              <option value="">Select your industry...</option>
              {["Advertising & Marketing","Film & TV","Gaming","Music & Audio","Education","Corporate Training","E-commerce","Social Media","Broadcasting","Healthcare","Finance","Technology","Other"].map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">How do you plan to use AI twins?</label>
            <textarea
              value={buyerIntendedUse}
              onChange={(e) => setBuyerIntendedUse(e.target.value)}
              placeholder="e.g. We create corporate training videos and want to license AI presenters..."
              rows={3}
              disabled={!loaded}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none text-sm leading-relaxed disabled:opacity-40"
            />
          </div>

          <button
            onClick={handleSaveBuyerProfile}
            disabled={savingBuyer || !loaded}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              savedBuyer ? "bg-green-700 text-white" : "bg-violet-600 hover:bg-violet-500 text-white"
            } disabled:opacity-40`}
          >
            {savedBuyer ? "✓ Saved" : savingBuyer ? "Saving..." : "Save Profile"}
          </button>
        </div>
      )}

      {/* Plan — talent only */}
      {!isBuyer && <div className={`border rounded-2xl p-6 space-y-5 ${isPro ? "bg-indigo-950/40 border-indigo-700/60" : "bg-slate-900 border-slate-800"}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Plan</h2>
          {isPro ? (
            <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">PRO</span>
          ) : (
            <span className="bg-slate-800 text-slate-400 text-xs font-bold px-3 py-1 rounded-full border border-slate-700">FREE</span>
          )}
        </div>

        {isPro ? (
          <div className="space-y-3">
            <p className="text-white font-semibold">OwnMyTwin Pro — $29/month</p>
            {planExpiresAt && (
              <p className="text-xs text-slate-400">
                Renews on {new Date(planExpiresAt).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {["Marketplace listing", "Earn from licensing", "Voice TTS replies", "Priority support"].map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-indigo-300">
                  <span className="text-indigo-400">✓</span> {f}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-white font-semibold mb-1">Upgrade to Pro — $29/month</p>
              <p className="text-sm text-slate-400">Unlock everything OwnMyTwin has to offer.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["List in the marketplace", true],
                ["Earn from licensing", true],
                ["Voice TTS replies", true],
                ["Chat & Reply For Me", false],
                ["Public profile", false],
                ["Twin training", false],
              ].map(([f, pro]) => (
                <div key={String(f)} className={`flex items-center gap-2 text-xs ${pro ? "text-white" : "text-slate-500"}`}>
                  <span className={pro ? "text-indigo-400" : "text-slate-700"}>
                    {pro ? "⭐" : "✓"}
                  </span>
                  {String(f)} {pro && <span className="text-indigo-500 font-bold">Pro</span>}
                </div>
              ))}
            </div>
            {upgradeError && (
              <p className="text-xs text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl px-3 py-2">{upgradeError}</p>
            )}
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              {upgrading ? "Opening checkout..." : "Upgrade to Pro — $29/month"}
            </button>
            <p className="text-xs text-slate-600 text-center">Cancel anytime. Secure payments via Paystack.</p>
          </div>
        )}
      </div>}

      {/* Voice Credits — Pro only */}
      {!isBuyer && isPro && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Voice Credits</h2>
              <p className="text-xs text-slate-600 mt-1">Used for TTS voice replies. 10 free/day included with Pro. Credits carry over month to month.</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{ttsCredits}</p>
              <p className="text-xs text-slate-500">credits remaining</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { pack: "100", credits: 100, price: "$3",  perCredit: "$0.03" },
              { pack: "300", credits: 300, price: "$7",  perCredit: "$0.02" },
              { pack: "500", credits: 500, price: "$11", perCredit: "$0.02" },
            ].map(({ pack, credits, price, perCredit }) => (
              <button
                key={pack}
                onClick={() => setTopupPack(pack)}
                className={`rounded-xl border p-3 text-center transition-all ${
                  topupPack === pack
                    ? "bg-indigo-900/50 border-indigo-600 text-white"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                <p className="text-lg font-bold text-white">{credits}</p>
                <p className="text-xs text-indigo-400 font-semibold">{price}</p>
                <p className="text-xs text-slate-600">{perCredit}/credit</p>
              </button>
            ))}
          </div>

          {topupError && (
            <p className="text-xs text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl px-3 py-2">{topupError}</p>
          )}
          <button
            onClick={handleTopup}
            disabled={toppingUp}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            {toppingUp ? "Opening checkout..." : `Buy ${topupPack} Credits`}
          </button>
          <p className="text-xs text-slate-600 text-center">Paid via Paystack. Credits never expire.</p>
        </div>
      )}

      {/* Referral */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Refer & Earn</h2>
          <p className="text-xs text-slate-600 mt-1">
            Earn 1 month of Pro free for every friend who signs up and pays. Capped at 6 months.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-center">
            <p className="text-2xl font-bold text-white">{successfulReferrals}</p>
            <p className="text-xs text-slate-500 mt-0.5">Successful referrals</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-center">
            <p className="text-2xl font-bold text-indigo-400">{rewardMonths}</p>
            <p className="text-xs text-slate-500 mt-0.5">Free months earned</p>
          </div>
        </div>

        {/* Referral link */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Your referral link</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 text-sm truncate min-w-0">
              {referralUrl || "Generating..."}
            </div>
            <button
              onClick={handleCopyReferralLink}
              disabled={!referralCode}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all disabled:opacity-40 ${
                copiedReferral
                  ? "bg-green-900/30 text-green-400 border-green-800/50"
                  : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
              }`}
            >
              {copiedReferral ? "✓ Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-slate-700 mt-1.5">
            Share this link. When someone signs up and pays their first month, you get a free month added automatically.
          </p>
        </div>

        {rewardMonths >= 6 && (
          <div className="bg-amber-900/20 border border-amber-800/40 rounded-xl px-4 py-3 text-xs text-amber-400">
            You&apos;ve hit the 6-month cap — thank you for spreading the word!
          </div>
        )}
      </div>

      {/* Account */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Account</h2>

        {createdAt && (
          <p className="text-xs text-slate-600">Member since {createdAt}</p>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Display Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            disabled={!loaded}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm disabled:opacity-40"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
          <input
            value={email}
            disabled
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-500 text-sm opacity-60 cursor-not-allowed"
          />
          <p className="text-xs text-slate-700 mt-1">Email cannot be changed here</p>
        </div>

        <button
          onClick={handleSaveAccount}
          disabled={saving || !loaded}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            saved ? "bg-green-700 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"
          } disabled:opacity-40`}
        >
          {saved ? "✓ Saved" : saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Public Profile — talent only */}
      {!isBuyer && <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Your Public Profile</h2>
          <p className="text-xs text-slate-600 mt-1">
            Share this link on social media, in your bio, or with anyone who wants to license you.
          </p>
        </div>

        {/* Profile URL display */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Your Profile URL</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex items-center gap-2 min-w-0">
              <span className="text-slate-600 text-xs shrink-0 hidden sm:block">
                {typeof window !== "undefined" ? window.location.origin : "ownmytwin.com"}/p/
              </span>
              <input
                value={editingSlug}
                onChange={(e) => setEditingSlug(
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").substring(0, 50)
                )}
                placeholder="your-name"
                disabled={!loaded}
                className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none text-sm min-w-0 disabled:opacity-40"
              />
            </div>
            {slug && (
              <button
                onClick={handleCopyLink}
                className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  copied
                    ? "bg-green-900/30 text-green-400 border-green-800/50"
                    : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
                }`}
              >
                {copied ? "✓ Copied!" : "Copy Link"}
              </button>
            )}
          </div>
          {slug && (
            <a
              href={`/p/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 mt-1.5 inline-flex items-center gap-1 transition-colors"
            >
              <span>{profileUrl}</span>
              <span>↗</span>
            </a>
          )}
          <p className="text-xs text-slate-700 mt-1">Lowercase letters, numbers, and hyphens only</p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Public Bio
            <span className="text-slate-600 font-normal ml-1.5">— shown on your profile page</span>
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A short description of who you are that buyers will see on your public profile..."
            rows={3}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none text-sm leading-relaxed"
          />
        </div>

        {/* Marketplace visibility — Pro gated */}
        {isPro ? (
          <button
            onClick={() => setMarketplaceVisible(!marketplaceVisible)}
            className={`flex items-center justify-between w-full p-4 rounded-xl border transition-all ${
              marketplaceVisible
                ? "bg-indigo-900/30 border-indigo-700 text-white"
                : "bg-slate-800 border-slate-700 text-slate-400"
            }`}
          >
            <div className="text-left">
              <p className="text-sm font-medium">List in marketplace</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {marketplaceVisible
                  ? "Your Twin appears in the browse marketplace for buyers"
                  : "Your Twin is not listed in the marketplace"}
              </p>
            </div>
            <div className={`w-10 h-6 rounded-full transition-all relative shrink-0 ml-4 ${marketplaceVisible ? "bg-indigo-600" : "bg-slate-700"}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${marketplaceVisible ? "left-5" : "left-1"}`} />
            </div>
          </button>
        ) : (
          <div className="flex items-center justify-between w-full p-4 rounded-xl border bg-slate-800/50 border-slate-700 opacity-60 cursor-not-allowed">
            <div className="text-left">
              <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                🔒 List in marketplace
                <span className="text-indigo-400 text-xs font-bold bg-indigo-900/40 border border-indigo-800/50 px-2 py-0.5 rounded-full">Pro</span>
              </p>
              <p className="text-xs text-slate-600 mt-0.5">Upgrade to Pro to list your Twin and earn from licensing</p>
            </div>
          </div>
        )}

        {profileError && (
          <p className="text-xs text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl px-3 py-2">
            {profileError}
          </p>
        )}

        <button
          onClick={handleSaveProfile}
          disabled={savingProfile || !loaded}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            savedProfile ? "bg-green-700 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"
          } disabled:opacity-40`}
        >
          {savedProfile ? "✓ Saved" : savingProfile ? "Saving..." : "Save Profile"}
        </button>
      </div>}

      {/* Your Data */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Your Data</h2>
        <p className="text-sm text-slate-400">
          You own everything. Export a full copy of your OwnMyTwin — profile, memories, messages, and photo list — as a JSON file anytime.
        </p>
        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          {["Twin profile", "All memories", "Message history", "Likeness photo list"].map((item) => (
            <span key={item} className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full">
              <span className="text-green-500">✓</span> {item}
            </span>
          ))}
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
        >
          {exporting ? (
            <>
              <span className="w-4 h-4 border-2 border-slate-500/30 border-t-slate-300 rounded-full animate-spin" />
              Preparing export...
            </>
          ) : (
            <>📦 Export My Data</>
          )}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-slate-900 border border-red-900/40 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide">Danger Zone</h2>
        <p className="text-sm text-slate-400">
          Permanently delete your account, your OwnMyTwin, all memories, and all data. This cannot be undone.
        </p>

        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="bg-red-950 hover:bg-red-900 border border-red-800 text-red-400 hover:text-red-300 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            Delete My Account
          </button>
        ) : (
          <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 space-y-3">
            <p className="text-sm text-red-300 font-medium">Are you absolutely sure? This deletes everything permanently.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 border border-slate-700 text-slate-400 hover:text-white py-2.5 rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                {deleting ? "Deleting..." : "Yes, delete everything"}
              </button>
            </div>
          </div>
        )}
      </div>

      <form ref={formRef} className="hidden" />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}
