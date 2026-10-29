"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TaskInput from "@/components/console/TaskInput";
import PlanPreview from "@/components/console/PlanPreview";
import LiveAuditTape from "@/components/console/LiveAuditTape";
import LedgerMetrics from "@/components/dashboard/LedgerMetrics";
import { PaymentPlan, AuditEntry, PaymentStep } from "@/types/payment";
import { PlayIcon, ShieldCheckIcon, AlertTriangleIcon } from "@/components/ui/Icons";

function ConsoleContent() {
  const searchParams = useSearchParams();
  const autoDemo = searchParams.get("demo");

  const [plan, setPlan] = useState<PaymentPlan | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [currentSpend, setCurrentSpend] = useState<number>(351.0);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(3500.0);
  const [totalBlockedSavings, setTotalBlockedSavings] = useState<number>(340.0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessingStep, setIsProcessingStep] = useState<boolean>(false);
  const [demoBannerMessage, setDemoBannerMessage] = useState<string | null>(null);

  // Load state and audit tape
  const refreshState = useCallback(async () => {
    try {
      const [stateRes, auditRes] = await Promise.all([
        fetch("/api/state"),
        fetch("/api/audit"),
      ]);

      if (stateRes.ok) {
        const stateData = await stateRes.json();
        setCurrentSpend(stateData.currentMonthSpend);
        setMonthlyBudget(stateData.monthlyBudget);
        setTotalBlockedSavings(stateData.totalBlockedSavings);
        if (stateData.activePlan) {
          setPlan(stateData.activePlan);
        }
      }

      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditEntries(auditData.entries || []);
      }
    } catch (err) {
      console.warn("Failed to load state:", err);
    }
  }, []);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // Run the canonical demo scenario
  const handleRunDemo = useCallback(async () => {
    setIsLoading(true);
    setDemoBannerMessage(
      "Running 90s Hackathon Demo Scenario: Step 1 (Riya $200) ALLOWED & Paid; Step 2 (Domain $18) BLOCKED (> $15); Step 3 (QuickInvoice $900) HELD for approval."
    );

    try {
      const res = await fetch("/api/demo/run", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPlan(data.plan);
        setTotalBlockedSavings(data.totalBlockedSavings);
      }
      await refreshState();
    } catch (err) {
      console.error("Demo run error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [refreshState]);

  // Auto-run demo if ?demo=1
  useEffect(() => {
    if (autoDemo === "1") {
      handleRunDemo();
    }
  }, [autoDemo, handleRunDemo]);

  // Submit custom natural language task
  const handleTaskSubmit = async (prompt: string) => {
    setIsLoading(true);
    setDemoBannerMessage(null);
    try {
      // 1. Structure with LLM Planner
      const planRes = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!planRes.ok) throw new Error("Planning request failed");
      const planData = await planRes.json();

      // 2. Evaluate with Deterministic Guardrails
      const evalRes = await fetch("/api/guardrails/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps: planData.plan.steps }),
      });

      if (!evalRes.ok) throw new Error("Evaluation failed");
      const evalData = await evalRes.json();

      setPlan({
        ...planData.plan,
        steps: evalData.steps,
      });

      await refreshState();
    } catch (err: any) {
      alert(`Error processing payment request: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Step Action: Approve
  const handleApprove = async (stepId: string) => {
    setIsProcessingStep(true);
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId, action: "APPROVE" }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update local step
        if (plan) {
          setPlan({
            ...plan,
            steps: plan.steps.map((s) => (s.id === stepId ? data.step : s)),
          });
        }
      }
      await refreshState();
    } catch (err) {
      console.error("Approval error:", err);
    } finally {
      setIsProcessingStep(false);
    }
  };

  // Step Action: Reject (e.g. QuickInvoice $900 in demo scenario)
  const handleReject = async (stepId: string) => {
    setIsProcessingStep(true);
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId, action: "REJECT" }),
      });

      if (res.ok) {
        const data = await res.json();
        if (plan) {
          setPlan({
            ...plan,
            steps: plan.steps.map((s) => (s.id === stepId ? data.step : s)),
          });
        }
        setTotalBlockedSavings(data.totalBlockedSavings);
      }
      await refreshState();
    } catch (err) {
      console.error("Rejection error:", err);
    } finally {
      setIsProcessingStep(false);
    }
  };

  // Step Action: Edit Amount
  const handleEditAmount = async (stepId: string, newAmount: number) => {
    setIsProcessingStep(true);
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepId,
          action: "EDIT",
          editedAmount: newAmount,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (plan) {
          setPlan({
            ...plan,
            steps: plan.steps.map((s) => (s.id === stepId ? data.step : s)),
          });
        }
      }
      await refreshState();
    } catch (err) {
      console.error("Edit error:", err);
    } finally {
      setIsProcessingStep(false);
    }
  };

  const pendingApprovalsCount =
    plan?.steps.filter(
      (s) =>
        s.decision === "HOLD_FOR_APPROVAL" &&
        s.executionStatus === "PENDING_REVIEW"
    ).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Top Banner if demo is active */}
      {demoBannerMessage && (
        <div className="bg-paper-100 hairline-border p-3 rounded flex items-center justify-between text-xs font-mono text-ink">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-status-allowed animate-pulse" />
            <span>{demoBannerMessage}</span>
          </div>
          <button
            onClick={() => setDemoBannerMessage(null)}
            className="text-ink-muted hover:text-ink font-bold text-sm px-1"
          >
            ×
          </button>
        </div>
      )}

      {/* High-level Ledger Metrics */}
      <LedgerMetrics
        currentSpend={currentSpend}
        monthlyBudget={monthlyBudget}
        totalBlockedSavings={totalBlockedSavings}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      {/* Main Asymmetric Console Grid: 7 Cols Main Column + 5 Cols Live Audit Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Task Input + Plan Preview (7 Cols) */}
        <section className="lg:col-span-7 space-y-6" aria-label="Agent Console Execution">
          <TaskInput
            onSubmit={handleTaskSubmit}
            onRunDemo={handleRunDemo}
            isLoading={isLoading}
          />

          {plan ? (
            <PlanPreview
              plan={plan}
              onApprove={handleApprove}
              onReject={handleReject}
              onEditAmount={handleEditAmount}
              isProcessing={isProcessingStep}
            />
          ) : (
            <div className="bg-white rounded hairline-border p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-paper-200 text-navy mx-auto flex items-center justify-center">
                <ShieldCheckIcon size={20} />
              </div>
              <h3 className="font-serif text-lg font-bold text-ink">
                No active payment plan
              </h3>
              <p className="text-xs text-ink-muted font-sans max-w-md mx-auto leading-relaxed">
                State an instruction above, or run the 90-second demo scenario to
                observe PayPilot&apos;s deterministic spending leash in action.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleRunDemo}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-paper-100 hover:bg-paper-300 text-ink text-xs font-mono font-medium rounded hairline-border transition-colors"
                >
                  <PlayIcon size={12} />
                  <span>Load Demo: Riya + Domain + QuickInvoice</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Right Rail: Signature Live Audit Tape (5 Cols) */}
        <aside className="lg:col-span-5" aria-label="Cryptographic Audit Tape Rail">
          <div className="sticky top-20">
            <LiveAuditTape
              entries={auditEntries}
              onRefresh={refreshState}
              isLoading={isLoading}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function ConsolePage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center font-mono text-xs text-ink-muted">
          Loading Private Ledger Console...
        </div>
      }
    >
      <ConsoleContent />
    </Suspense>
  );
}
