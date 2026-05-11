import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/landing/navbar";

export default function PrivacyPage() {
  return (
    <div className="relative text-slate-900 min-h-screen">
      <div className="fixed inset-0 -z-10">
        <Image src="/background2.png" alt="" fill className="object-cover object-center" priority />
      </div>
      <Navbar />

      <main className="pt-28 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-sm p-10">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
            <p className="text-sm text-slate-400 mb-10">Last updated: May 2025</p>

            <div className="space-y-8 text-sm leading-relaxed">

              <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">1. Who We Are</h2>
                <p className="text-slate-600">
                  OwnMyTwin is a personal AI identity platform. This Privacy Policy explains what data we collect, why we collect it,
                  and how we protect it. We are committed to data minimalism — we only collect what is necessary to provide the service.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">2. What We Collect</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-slate-800 mb-1">Account information</h3>
                    <p className="text-slate-600">Your name, email address, and authentication credentials when you register.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800 mb-1">Twin profile data</h3>
                    <p className="text-slate-600">
                      Personality traits, values, writing style, tone preferences, and any other identity information
                      you choose to provide to build your OwnMyTwin.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800 mb-1">Memories</h3>
                    <p className="text-slate-600">
                      Life events, relationships, beliefs, preferences, and other personal memories you add to your Twin.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800 mb-1">Usage data</h3>
                    <p className="text-slate-600">
                      Messages sent to and from your Twin, reply history, and general usage patterns — used to improve your Twin's
                      accuracy and personalise your experience.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800 mb-1">Payment information</h3>
                    <p className="text-slate-600">
                      Billing details for Pro subscriptions and monetisation payouts, handled securely by our payment processor.
                      We never store your full card number.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">3. How We Use Your Data</h2>
                <ul className="list-disc list-inside space-y-2 text-slate-600 ml-2">
                  <li>To build, operate, and improve your OwnMyTwin</li>
                  <li>To authenticate your account and keep it secure</li>
                  <li>To process payments and monetisation earnings</li>
                  <li>To send you service-related emails (security alerts, billing receipts, product updates)</li>
                  <li>To comply with legal obligations</li>
                </ul>
                <p className="text-slate-600 mt-3">
                  We do <strong className="text-slate-900">not</strong> use your data to train AI models for other users.
                  We do <strong className="text-slate-900">not</strong> sell your data to advertisers or third parties.
                  We do <strong className="text-slate-900">not</strong> use your identity for any purpose you have not consented to.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">4. Data Storage & Security</h2>
                <p className="text-slate-600 mb-3">
                  Your data is stored on encrypted servers. We use industry-standard security practices including encryption
                  at rest and in transit, access controls, and regular security reviews.
                </p>
                <p className="text-slate-600">
                  Despite these measures, no system is completely immune to security risks. We will notify you promptly in the
                  event of any breach that affects your personal data.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">5. Your Rights</h2>
                <p className="text-slate-600 mb-3">You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 text-slate-600 ml-2">
                  <li><strong className="text-slate-800">Access</strong> — request a copy of all data we hold about you</li>
                  <li><strong className="text-slate-800">Export</strong> — download your Twin profile, memories, and history at any time</li>
                  <li><strong className="text-slate-800">Correct</strong> — update or correct any inaccurate information</li>
                  <li><strong className="text-slate-800">Delete</strong> — permanently delete your account and all associated data</li>
                  <li><strong className="text-slate-800">Object</strong> — opt out of any non-essential data processing</li>
                  <li><strong className="text-slate-800">Portability</strong> — transfer your data to another service in a machine-readable format</li>
                </ul>
                <p className="text-slate-600 mt-3">
                  To exercise any of these rights,{" "}
                  <Link href="/contact" className="text-indigo-600 hover:text-indigo-700 transition-colors">contact us</Link>.
                  We will respond within 30 days.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">6. Third-Party Services</h2>
                <p className="text-slate-600 mb-3">
                  We use a small number of trusted third-party services to operate the Platform:
                </p>
                <ul className="list-disc list-inside space-y-2 text-slate-600 ml-2">
                  <li><strong className="text-slate-800">Anthropic</strong> — AI model provider. Message content is processed to generate Twin responses. Anthropic's API usage policies apply.</li>
                  <li><strong className="text-slate-800">Google</strong> — OAuth sign-in (optional). Only your email and name are shared.</li>
                  <li><strong className="text-slate-800">Payment processor</strong> — for subscription billing and monetisation payouts.</li>
                </ul>
                <p className="text-slate-600 mt-3">
                  We do not share your data with any other third parties.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">7. Cookies</h2>
                <p className="text-slate-600">
                  We use only essential cookies required to keep you signed in and maintain your session. We do not use
                  advertising or tracking cookies. You may disable cookies in your browser, though this may affect your
                  ability to stay signed in.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">8. Data Retention</h2>
                <p className="text-slate-600">
                  We retain your data for as long as your account is active. When you delete your account, all personal data
                  is permanently removed within 30 days, except where we are required by law to retain certain records
                  (such as payment records for tax compliance purposes).
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">9. Changes to This Policy</h2>
                <p className="text-slate-600">
                  We may update this Privacy Policy from time to time. We'll notify you of any material changes via email
                  at least 14 days before they take effect.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">10. Contact</h2>
                <p className="text-slate-600">
                  Privacy questions or data requests?{" "}
                  <Link href="/contact" className="text-indigo-600 hover:text-indigo-700 transition-colors">
                    Get in touch
                  </Link>{" "}
                  and we'll respond within 2 business days.
                </p>
              </section>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
