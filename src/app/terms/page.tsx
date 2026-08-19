import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Apex Bank",
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/dashboard" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          ← Back to Dashboard
        </Link>

        <h1 className="mb-2 text-3xl font-bold">Terms of Service</h1>
        <p className="mb-8 text-sm text-muted-foreground">Last updated: August 19, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>By accessing or using Apex Bank (&quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">2. Eligibility</h2>
            <p>You must be at least 18 years of age and a legal resident of the United States to use this Service. By using the Service, you represent and warrant that you meet these requirements.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">3. Account Registration</h2>
            <p>You must provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">4. Acceptable Use</h2>
            <p>You agree not to use the Service for any unlawful purpose, to transfer funds obtained illegally, to impersonate any person or entity, or to attempt to gain unauthorized access to any portion of the Service.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">5. Transactions</h2>
            <p>All transactions are subject to our verification and fraud prevention systems. We reserve the right to hold, delay, or cancel any transaction that we reasonably suspect may be fraudulent, unauthorized, or violate these terms.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">6. Fees</h2>
            <p>Apex Bank currently charges no fees for standard account usage. We reserve the right to introduce fees with 30 days&apos; prior notice.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">7. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Apex Bank shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">8. Termination</h2>
            <p>We may suspend or terminate your access to the Service at any time, with or without cause, with or without notice. Upon termination, your right to use the Service ceases immediately.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">9. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the Service constitutes acceptance of the modified terms.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">10. Contact</h2>
            <p>Questions about these Terms should be sent to <a href="mailto:legal@apexbank.app" className="text-primary hover:underline">legal@apexbank.app</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
