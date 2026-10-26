import Link from "next/link";
import { LockIcon, ShieldCheckIcon } from "@/components/ui/Icons";

export default function Footer() {
  return (
    <footer className="w-full bg-paper-100 hairline-t mt-16 py-10 text-xs text-ink-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="font-serif text-lg font-bold text-ink">PayPilot</span>
              <span className="font-mono text-xs px-2 py-0.5 bg-paper-300 rounded hairline-border">
                v1.0.0
              </span>
            </div>
            <p className="font-serif italic text-sm text-ink-muted max-w-md">
              &ldquo;Let AI handle the payments. You keep the final say.&rdquo;
            </p>
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded bg-paper-200 hairline-border text-ink font-mono text-[11px]">
              <LockIcon size={13} className="text-navy" />
              <span>Core Principle: LLM PROPOSES. Deterministic code DECIDES.</span>
            </div>
          </div>

          <div>
            <h4 className="font-mono font-semibold uppercase tracking-wider text-ink mb-3">
              Application
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/console" className="hover:text-ink transition-colors">
                  Console & Planner
                </Link>
              </li>
              <li>
                <Link href="/rules" className="hover:text-ink transition-colors">
                  Guardrails & Simulator
                </Link>
              </li>
              <li>
                <Link href="/activity" className="hover:text-ink transition-colors">
                  Activity & Receipts
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono font-semibold uppercase tracking-wider text-ink mb-3">
              PayPal Integration
            </h4>
            <ul className="space-y-2">
              <li>
                <span className="text-ink">Orders v2 API</span> (Purchases & Subscriptions)
              </li>
              <li>
                <span className="text-ink">Payouts v1 API</span> (Contractors & People)
              </li>
              <li>
                <span className="text-ink">Webhooks Verification</span> (HMAC Signature)
              </li>
              <li>
                <span className="text-ink">Idempotency-Key</span> (PayPal-Request-Id)
              </li>
            </ul>
          </div>
        </div>

        <div className="hairline-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px]">
          <p>© 2026 PayPilot. Built for the PayPal Hackathon. Verified on PayPal Sandbox.</p>
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center space-x-1 text-status-allowed">
              <ShieldCheckIcon size={14} />
              <span>WCAG AA Accessible</span>
            </span>
            <span>•</span>
            <span>Deterministic TypeScript Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
