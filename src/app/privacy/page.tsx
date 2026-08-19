import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Apex Bank",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/dashboard" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          ← Back to Dashboard
        </Link>

        <h1 className="mb-2 text-3xl font-bold">Privacy Policy</h1>
        <p className="mb-8 text-sm text-muted-foreground">Last updated: August 19, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">1. Information We Collect</h2>
            <p>We collect information you provide directly: name, email address, password (encrypted), and transaction history. We also collect automatic information: IP address, browser type, device information, and usage data.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
            <p>We use your information to: provide and maintain the Service, process transactions, send notifications about your account, detect and prevent fraud, comply with legal obligations, and improve our Service.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">3. Information Sharing</h2>
            <p>We do not sell your personal information. We may share your information with: service providers who assist in operating our platform, law enforcement when required by law, and with your explicit consent.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">4. Data Security</h2>
            <p>We implement industry-standard security measures including encryption in transit (TLS) and at rest, JWT authentication with httpOnly cookies, rate limiting, account lockout, and regular security audits.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">5. Data Retention</h2>
            <p>We retain your account information for as long as your account is active. Transaction records are retained for 7 years as required by financial regulations. Audit logs are retained for 2 years.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">6. Your Rights</h2>
            <p>You have the right to: access your personal data, correct inaccurate data, request deletion of your data, export your data in a portable format, and opt out of non-essential communications.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">7. Cookies</h2>
            <p>We use essential cookies for authentication and session management. We do not use tracking cookies without your consent. You can manage cookie preferences through the cookie consent banner.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">8. Children&apos;s Privacy</h2>
            <p>The Service is not intended for users under 18. We do not knowingly collect information from children. If we become aware that we have collected information from a child, we will delete it promptly.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">10. Contact</h2>
            <p>For privacy-related inquiries, contact our Data Protection Officer at <a href="mailto:privacy@apexbank.app" className="text-primary hover:underline">privacy@apexbank.app</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
