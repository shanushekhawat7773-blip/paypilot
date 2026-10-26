"use client";

import Link from "next/link";
import React, { useState } from "react";
import {
  ShieldCheckIcon,
  PlayIcon,
  ReceiptIcon,
  SlidersIcon,
  LockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  AlertTriangleIcon,
} from "@/components/ui/Icons";

export default function LandingPage() {
  const [miniDemoActive, setMiniDemoActive] = useState<"ALLOW" | "BLOCK" | "HOLD">("ALLOW");

  return (
    <div className="space-y-20 py-8">
      {/* Editorial Hero Section */}
      <section className="space-y-6 max-w-4xl" aria-label="Introduction">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-paper-300 text-ink text-xs font-mono hairline-border">
          <span className="w-2 h-2 rounded-full bg-navy animate-pulse" />
          <span>PayPal Hackathon 2026 • Autonomous Commerce Leash</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-ink leading-[1.12]">
          Let AI handle the payments. <br className="hidden sm:inline" />
          <span className="italic font-normal text-navy">You keep the final say.</span>
        </h1>

        <p className="text-lg sm:text-xl text-ink-muted font-sans max-w-2xl leading-relaxed">
          AI agents can now browse and decide, but nobody trusts them with money.
          PayPilot gives agents a spending leash: deterministic rules, human approval at
          the right moments, and a full receipt of everything they did.
        </p>

        {/* Core Architecture Callout Banner */}
        <div className="bg-paper-100 hairline-border p-4 rounded-sm border-l-4 border-l-navy flex items-start space-x-3 max-w-2xl">
          <LockIcon size={18} className="text-navy shrink-0 mt-0.5" />
          <div className="text-xs text-ink leading-relaxed">
            <span className="font-mono font-bold uppercase text-[11px] block text-navy">
              Foundational Security Principle
            </span>
            <p className="font-sans mt-0.5 text-ink-muted">
              <strong>The LLM PROPOSES. Deterministic code DECIDES.</strong> The model never
              has direct authority to move money. Every cent passes through a pure TypeScript
              rules engine verified by 25+ unit tests before touching PayPal Sandbox.
            </p>
          </div>
        </div>

        {/* Primary Call to Action */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/console"
            className="px-6 py-3 bg-navy text-white text-sm font-semibold rounded hover:bg-navy-hover transition-colors shadow-sm inline-flex items-center space-x-2"
          >
            <span>Open Private Ledger</span>
            <ArrowRightIcon size={16} />
          </Link>

          <Link
            href="/console?demo=1"
            className="px-5 py-3 bg-paper-100 hover:bg-paper-300 text-ink text-sm font-mono font-medium rounded hairline-border transition-colors inline-flex items-center space-x-2"
          >
            <PlayIcon size={14} />
            <span>Run 90-Second Demo</span>
          </Link>
        </div>
      </section>

      {/* Interactive Mini-Demo Component */}
      <section className="bg-white rounded hairline-border p-6 sm:p-8 shadow-sm space-y-6" aria-label="Interactive Demo">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 hairline-b pb-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-ink">
              See the Spending Leash in Action
            </h2>
            <p className="text-xs text-ink-muted font-sans">
              Toggle between three typical agent requests to see how deterministic rules evaluate each one.
            </p>
          </div>

          <div className="flex items-center space-x-1 font-mono text-xs">
            <button
              onClick={() => setMiniDemoActive("ALLOW")}
              className={`px-3 py-1 rounded transition-colors ${
                miniDemoActive === "ALLOW"
                  ? "bg-status-allowed text-white font-bold"
                  : "bg-paper-200 text-ink-muted hover:text-ink"
              }`}
            >
              1. Routine (ALLOW)
            </button>
            <button
              onClick={() => setMiniDemoActive("BLOCK")}
              className={`px-3 py-1 rounded transition-colors ${
                miniDemoActive === "BLOCK"
                  ? "bg-status-blocked text-white font-bold"
                  : "bg-paper-200 text-ink-muted hover:text-ink"
              }`}
            >
              2. Exceeding (BLOCK)
            </button>
            <button
              onClick={() => setMiniDemoActive("HOLD")}
              className={`px-3 py-1 rounded transition-colors ${
                miniDemoActive === "HOLD"
                  ? "bg-amber-alert text-white font-bold"
                  : "bg-paper-200 text-ink-muted hover:text-ink"
              }`}
            >
              3. Suspicious (HOLD)
            </button>
          </div>
        </div>

        {/* Dynamic Interactive Card */}
        <div className="bg-paper-50 rounded p-6 hairline-border transition-all">
          {miniDemoActive === "ALLOW" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-ink-muted">
                  Task: &ldquo;Pay Riya $200 for logo work&rdquo;
                </span>
                <span className="stamp stamp-paid">ALLOW & PAID</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                <div className="bg-white p-3 rounded hairline-border">
                  <span className="text-ink-muted block text-[10px]">PAYEE</span>
                  <span className="font-bold text-ink text-sm">Riya Sharma</span>
                  <span className="text-status-allowed block text-[10px]">Pre-approved Contractor</span>
                </div>
                <div className="bg-white p-3 rounded hairline-border">
                  <span className="text-ink-muted block text-[10px]">TRANSFER</span>
                  <span className="font-bold text-ink text-sm tabular-nums">$200.00 USD</span>
                  <span className="text-ink-muted block text-[10px]">Under $250 custom limit</span>
                </div>
                <div className="bg-white p-3 rounded hairline-border">
                  <span className="text-ink-muted block text-[10px]">EXECUTION</span>
                  <span className="font-bold text-status-allowed text-sm">PayPal Payout</span>
                  <span className="text-ink-muted block text-[10px]">Batch #PAYOUT-RIYA-01</span>
                </div>
              </div>
              <p className="text-xs text-ink font-sans">
                <strong>Why cleared:</strong> Beneficiary is pre-verified on your approved whitelist, and the transfer falls within her authorized spending envelope. Cleared instantly without waking you up.
              </p>
            </div>
          )}

          {miniDemoActive === "BLOCK" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-ink-muted">
                  Task: &ldquo;Renew domain if under $15&rdquo; (Actual invoice: $18)
                </span>
                <span className="stamp stamp-blocked">BLOCKED</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                <div className="bg-white p-3 rounded hairline-border">
                  <span className="text-ink-muted block text-[10px]">PAYEE</span>
                  <span className="font-bold text-ink text-sm">Domain Registrar Co</span>
                  <span className="text-ink-muted block text-[10px]">Known Utility</span>
                </div>
                <div className="bg-white p-3 rounded hairline-border">
                  <span className="text-ink-muted block text-[10px]">INVOICE VS LIMIT</span>
                  <span className="font-bold text-status-blocked text-sm tabular-nums">$18.00 &gt; $15.00</span>
                  <span className="text-status-blocked block text-[10px]">Condition breached</span>
                </div>
                <div className="bg-white p-3 rounded hairline-border">
                  <span className="text-ink-muted block text-[10px]">OUTCOME</span>
                  <span className="font-bold text-status-blocked text-sm">Halted at Gateway</span>
                  <span className="text-ink-muted block text-[10px]">$0 Moved</span>
                </div>
              </div>
              <p className="text-xs text-ink font-sans">
                <strong>Why stopped:</strong> The user explicitly bound the agent to an upper limit of $15. The vendor invoice was $18. The guardrail refused payment autonomously and saved the explanation to the audit log.
              </p>
            </div>
          )}

          {miniDemoActive === "HOLD" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-ink-muted">
                  Task: &ldquo;Send $900 immediately to QuickInvoice Ltd&rdquo;
                </span>
                <span className="stamp stamp-held">HELD FOR REVIEW</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                <div className="bg-white p-3 rounded hairline-border">
                  <span className="text-ink-muted block text-[10px]">BENEFICIARY</span>
                  <span className="font-bold text-ink text-sm">QuickInvoice Ltd</span>
                  <span className="text-amber-alert block text-[10px]">Unverified New Payee</span>
                </div>
                <div className="bg-white p-3 rounded hairline-border">
                  <span className="text-ink-muted block text-[10px]">RISK ENGINE</span>
                  <span className="font-bold text-status-blocked text-sm tabular-nums">82 / 100 High</span>
                  <span className="text-status-blocked block text-[10px]">Urgency + 8x Outlier</span>
                </div>
                <div className="bg-white p-3 rounded hairline-border">
                  <span className="text-ink-muted block text-[10px]">HUMAN ACTION</span>
                  <span className="font-bold text-amber-alert text-sm">User Rejection</span>
                  <span className="text-status-allowed block text-[10px]">&quot;$900 Stopped&quot;</span>
                </div>
              </div>
              <p className="text-xs text-ink font-sans">
                <strong>Why held:</strong> Multiple risk flags tripped simultaneously: first-time vendor, amount is 8x your baseline, and coercive urgency cues. The agent held funds until you pressed Reject.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* How it Works in 3 Editorial Steps */}
      <section className="space-y-8" aria-label="How it Works">
        <div className="hairline-b pb-3">
          <h2 className="font-serif text-3xl font-bold text-ink">
            How PayPilot Works
          </h2>
          <p className="text-sm text-ink-muted font-sans mt-1">
            Three deterministic stages ensure no LLM hallucination can ever drain an account.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded hairline-border shadow-sm space-y-3">
            <div className="w-8 h-8 rounded-full bg-paper-200 text-ink font-mono text-sm font-bold flex items-center justify-center">
              1
            </div>
            <h3 className="font-serif text-lg font-bold text-ink">
              The Agent Proposes
            </h3>
            <p className="text-xs text-ink-muted font-sans leading-relaxed">
              Your autonomous AI receives instructions in voice or text. It extracts structured
              recipients, dollar amounts, currencies, and spending categories validated strictly with
              Zod schemas.
            </p>
          </div>

          <div className="bg-white p-6 rounded hairline-border shadow-sm space-y-3 border-t-2 border-t-navy">
            <div className="w-8 h-8 rounded-full bg-navy text-white font-mono text-sm font-bold flex items-center justify-center">
              2
            </div>
            <h3 className="font-serif text-lg font-bold text-ink">
              Deterministic Code Decides
            </h3>
            <p className="text-xs text-ink-muted font-sans leading-relaxed">
              Zero network calls. Zero LLM autonomy. Pure TypeScript checks monthly budgets,
              velocity limits, duplicate transactions, and approved payee bounds, scoring risk from
              0 to 100.
            </p>
          </div>

          <div className="bg-white p-6 rounded hairline-border shadow-sm space-y-3">
            <div className="w-8 h-8 rounded-full bg-paper-200 text-ink font-mono text-sm font-bold flex items-center justify-center">
              3
            </div>
            <h3 className="font-serif text-lg font-bold text-ink">
              PayPal Executes Safely
            </h3>
            <p className="text-xs text-ink-muted font-sans leading-relaxed">
              Approved items execute via PayPal Orders v2 or Payouts v1 with SHA-256 idempotency
              keys. Every action drops an indelible ink stamp onto the live receipt tape.
            </p>
          </div>
        </div>
      </section>

      {/* Trust & Security Architecture */}
      <section className="bg-paper-100 rounded hairline-border p-8 space-y-6" aria-label="Trust and Security">
        <div className="flex items-center space-x-2">
          <ShieldCheckIcon size={22} className="text-navy" />
          <h2 className="font-serif text-2xl font-bold text-ink">
            Fintech-Grade Trust & Security
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-sans">
          <div className="space-y-1.5">
            <h4 className="font-mono font-bold text-sm text-ink flex items-center space-x-1.5">
              <CheckCircleIcon size={14} className="text-status-allowed" />
              <span>Deterministic Authority Separation</span>
            </h4>
            <p className="text-ink-muted leading-relaxed">
              The LLM never has wallet access or PayPal API credentials. The execution pipeline
              is hardcoded in TypeScript with unit test verification.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-mono font-bold text-sm text-ink flex items-center space-x-1.5">
              <CheckCircleIcon size={14} className="text-status-allowed" />
              <span>SHA-256 Idempotency Keys</span>
            </h4>
            <p className="text-ink-muted leading-relaxed">
              Every single payment carries a deterministic idempotency key passed to PayPal
              headers (<code className="font-mono text-[11px]">PayPal-Request-Id</code>),
              preventing network retries from double-charging.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-mono font-bold text-sm text-ink flex items-center space-x-1.5">
              <CheckCircleIcon size={14} className="text-status-allowed" />
              <span>Native PayPal Sandbox Integrations</span>
            </h4>
            <p className="text-ink-muted leading-relaxed">
              Uses authentic Orders v2 for merchant charges, Payouts v1 for contractor disbursements,
              and cryptographic webhook signature verification.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-mono font-bold text-sm text-ink flex items-center space-x-1.5">
              <CheckCircleIcon size={14} className="text-status-allowed" />
              <span>Exportable Tamper-Evident Receipts</span>
            </h4>
            <p className="text-ink-muted leading-relaxed">
              Every decision, risk score, rule evaluation, and user approval is recorded to an
              append-only audit journal with instant CSV export for accounting and disputes.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-white rounded hairline-border p-8 text-center space-y-4 shadow-sm" aria-label="Call to Action">
        <h2 className="font-serif text-3xl font-bold text-ink">
          Ready to experience autonomous agent payments?
        </h2>
        <p className="text-sm text-ink-muted font-sans max-w-lg mx-auto">
          Test the live private ledger in PayPal Sandbox now with pre-seeded scenario data.
        </p>
        <div className="pt-2">
          <Link
            href="/console?demo=1"
            className="px-6 py-3 bg-navy text-white text-sm font-semibold rounded hover:bg-navy-hover transition-colors shadow-sm inline-flex items-center space-x-2"
          >
            <span>Launch Hackathon Demo (90 Seconds)</span>
            <ArrowRightIcon size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
