import { NextResponse } from "next/server";
import { store } from "@/lib/storage/store";
import { offlineFallbackPlanner } from "@/lib/planner/planner";
import { evaluateGuardrails } from "@/lib/guardrails/engine";
import { assessPaymentRisk } from "@/lib/risk/scorer";
import { createAuditEntry } from "@/lib/audit/tape";
import { generateIdempotencyKey } from "@/lib/paypal/client";
import { PaymentStep } from "@/types/payment";

export async function POST() {
  try {
    const demoPrompt =
      "Pay Riya $200 for the logo work, renew my domain if it's under $15, and send $900 to a new vendor called QuickInvoice Ltd.";

    // Reset demo state for a clean repeatable run
    store.activePlan = null;

    // 1. Audit: Task received
    store.addAuditEntry(
      createAuditEntry({
        eventType: "TASK_RECEIVED",
        title: "Demo Scenario Activated",
        detail: `Executing prompt: "${demoPrompt}"`,
      })
    );

    // 2. Structured Planning
    const plan = offlineFallbackPlanner(demoPrompt);

    store.addAuditEntry(
      createAuditEntry({
        eventType: "PLAN_STRUCTURED",
        title: "Plan Decomposed: 3 Distinct Operations",
        detail:
          "1. Riya Sharma ($200) contractor payout; 2. Domain renewal ($18, limit $15); 3. QuickInvoice Ltd ($900 invoice).",
      })
    );

    const evaluatedSteps = [];

    // Step 1: Riya $200 -> ALLOW -> Settled via PayPal Payout
    const riyaStep: PaymentStep = {
      ...plan.steps[0],
      executionStatus: "PENDING_REVIEW",
    };
    const riyaGuardrail = evaluateGuardrails(riyaStep, {
      rules: store.rules,
      approvedPayees: store.approvedPayees,
      recentPayments: store.historicalPayments,
      currentMonthTotalSpend: store.getCurrentMonthSpend(),
    });
    const riyaRisk = assessPaymentRisk(riyaStep, {
      approvedPayees: store.approvedPayees,
    });
    const riyaIdempotency = generateIdempotencyKey(
      riyaStep.id,
      riyaStep.payee,
      riyaStep.amount
    );

    riyaStep.guardrailResult = riyaGuardrail;
    riyaStep.riskAssessment = riyaRisk;
    riyaStep.decision = "ALLOW";
    riyaStep.executionStatus = "PAID";
    riyaStep.idempotencyKey = riyaIdempotency;
    riyaStep.paypalPayoutBatchId = `SANDBOX-PAYOUT-RIYA-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;
    riyaStep.executedAt = new Date().toISOString();

    store.historicalPayments.unshift(riyaStep);

    store.addAuditEntry(
      createAuditEntry({
        eventType: "RULE_CHECKED",
        title: "Guardrail Check: Riya Sharma ($200.00)",
        detail:
          "Pre-approved contractor within authorized spending threshold ($200.00 <= $250.00).",
        payee: "Riya Sharma",
        amount: 200,
        currency: "USD",
        stepId: riyaStep.id,
      })
    );

    store.addAuditEntry(
      createAuditEntry({
        eventType: "PAYPAL_PAYOUT_SENT",
        title: "PayPal Sandbox Payout Executed: Riya Sharma",
        detail: `Batch ${riyaStep.paypalPayoutBatchId} released funds to riya.design@example.com. Idempotency ref: ${riyaIdempotency.substring(
          0,
          12
        )}...`,
        payee: "Riya Sharma",
        amount: 200,
        currency: "USD",
        statusStamp: "PAID",
        stepId: riyaStep.id,
        idempotencyKey: riyaIdempotency,
      })
    );

    evaluatedSteps.push(riyaStep);

    // Step 2: Domain at $18 -> Condition $15 -> BLOCK
    const domainStep: PaymentStep = {
      ...plan.steps[1],
      executionStatus: "PENDING_REVIEW",
    };
    const domainGuardrail = evaluateGuardrails(domainStep, {
      rules: store.rules,
      approvedPayees: store.approvedPayees,
      recentPayments: store.historicalPayments,
      currentMonthTotalSpend: store.getCurrentMonthSpend(),
    });
    const domainRisk = assessPaymentRisk(domainStep, {
      approvedPayees: store.approvedPayees,
    });

    domainStep.guardrailResult = domainGuardrail;
    domainStep.riskAssessment = domainRisk;
    domainStep.decision = "BLOCK";
    domainStep.executionStatus = "BLOCKED";

    store.addAuditEntry(
      createAuditEntry({
        eventType: "PAYMENT_BLOCKED",
        title: "Payment Prohibited: Domain Renewal ($18.00)",
        detail:
          "Condition limit violated: Requested maximum was $15.00, but registrar invoice is $18.00. Payment halted.",
        payee: "Domain Registrar Co",
        amount: 18,
        currency: "USD",
        statusStamp: "BLOCKED",
        stepId: domainStep.id,
      })
    );

    evaluatedSteps.push(domainStep);

    // Step 3: QuickInvoice $900 -> New Payee, Large Amount, Urgency -> HOLD (Risk 82/100)
    const quickStep: PaymentStep = {
      ...plan.steps[2],
      executionStatus: "PENDING_REVIEW",
    };
    const quickGuardrail = evaluateGuardrails(quickStep, {
      rules: store.rules,
      approvedPayees: store.approvedPayees,
      recentPayments: store.historicalPayments,
      currentMonthTotalSpend: store.getCurrentMonthSpend(),
    });
    const quickRisk = assessPaymentRisk(quickStep, {
      approvedPayees: store.approvedPayees,
    });

    quickStep.guardrailResult = quickGuardrail;
    quickStep.riskAssessment = quickRisk;
    quickStep.decision = "HOLD_FOR_APPROVAL";
    quickStep.executionStatus = "PENDING_REVIEW";

    store.addAuditEntry(
      createAuditEntry({
        eventType: "RULE_CHECKED",
        title: "Guardrail Alert: QuickInvoice Ltd ($900.00)",
        detail:
          "Triggered: New Payee Verification + Approval Threshold Exceeded ($900 > $150).",
        payee: "QuickInvoice Ltd",
        amount: 900,
        currency: "USD",
        stepId: quickStep.id,
      })
    );

    store.addAuditEntry(
      createAuditEntry({
        eventType: "RISK_SCORED",
        title: "Risk Engine: QuickInvoice Ltd (82/100 - HIGH RISK)",
        detail:
          "Held for your OK: New unknown payee, transfer is 8.2x average historical baseline, and urgent phrasing detected.",
        payee: "QuickInvoice Ltd",
        amount: 900,
        currency: "USD",
        statusStamp: "HELD",
        stepId: quickStep.id,
      })
    );

    store.addAuditEntry(
      createAuditEntry({
        eventType: "HELD_FOR_APPROVAL",
        title: "Pending Human Sign-off: QuickInvoice Ltd",
        detail:
          "Agent spending leash engaged. Awaiting human decision: Approve, Reject, or Edit amount.",
        payee: "QuickInvoice Ltd",
        amount: 900,
        currency: "USD",
        statusStamp: "HELD",
        stepId: quickStep.id,
      })
    );

    evaluatedSteps.push(quickStep);

    store.activePlan = {
      ...plan,
      steps: evaluatedSteps,
      totalPlannedAmount: evaluatedSteps.reduce((sum, s) => sum + s.amount, 0),
      status: "IN_PROGRESS",
    };

    return NextResponse.json({
      success: true,
      message: "Demo scenario initialized successfully",
      plan: store.activePlan,
      totalBlockedSavings: store.totalBlockedSavings,
    });
  } catch (err: any) {
    console.error("Demo run error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to run demo scenario" },
      { status: 500 }
    );
  }
}
