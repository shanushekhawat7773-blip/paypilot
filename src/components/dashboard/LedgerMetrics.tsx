"use client";

import React from "react";
import { ShieldCheckIcon, AlertTriangleIcon, LockIcon } from "@/components/ui/Icons";

interface LedgerMetricsProps {
  currentSpend: number;
  monthlyBudget: number;
  totalBlockedSavings: number;
  pendingApprovalsCount: number;
}

export default function LedgerMetrics({
  currentSpend,
  monthlyBudget,
  totalBlockedSavings,
  pendingApprovalsCount,
}: LedgerMetricsProps) {
  const percentUsed = Math.min(
    Math.round((currentSpend / Math.max(monthlyBudget, 1)) * 100),
    100
  );

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1: Monthly Spending Leash */}
      <div className="bg-white rounded hairline-border p-4 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs font-mono text-ink-muted mb-1">
            <span>MONTHLY SPEND</span>
            <span className="font-semibold text-ink">{percentUsed}% of budget</span>
          </div>
          <div className="font-mono text-2xl font-bold text-ink tabular-nums">
            ${currentSpend.toFixed(2)}
          </div>
          <div className="text-[11px] font-mono text-ink-subtle">
            of ${monthlyBudget.toFixed(2)} USD limit
          </div>
        </div>

        {/* Meter bar */}
        <div className="mt-3 w-full bg-paper-300 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              percentUsed > 85
                ? "bg-status-blocked"
                : percentUsed > 60
                ? "bg-amber-alert"
                : "bg-navy"
            }`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
      </div>

      {/* Metric 2: Savings from Blocked Payments (Key Feature) */}
      <div className="bg-white rounded hairline-border p-4 shadow-sm border-t-2 border-t-status-allowed flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs font-mono text-status-allowed mb-1">
            <span className="flex items-center space-x-1">
              <ShieldCheckIcon size={13} />
              <span>PAYPILOT STOPPED</span>
            </span>
            <span className="text-[10px] bg-green-50 px-1.5 py-0.2 rounded font-bold">
              PROTECTED
            </span>
          </div>
          <div className="font-mono text-2xl font-bold text-status-allowed tabular-nums">
            ${totalBlockedSavings.toFixed(2)}
          </div>
          <div className="text-[11px] text-ink-muted">
            Preserved from unverified, rogue, or exceeding requests
          </div>
        </div>
        <div className="mt-2 text-[10px] font-mono text-ink-subtle">
          Autonomous leash actively enforced
        </div>
      </div>

      {/* Metric 3: Pending Approvals */}
      <div className="bg-white rounded hairline-border p-4 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs font-mono text-ink-muted mb-1">
            <span>PENDING APPROVALS</span>
            {pendingApprovalsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-alert animate-ping" />
            )}
          </div>
          <div className="font-mono text-2xl font-bold text-ink tabular-nums">
            {pendingApprovalsCount}
          </div>
          <div className="text-[11px] text-ink-muted">
            {pendingApprovalsCount === 0
              ? "All actions cleared or resolved"
              : "Awaiting human review on the console"}
          </div>
        </div>
        <div className="mt-2 text-[10px] font-mono text-ink-subtle">
          Zero funds moved without OK
        </div>
      </div>

      {/* Metric 4: Deterministic Guardrails Policy */}
      <div className="bg-white rounded hairline-border p-4 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs font-mono text-ink-muted mb-1">
            <span>ENGINE STATUS</span>
            <span className="text-[10px] bg-paper-200 text-ink px-1.5 py-0.2 rounded font-bold">
              ENFORCING
            </span>
          </div>
          <div className="font-serif text-lg font-bold text-ink mt-0.5">
            Deterministic Engine
          </div>
          <div className="text-[11px] text-ink-muted">
            LLM Proposes • Plain TypeScript Decides
          </div>
        </div>
        <div className="mt-2 flex items-center space-x-1.5 text-[10px] font-mono text-navy font-semibold">
          <LockIcon size={12} />
          <span>PayPal Sandbox Linked</span>
        </div>
      </div>
    </div>
  );
}
