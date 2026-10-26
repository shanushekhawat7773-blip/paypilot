"use client";

import React, { useState } from "react";
import { PaymentStep } from "@/types/payment";
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EditIcon,
  LockIcon,
  ShieldCheckIcon,
} from "@/components/ui/Icons";

interface ApprovalCardProps {
  step: PaymentStep;
  onApprove: (stepId: string) => void;
  onReject: (stepId: string) => void;
  onEditAmount: (stepId: string, newAmount: number) => void;
  isProcessing?: boolean;
}

export default function ApprovalCard({
  step,
  onApprove,
  onReject,
  onEditAmount,
  isProcessing = false,
}: ApprovalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(step.amount.toString());

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed) && parsed > 0) {
      onEditAmount(step.id, parsed);
      setIsEditing(false);
    }
  };

  const riskScore = step.riskAssessment?.overallScore ?? 50;
  const riskLevel = step.riskAssessment?.level ?? "MEDIUM";
  const ruleName = step.guardrailResult?.triggeredRule ?? "Approval Threshold Policy";
  const reasoning = step.guardrailResult?.reasoning ?? "Requires user confirmation.";

  return (
    <article
      className="bg-paper-50 rounded hairline-border p-5 shadow-sm border-l-4 border-l-amber-alert transition-all"
      aria-labelledby={`card-title-${step.id}`}
      role="region"
    >
      {/* Top Banner: Status + Risk Pill */}
      <div className="flex items-center justify-between pb-3 hairline-b mb-4">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-amber-alert"></span>
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-amber-alert">
            Held for Your Confirmation
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`font-mono text-xs px-2 py-0.5 rounded font-bold ${
              riskScore >= 65
                ? "bg-red-100 text-status-blocked"
                : riskScore >= 30
                ? "bg-amber-100 text-status-held"
                : "bg-green-100 text-status-allowed"
            }`}
          >
            Risk Score: {riskScore}/100 ({riskLevel})
          </span>
        </div>
      </div>

      {/* Main Payment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <span className="text-[11px] font-mono uppercase text-ink-muted block mb-0.5">
            Payee & Destination
          </span>
          <div className="text-base font-bold text-ink" id={`card-title-${step.id}`}>
            {step.payee}
          </div>
          <div className="text-xs font-mono text-ink-muted truncate">
            {step.payeeIdentifier || "No prior record on file"}
          </div>
          <div className="mt-1 inline-flex items-center px-1.5 py-0.5 bg-paper-200 text-ink text-[10px] font-mono rounded">
            Category: {step.category}
          </div>
        </div>

        <div>
          <span className="text-[11px] font-mono uppercase text-ink-muted block mb-0.5">
            Proposed Transfer
          </span>
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="flex items-center space-x-2 mt-1">
              <div className="relative">
                <span className="absolute left-2 top-1.5 text-xs font-mono text-ink-muted">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-28 pl-6 pr-2 py-1 text-sm font-mono font-bold bg-white hairline-border rounded focus:outline-none focus:ring-1 focus:ring-navy"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="px-2.5 py-1 text-xs font-mono bg-navy text-white rounded hover:bg-navy-hover transition-colors"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-2 py-1 text-xs font-mono text-ink-muted hover:text-ink rounded"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex items-baseline space-x-2">
              <span className="font-mono text-2xl font-bold text-ink tabular-nums">
                ${step.amount.toFixed(2)}
              </span>
              <span className="text-xs font-mono text-ink-muted">{step.currency}</span>
              <button
                onClick={() => setIsEditing(true)}
                className="ml-2 text-ink-muted hover:text-ink p-1 rounded hover:bg-paper-200 transition-colors"
                title="Edit payment amount"
                aria-label="Edit payment amount"
              >
                <EditIcon size={14} />
              </button>
            </div>
          )}
          <p className="mt-1 text-xs text-ink-muted italic">
            &ldquo;{step.purpose}&rdquo;
          </p>
        </div>
      </div>

      {/* Why it was held - Calm Human Explanatory Microcopy */}
      <div className="bg-paper-100 rounded hairline-border p-3 mb-5">
        <div className="flex items-start space-x-2">
          <AlertTriangleIcon size={16} className="text-amber-alert shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-ink leading-relaxed">
            <span className="font-semibold block font-mono text-[11px] text-ink">
              Policy Trigger: {ruleName}
            </span>
            <p className="text-ink-muted font-sans">{reasoning}</p>
            {step.riskAssessment?.explanation && (
              <p className="text-ink-muted font-sans pt-1 hairline-t">
                {step.riskAssessment.explanation}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 hairline-t">
        <div className="text-[11px] font-mono text-ink-subtle flex items-center space-x-1">
          <ShieldCheckIcon size={13} className="text-navy" />
          <span>PayPal Sandbox Protection Engaged</span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onReject(step.id)}
            disabled={isProcessing}
            className="px-3.5 py-1.5 text-xs font-semibold text-status-blocked bg-status-blockedBg hover:bg-red-100 hairline-border rounded transition-colors flex items-center space-x-1.5 focus:ring-2 focus:ring-red-400"
          >
            <XCircleIcon size={14} />
            <span>Reject Payment</span>
          </button>

          <button
            onClick={() => onApprove(step.id)}
            disabled={isProcessing}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-navy hover:bg-navy-hover rounded transition-colors flex items-center space-x-1.5 shadow-sm focus:ring-2 focus:ring-navy"
          >
            <CheckCircleIcon size={14} />
            <span>Approve with PayPal</span>
          </button>
        </div>
      </div>
    </article>
  );
}
