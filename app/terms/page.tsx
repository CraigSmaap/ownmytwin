import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/landing/navbar";

export default function TermsPage() {
  return (
    <div className="relative text-slate-900 min-h-screen">
      <div className="fixed inset-0 -z-10">
        <Image src="/background2.png" alt="" fill className="object-cover object-center" priority />
      </div>
      <Navbar />

      <main className="pt-28 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-sm p-10">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
            <p className="text-sm text-slate-400 mb-10">Last updated: May 2025</p>

            <div className="prose prose-slate max-w-none space-y-8 text-sm leading-relaxed">

              <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">1. Acceptance of Terms</h2>
                <p className="text-slate-600">
                  By creating an account or using OwnMyTwin ("the Platform", "we", "us"), you agree to these Terms of Service.
                  If you do not agree, please do not use the Platform. These terms constitute a legally binding agreement
                  between you and OwnMyTwin.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">2. Your Account</h2>
                <p className="text-slate-600 mb-3">
                  You are responsible for maintaining the security of your account and all activity that occurs under it.
                  You must provide accurate information when creating an account. You must be at least 18 years old to use the Platform.
                </p>
                <p className="text-slate-600">
                  We reserve the right to suspend or terminate accounts that violate these Terms, engage in abuse, or misrepresent
                  their identity.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">3. Your OwnMyTwin — Ownership</h2>
                <p className="text-slate-600 mb-3">
                  <strong className="text-slate-900">You own your OwnMyTwin.</strong> All personality data, memories, writing style,
                  and identity information you provide belongs to you. We do not claim ownership over your digital identity,
                  your data, or the outputs your Twin generates.
                </p>
                <p className="text-slate-600">
                  Your data will never be sold to third parties, used to train other users' AI models, or shared without your
                  explicit consent. You may export or permanently delete your Twin and all associated data at any time.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">4. Monetisation & Revenue Share</h2>
                <p className="text-slate-600 mb-3">
                  Pro users may choose to monetise their OwnMyTwin — licensing it to brands, fans, or businesses on terms they set.
                  When you generate revenue through the Platform's monetisation features, OwnMyTwin retains a <strong className="text-slate-900">20% platform fee</strong> and
                  you receive <strong className="text-slate-900">80% of all earnings</strong>.
                </p>
                <p className="text-slate-600 mb-3">
                  This fee covers platform infrastructure, payment processing, fraud protection, and ongoing development.
                  Payouts are processed monthly to your nominated payment method, provided your balance exceeds the minimum
                  payout threshold of $25.
                </p>
                <p className="text-slate-600">
                  You are responsible for declaring and paying any applicable taxes on earnings received through the Platform.
                  OwnMyTwin will issue earnings summaries upon request to assist with tax reporting.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">5. Acceptable Use</h2>
                <p className="text-slate-600 mb-3">You agree not to use the Platform to:</p>
                <ul className="list-disc list-inside space-y-2 text-slate-600 ml-2">
                  <li>Impersonate any real person without their explicit written consent</li>
                  <li>Generate content that is defamatory, threatening, or harassing</li>
                  <li>Create or distribute illegal content of any kind</li>
                  <li>Attempt to reverse-engineer, scrape, or exploit the Platform's systems</li>
                  <li>Use AI-generated outputs to deceive others in a harmful way</li>
                  <li>Violate any applicable laws or third-party rights</li>
                </ul>
                <p className="text-slate-600 mt-3">
                  Violations may result in immediate account suspension and forfeiture of any pending earnings.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">6. AI-Generated Content</h2>
                <p className="text-slate-600">
                  Your Twin's outputs are generated by AI and may not always be accurate, appropriate, or reflective of your
                  actual views. You are responsible for reviewing AI-generated content before using or sharing it. OwnMyTwin
                  makes no warranty regarding the accuracy or suitability of outputs for any particular purpose.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">7. Subscription & Billing</h2>
                <p className="text-slate-600 mb-3">
                  Free tier users have access to limited features as described on our pricing page. Pro subscriptions are billed
                  monthly or annually. You may cancel at any time — your access continues until the end of the billing period.
                  We do not offer refunds for partial billing periods.
                </p>
                <p className="text-slate-600">
                  We reserve the right to change pricing with 30 days' notice. Existing subscribers will be notified by email
                  before any price change takes effect.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">8. Limitation of Liability</h2>
                <p className="text-slate-600">
                  To the maximum extent permitted by law, OwnMyTwin is not liable for any indirect, incidental, or consequential
                  damages arising from your use of the Platform, including loss of earnings, data, or reputation. Our total
                  liability to you for any claim shall not exceed the amount you paid us in the 12 months preceding the claim.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">9. Changes to These Terms</h2>
                <p className="text-slate-600">
                  We may update these Terms from time to time. We will notify you of material changes via email or an in-app
                  notice at least 14 days before they take effect. Continued use of the Platform after changes constitutes
                  acceptance of the updated Terms.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">10. Contact</h2>
                <p className="text-slate-600">
                  Questions about these Terms?{" "}
                  <Link href="/contact" className="text-indigo-600 hover:text-indigo-700 transition-colors">
                    Contact us
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
