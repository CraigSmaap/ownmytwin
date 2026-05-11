"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";

const TOPICS = [
  { value: "general",      label: "General question" },
  { value: "support",      label: "Account / technical support" },
  { value: "monetisation", label: "Monetisation & earnings" },
  { value: "privacy",      label: "Privacy / data request" },
  { value: "partnership",  label: "Partnership or business" },
  { value: "other",        label: "Something else" },
];

export default function ContactPage() {
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [topic,   setTopic]   = useState("general");
  const [message, setMessage] = useState("");
  const [sent,    setSent]    = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    // Placeholder — wire to an email/API endpoint when ready
    await new Promise((r) => setTimeout(r, 800));
    setSent(true);
    setSending(false);
  }

  return (
    <div className="relative text-slate-900 min-h-screen">
      <div className="fixed inset-0 -z-10">
        <Image src="/background2.png" alt="" fill className="object-cover object-center" priority />
      </div>
      <Navbar />

      <main className="pt-28 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-sm p-10">

            {sent ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✉️</div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Message sent</h2>
                <p className="text-slate-500 mb-6">We'll get back to you within 2 business days.</p>
                <button
                  onClick={() => { setSent(false); setName(""); setEmail(""); setMessage(""); setTopic("general"); }}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Contact us</h1>
                <p className="text-slate-500 text-sm mb-8">
                  We respond to all messages within 2 business days. For urgent account issues, include your registered email.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">Your name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Smith"
                        required
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">Email address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Topic</label>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-colors"
                    >
                      {TOPICS.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us how we can help..."
                      rows={5}
                      required
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm resize-none leading-relaxed transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
                  >
                    {sending ? "Sending..." : "Send message"}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4 text-xs text-slate-400">
                  <Link href="/terms" className="hover:text-slate-600 transition-colors">Terms of Service</Link>
                  <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
                </div>
              </>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
