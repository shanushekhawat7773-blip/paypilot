"use client";

import React from "react";
import { PaymentPlan, PaymentStep } from "@/types/payment";
import ApprovalCard from "./ApprovalCard";
import {
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  LockIcon,
  ShieldCheckIcon,
} from "@/components/ui/Icons";

interface PlanPreviewProps {
  plan: PaymentPlan;
  onApprove: (stepId: string) => void;
  onReject: (stepId: string) => void;
  onEditAmount: (stepId: string, newAmount: number) => void;
  isProcessing?: boolean;
}

export default function PlanPreview({
  plan,
  onApprove,
  onReject,
  onEditAmount,
  isProcessing = false,
}: PlanPreviewProps) {
  const getDecisionBadge = (step: PaymentStep) => {
    if (step.executionStatus === "PAID") {
      return (
        <span className="stamp stamp-paid">
          PAID
        </span>
      );
    }

    if (step.executionStatus === "REJECTED") {
      return (
        <span className="stamp stamp-blocked">
          REJECTED
        </span>
      );
    }

    if (step.decision === "BLOCK" || step.executionStatus === "BLOCKED") {
      return (
        <span className="stamp stamp-blocked">
          BLOCKED
        </span>
      );
    }

    if (step.decision === "HOLD_FOR_APPROVAL" || step.executionStatus === "PENDING_REVIEW") {
      return (
        <span className="stamp stamp-held">
          HELD
        </span>
      );
    }

    if (step.decision === "ALLOW" || step.executionStatus === "APPROVED") {
      return (
        <span className="stamp stamp-paid">
          ALLOWED
        </span>
      );
    }

    return (
      <span className="stamp stamp-verified">
        QUEUED
      </span>
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* Plan Header */}
      <div className="bg-paper-100 rounded hairline-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs uppercase font-bold text-ink">
              Structured Plan Execution
            </span>
            <span className="font-mono text-[10px] text-ink-muted px-1.5 py-0.5 bg-paper-300 rounded">
              {plan.steps.length} Steps
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-muted italic font-serif">
            &ldquo;{plan.originalPrompt}&rdquo;
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-mono uppercase text-ink-muted block">
            Total Planned Volume
          </span>
          <span className="font-mono text-lg font-bold text-ink tabular-nums">
            ${plan.totalPlannedAmount.toFixed(2)} USD
          </span>
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-4">
        {plan.steps.map((step, index) => {
          const isHeld =
            step.decision === "HOLD_FOR_APPROVAL" &&
            step.executionStatus === "PENDING_REVIEW";

          return (
            <div key={step.id} className="space-y-2">
              {isHeld ? (
                // Prominent Approval Card for Held Steps
                <ApprovalCard
                  step={step}
                  onApprove={onApprove}
                  onReject={onReject}
                  onEditAmount={onEditAmount}
                  isProcessing={isProcessing}
                />
              ) : (
                // Standard Step Row
                <div
                  className={`bg-white rounded hairline-border p-4 transition-all ${
                    step.decision === "BLOCK"
                      ? "border-l-4 border-l-status-blocked bg-status-blockedBg/30"
                      : step.executionStatus === "PAID"
                      ? "border-l-4 border-l-status-allowed"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-paper-200 text-ink font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-ink">
                            {step.payee}
                          </span>
                          <span className="text-xs font-mono text-ink-muted">
                            ({step.payeeIdentifier || "N/A"})
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-paper-200 rounded text-ink-muted">
                            {step.category}
                          </span>
                        </div>

                        <p className="text-xs text-ink-muted font-sans">
                          {step.purpose}
                        </p>

                        {step.condition && (
                          <div className="text-[11px] font-mono text-status-held bg-amber-50 px-2 py-0.5 rounded inline-block">
                            Condition: {step.condition} (Limit: ${step.conditionLimit?.toFixed(2)})
                          </div>
                        )}

                        {/* Guardrail Policy Outcome */}
                        {step.guardrailResult && (
                          <div className="pt-1 text-xs font-mono text-ink-muted flex items-start space-x-1.5">
                            {step.decision === "BLOCK" ? (
                              <XCircleIcon size={14} className="text-status-blocked shrink-0 mt-0.5" />
                            ) : (
                              <CheckCircleIcon size={14} className="text-status-allowed shrink-0 mt-0.5" />
                            )}
                            <div>
                              <span className="font-semibold text-ink">
                                {step.guardrailResult.triggeredRule}:
                              </span>{" "}
                              <span>{step.guardrailResult.reasoning}</span>
                            </div>
                          </div>
                        )}

                        {/* PayPal Execution Reference */}
                        {step.executionStatus === "PAID" && (
                          <div className="pt-1 text-[11px] font-mono text-status-allowed flex items-center space-x-2">
                            <ShieldCheckIcon size={13} />
                            <span>
                              Settled via PayPal Sandbox (Ref:{" "}
                              {step.paypalPayoutBatchId || step.paypalOrderId || step.idempotencyKey?.substring(0, 10)}
                              )
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end space-y-1">
                      <div className="font-mono text-base font-bold text-ink tabular-nums">
                        ${step.amount.toFixed(2)} {step.currency}
                      </div>
                      <div>{getDecisionBadge(step)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
