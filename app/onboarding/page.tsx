"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { VoiceRecorder } from "@/components/voice/voice-recorder";
import { CameraCapture } from "@/components/camera-capture";

const TALENT_STEPS = ["Welcome", "Photos", "Voice", "Profile", "Memory", "Ready"];
const BUYER_STEPS  = ["Your Details", "Ready"];

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua & Barbuda","Argentina","Armenia","Australia",
  "Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin",
  "Bhutan","Bolivia","Bosnia & Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi",
  "Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia",
  "Comoros","Congo","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic","Denmark","Djibouti","Dominica",
  "Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini",
  "Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada",
  "Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia",
  "Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati",
  "Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania",
  "Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania",
  "Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique",
  "Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea",
  "North Macedonia","Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay",
  "Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saint Kitts & Nevis",
  "Saint Lucia","Saint Vincent & the Grenadines","Samoa","San Marino","Saudi Arabia","Senegal","Serbia",
  "Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa",
  "South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Taiwan",
  "Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad & Tobago","Tunisia","Turkey",
  "Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States",
  "Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

const CATEGORIES = [
  { value: "life_event",   label: "Life Event",   icon: "📅" },
  { value: "preference",   label: "Preference",   icon: "❤️" },
  { value: "relationship", label: "Relationship", icon: "👥" },
  { value: "achievement",  label: "Achievement",  icon: "🏆" },
  { value: "belief",       label: "Belief",       icon: "💡" },
  { value: "other",        label: "Other",        icon: "📝" },
] as const;

const INDUSTRIES = [
  "Advertising & Marketing", "Film & TV", "Gaming", "Music & Audio",
  "Education", "Corporate Training", "E-commerce", "Social Media",
  "Broadcasting", "Healthcare", "Finance", "Technology", "Other",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { update } = useSession();

  // Age + POPIA consent gate (shown first, before account type)
  const [ageGatePassed,  setAgeGatePassed]  = useState(false);
  const [dobValue,       setDobValue]       = useState("");
  const [countryValue,   setCountryValue]   = useState("");
  const [popiAccepted,   setPopiAccepted]   = useState(false);
  const [ageError,       setAgeError]       = useState("");
  const [savingConsent,  setSavingConsent]  = useState(false);

  async function handleAgeGate() {
    setAgeError("");
    if (!dobValue) { setAgeError("Please enter your date of birth."); return; }
    if (!countryValue) { setAgeError("Please select your country."); return; }
    if (!popiAccepted) { setAgeError("You must accept the POPIA consent to continue."); return; }
    const dob  = new Date(dobValue);
    const today = new Date();
    const age   = today.getFullYear() - dob.getFullYear() - (
      today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0
    );
    if (age < 18) { setAgeError("You must be 18 or older to create an account on OwnMyTwin."); return; }
    setSavingConsent(true);
    await fetch("/api/user", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ dateOfBirth: dobValue, popiConsent: true, country: countryValue }),
    });
    setSavingConsent(false);
    setAgeGatePassed(true);
  }

  // Account type selection (pre-step)
  const [accountType, setAccountType] = useState<"talent" | "buyer" | null>(null);

  // Talent step (0 = Welcome, 5 = Ready)
  const [step, setStep] = useState(0);

  // Buyer fields
  const [buyerCompany,     setBuyerCompany]     = useState("");
  const [buyerIndustry,    setBuyerIndustry]    = useState("");
  const [buyerIntendedUse, setBuyerIntendedUse] = useState("");
  const [savingBuyer,      setSavingBuyer]      = useState(false);

  // Photos
  const [photos, setPhotos]       = useState<{ id: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  // Voice
  const [voiceCount, setVoiceCount] = useState(0);

  // Profile
  const [twinName,      setTwinName]      = useState("");
  const [profession,    setProfession]    = useState("");
  const [location,      setLocation]      = useState("");
  const [tone,          setTone]          = useState("");
  const [values,        setValues]        = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Memory
  const [memTitle,    setMemTitle]    = useState("");
  const [memContent,  setMemContent]  = useState("");
  const [memCategory, setMemCategory] = useState<(typeof CATEGORIES)[number]["value"]>("life_event");
  const [savingMem,   setSavingMem]   = useState(false);

  // Finishing
  const [finishing, setFinishing] = useState(false);

  async function uploadFiles(files: File[]) {
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const form = new FormData();
      form.append("photo", file);
      const res = await fetch("/api/likeness", { method: "POST", body: form });
      const { photo } = await res.json();
      if (photo) setPhotos((prev) => [...prev, photo]);
    }
    setUploading(false);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    await uploadFiles(files);
    if (photoRef.current) photoRef.current.value = "";
  }

  async function handleCameraCapture(file: File, _label: string) {
    setShowCamera(false);
    await uploadFiles([file]);
  }

  async function handleSaveProfile() {
    if (!twinName.trim()) return;
    setSavingProfile(true);
    const personality = {
      tone:       tone.split(",").map((s) => s.trim()).filter(Boolean),
      values:     values.split(",").map((s) => s.trim()).filter(Boolean),
      profession: profession.trim() || undefined,
      location:   location.trim() || undefined,
      communication: "direct",
    };
    await fetch("/api/twin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: twinName,
        personality,
        writingStyle: { formality: "mixed", usesEmoji: false, sentenceLength: "medium", messageLength: "medium", vocabulary: [], patterns: [] },
      }),
    });
    setSavingProfile(false);
    setStep(4);
  }

  async function handleSaveMemory() {
    if (!memTitle.trim() || !memContent.trim()) return;
    setSavingMem(true);
    await fetch("/api/memories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: memTitle, content: memContent, category: memCategory }),
    });
    setSavingMem(false);
    setStep(5);
  }

  async function handleFinish() {
    setFinishing(true);
    await fetch("/api/user", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ accountType: "talent", onboardingComplete: true }),
    });
    router.push("/dashboard");
  }

  async function handleFinishBuyer() {
    setSavingBuyer(true);
    await fetch("/api/user", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        accountType:   "buyer",
        buyerProfile:  { company: buyerCompany.trim(), industry: buyerIndustry, intendedUse: buyerIntendedUse.trim() },
        onboardingComplete: true,
      }),
    });
    await update({ accountType: "buyer" });
    router.push("/dashboard");
  }

  const STEPS    = accountType === "buyer" ? BUYER_STEPS : TALENT_STEPS;
  const progress = accountType ? (step / (STEPS.length - 1)) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Top bar */}
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <div className="bg-white rounded-xl px-3 py-2 inline-block">
          <Image src="/ownmytwin-logo.png" alt="OwnMyTwin" width={140} height={47} className="object-contain" />
        </div>
        {accountType && (
          <span className="text-xs text-slate-500">{step + 1} of {STEPS.length}</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-800">
        <div className="h-1 bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Step labels */}
      {accountType && (
        <div className="flex justify-between px-4 sm:px-6 pt-3 max-w-lg mx-auto w-full overflow-x-auto">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={`text-xs transition-colors shrink-0 px-1 ${i === step ? "text-indigo-400 font-medium" : i < step ? "text-slate-500" : "text-slate-700"}`}
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Step content */}
      <div className="flex-1 flex items-start sm:items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-lg">

          {/* ── Age + POPIA gate (shown before everything else) ── */}
          {!ageGatePassed && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-5xl mb-4">🔐</div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">Before we begin</h1>
                <p className="text-slate-400 text-sm">We need to confirm your age and obtain your POPIA consent before you can use OwnMyTwin.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Date of Birth</label>
                <input
                  type="date"
                  value={dobValue}
                  onChange={(e) => setDobValue(e.target.value)}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 text-sm [color-scheme:dark]"
                />
                <p className="text-xs text-slate-600 mt-1">You must be 18 or older to use this platform.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Country</label>
                <select
                  value={countryValue}
                  onChange={(e) => setCountryValue(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 text-sm appearance-none"
                >
                  <option value="">Select your country...</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 text-xs text-slate-400 leading-relaxed">
                <p className="font-semibold text-slate-300 text-sm">POPIA Consent — Protection of Personal Information Act (South Africa)</p>
                <p>By using OwnMyTwin, you consent to the collection and processing of your personal information, including your name, email address, photos, voice recordings, and identity data, for the purpose of operating your AI Twin and licensing your digital identity to approved parties.</p>
                <p>Your data is stored securely and is never sold to third parties. You retain full ownership of your data and may request deletion at any time. All data processing complies with the Protection of Personal Information Act, No. 4 of 2013 (POPIA).</p>
                <p>OwnMyTwin acts as a Responsible Party under POPIA. For queries, contact <span className="text-indigo-400">privacy@ownmytwin.com</span>.</p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={popiAccepted}
                  onChange={(e) => setPopiAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-indigo-600 shrink-0"
                />
                <span className="text-sm text-slate-300 leading-relaxed">
                  I confirm I am 18 years or older and I consent to OwnMyTwin processing my personal information in accordance with POPIA.
                </span>
              </label>

              {ageError && (
                <p className="text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-xl px-4 py-3">{ageError}</p>
              )}

              <button
                onClick={handleAgeGate}
                disabled={savingConsent || !dobValue || !countryValue || !popiAccepted}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors touch-manipulation"
              >
                {savingConsent ? "Saving…" : "I Agree — Continue →"}
              </button>
            </div>
          )}

          {/* Pre-step: Account Type Selection */}
          {ageGatePassed && !accountType && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-5xl mb-4">👋</div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">How are you joining?</h1>
                <p className="text-slate-400 text-sm">Choose the account type that fits you.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => { setAccountType("talent"); setStep(0); }}
                  className="group bg-slate-900 hover:bg-indigo-900/30 border border-slate-700 hover:border-indigo-600 rounded-2xl p-6 text-left transition-all"
                >
                  <div className="text-3xl mb-3">🎭</div>
                  <p className="font-bold text-white text-base mb-1">I&apos;m creating my AI Twin</p>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Talent, creator, professional — build and license your AI identity
                  </p>
                  <div className="mt-4 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                    Continue as Talent →
                  </div>
                </button>

                <button
                  onClick={() => { setAccountType("buyer"); setStep(0); }}
                  className="group bg-slate-900 hover:bg-violet-900/30 border border-slate-700 hover:border-violet-600 rounded-2xl p-6 text-left transition-all"
                >
                  <div className="text-3xl mb-3">🏢</div>
                  <p className="font-bold text-white text-base mb-1">I&apos;m licensing AI Twins</p>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Business, studio, agency, brand — find and license verified AI humans
                  </p>
                  <div className="mt-4 text-xs font-semibold text-violet-400 group-hover:text-violet-300 transition-colors">
                    Continue as Buyer →
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ══ BUYER FLOW ══ */}

          {/* Buyer Step 0: Details */}
          {accountType === "buyer" && step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold mb-2">Tell us about yourself</h2>
                <p className="text-slate-400 text-sm">This helps us tailor your experience. All fields are optional.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Company / Organisation</label>
                <input
                  value={buyerCompany}
                  onChange={(e) => setBuyerCompany(e.target.value)}
                  placeholder="e.g. Acme Studios"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Industry</label>
                <select
                  value={buyerIndustry}
                  onChange={(e) => setBuyerIndustry(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 text-sm appearance-none"
                >
                  <option value="">Select your industry...</option>
                  {INDUSTRIES.map((ind) => (
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 resize-none text-sm leading-relaxed"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setAccountType(null)}
                  className="px-5 border border-slate-700 text-slate-400 hover:text-white py-3.5 rounded-xl text-sm transition-colors touch-manipulation"
                >
                  ←
                </button>
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-semibold py-3.5 rounded-xl transition-colors touch-manipulation"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Buyer Step 1: Ready */}
          {accountType === "buyer" && step === 1 && (
            <div className="text-center space-y-6">
              <div className="text-6xl mb-2">🎉</div>
              <h2 className="text-2xl sm:text-3xl font-bold">You&apos;re all set!</h2>
              <p className="text-slate-400 text-base">
                Browse the marketplace to find AI twins available for licensing. When you find one you like, submit a license request directly.
              </p>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-left space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">What you can do</p>
                {[
                  { icon: "🏪", text: "Browse the marketplace for available AI twins" },
                  { icon: "📬", text: "Submit license requests to talent you want to work with" },
                  { icon: "✓",  text: "Track your request status from your dashboard" },
                  { icon: "🔗", text: "View public profiles shared by talent on social media" },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-3 text-sm">
                    <span className="shrink-0 mt-0.5">{item.icon}</span>
                    <span className="text-slate-400">{item.text}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleFinishBuyer}
                disabled={savingBuyer}
                className="w-full bg-violet-600 hover:bg-violet-500 active:bg-violet-700 disabled:opacity-50 text-white font-semibold py-4 rounded-xl text-lg transition-colors touch-manipulation"
              >
                {savingBuyer ? "Setting up..." : "Go to Dashboard →"}
              </button>
            </div>
          )}

          {/* ══ TALENT FLOW ══ */}

          {/* Step 0: Welcome */}
          {accountType === "talent" && step === 0 && (
            <div className="text-center space-y-6">
              <div className="text-6xl mb-2">🪞</div>
              <h1 className="text-2xl sm:text-3xl font-bold">Welcome to OwnMyTwin</h1>
              <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
                Let&apos;s build your complete digital self in just a few steps. Your data belongs to you — always.
              </p>
              <div className="grid grid-cols-3 gap-3 text-sm py-2">
                {[
                  { icon: "📸", label: "Add your photos" },
                  { icon: "🎙️", label: "Record your voice" },
                  { icon: "🧠", label: "Build your profile" },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 text-center">
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <p className="text-slate-400 text-xs">{item.label}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep(1)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold py-4 rounded-xl text-lg transition-colors touch-manipulation"
              >
                Let&apos;s go →
              </button>
            </div>
          )}

          {/* Step 1: Photos */}
          {accountType === "talent" && step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Add your photos</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Upload photos of yourself — different angles, expressions, lighting. These train your visual likeness for Reel Creator and future features.
                </p>
              </div>

              <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp"
                multiple className="hidden" onChange={handlePhotoUpload} />

              {photos.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2">
                    {photos.map((p) => (
                      <div key={p.id} className="aspect-square rounded-xl overflow-hidden bg-slate-800 border border-slate-700">
                        <Image src={p.url} alt="" width={100} height={100} className="object-cover w-full h-full" />
                      </div>
                    ))}
                    <button onClick={() => photoRef.current?.click()} disabled={uploading}
                      className="aspect-square rounded-xl border-2 border-dashed border-slate-700 hover:border-indigo-600 flex items-center justify-center text-slate-500 hover:text-indigo-400 transition-colors text-2xl touch-manipulation">
                      📁
                    </button>
                    <button onClick={() => setShowCamera(true)} disabled={uploading}
                      className="aspect-square rounded-xl border-2 border-dashed border-slate-700 hover:border-indigo-600 flex items-center justify-center text-slate-500 hover:text-indigo-400 transition-colors text-2xl touch-manipulation">
                      📷
                    </button>
                  </div>
                  <p className={`text-xs ${photos.length >= 5 ? "text-green-500" : "text-amber-500"}`}>
                    {photos.length >= 5 ? `✓ Great — ${photos.length} photos uploaded` : `💡 Aim for 5+ photos for best likeness coverage`}
                  </p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center">
                  <p className="text-4xl mb-4">📸</p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <button onClick={() => photoRef.current?.click()} disabled={uploading}
                      className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 text-slate-300 px-4 py-3 rounded-xl text-sm transition-colors touch-manipulation">
                      📁 Upload Photos
                    </button>
                    <button onClick={() => setShowCamera(true)} disabled={uploading}
                      className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 text-slate-300 px-4 py-3 rounded-xl text-sm transition-colors touch-manipulation">
                      📷 Take Photo
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 mt-3">JPEG, PNG or WebP</p>
                </div>
              )}

              {showCamera && (
                <CameraCapture onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />
              )}

              {uploading && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  Uploading...
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(2)}
                  className="flex-1 border border-slate-700 text-slate-400 hover:text-white py-3.5 rounded-xl text-sm transition-colors touch-manipulation">
                  Skip for now
                </button>
                <button onClick={() => setStep(2)} disabled={uploading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 text-white font-semibold py-3.5 rounded-xl transition-colors touch-manipulation">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Voice */}
          {accountType === "talent" && step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Record your voice</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Read the prompts below out loud. These voice samples capture how you naturally speak — used for your Twin's voice profile and future Reel Creator audio.
                </p>
              </div>

              <VoiceRecorder compact onSaved={() => setVoiceCount(c => c + 1)} />

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)}
                  className="px-5 border border-slate-700 text-slate-400 hover:text-white py-3.5 rounded-xl text-sm transition-colors touch-manipulation">
                  ←
                </button>
                <button onClick={() => setStep(3)}
                  className="flex-1 border border-slate-700 text-slate-400 hover:text-white py-3.5 rounded-xl text-sm transition-colors touch-manipulation">
                  {voiceCount === 0 ? "Skip for now" : "Skip remaining"}
                </button>
                {voiceCount > 0 && (
                  <button onClick={() => setStep(3)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-colors touch-manipulation">
                    Continue → ({voiceCount} saved)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Profile */}
          {accountType === "talent" && step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold mb-2">Build your Twin profile</h2>
                <p className="text-slate-400 text-sm">This is how your Twin thinks and speaks. You can refine it anytime.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Twin Name</label>
                <input value={twinName} onChange={(e) => setTwinName(e.target.value)}
                  placeholder="e.g. Craig's Twin"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">What do you do?</label>
                  <input value={profession} onChange={(e) => setProfession(e.target.value)}
                    placeholder="e.g. Developer"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Where are you based?</label>
                  <input value={location} onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Cape Town"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Your Tone</label>
                <input value={tone} onChange={(e) => setTone(e.target.value)}
                  placeholder="e.g. warm, direct, witty, laid-back"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm" />
                <p className="text-xs text-slate-600 mt-1">Comma-separated words describing how you come across</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Your Core Values</label>
                <input value={values} onChange={(e) => setValues(e.target.value)}
                  placeholder="e.g. honesty, family, creativity, loyalty"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm" />
                <p className="text-xs text-slate-600 mt-1">What matters most to you</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(2)}
                  className="px-5 border border-slate-700 text-slate-400 hover:text-white py-3.5 rounded-xl text-sm transition-colors touch-manipulation">
                  ←
                </button>
                <button onClick={handleSaveProfile} disabled={!twinName.trim() || savingProfile}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 text-white font-semibold py-3.5 rounded-xl transition-colors touch-manipulation">
                  {savingProfile ? "Saving..." : "Save & Continue →"}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Memory */}
          {accountType === "talent" && step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold mb-2">Add your first memory</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Memories make your Twin genuinely personal. Add a life event, belief, relationship — anything that defines you.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Title</label>
                <input value={memTitle} onChange={(e) => setMemTitle(e.target.value)}
                  placeholder="e.g. Growing up in Cape Town"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Tell the story</label>
                <textarea value={memContent} onChange={(e) => setMemContent(e.target.value)}
                  placeholder="Describe this in as much detail as you like — context, emotions, why it matters to you..."
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none text-sm leading-relaxed" />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400 mb-2">Category</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button key={c.value} onClick={() => setMemCategory(c.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all touch-manipulation ${
                        memCategory === c.value
                          ? "bg-indigo-900/50 border-indigo-600 text-white"
                          : "bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-300"
                      }`}>
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(3)}
                  className="px-5 border border-slate-700 text-slate-400 hover:text-white py-3.5 rounded-xl text-sm transition-colors touch-manipulation">
                  ←
                </button>
                <button onClick={() => setStep(5)}
                  className="border border-slate-700 text-slate-400 hover:text-white px-5 py-3.5 rounded-xl text-sm transition-colors touch-manipulation">
                  Skip
                </button>
                <button onClick={handleSaveMemory} disabled={!memTitle.trim() || !memContent.trim() || savingMem}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 text-white font-semibold py-3.5 rounded-xl transition-colors touch-manipulation">
                  {savingMem ? "Saving..." : "Save & Continue →"}
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Done */}
          {accountType === "talent" && step === 5 && (
            <div className="text-center space-y-6">
              <div className="text-6xl mb-2">🎉</div>
              <h2 className="text-2xl sm:text-3xl font-bold">Your Twin is ready</h2>
              <p className="text-slate-400 text-base sm:text-lg">
                You&apos;ve built the foundation of your digital self. Head to the dashboard to explore your Twin.
              </p>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-left space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">What you can do next</p>
                {[
                  { icon: "💬", text: "Use Reply For Me to generate replies in your voice" },
                  { icon: "🧠", text: "Add more memories to deepen your Twin's knowledge" },
                  { icon: "🤖", text: "Refine your Twin's personality and writing style" },
                  { icon: "🎙️", text: "Record more voice samples in your Twin profile" },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-3 text-sm">
                    <span className="shrink-0 mt-0.5">{item.icon}</span>
                    <span className="text-slate-400">{item.text}</span>
                  </div>
                ))}
              </div>

              <button onClick={handleFinish} disabled={finishing}
                className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-4 rounded-xl text-lg transition-colors touch-manipulation">
                {finishing ? "Setting up..." : "Go to Dashboard →"}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
