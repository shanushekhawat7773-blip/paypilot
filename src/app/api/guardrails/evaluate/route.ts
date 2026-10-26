import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/storage/store";
import { evaluateGuardrails } from "@/lib/guardrails/engine";
import { assessPaymentRisk } from "@/lib/risk/scorer";
import { createAuditEntry } from "@/lib/audit/tape";
import { PaymentStep } from "@/types/payment";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let steps: PaymentStep[] = body.steps;

    if (!steps && store.activePlan) {
      steps = store.activePlan.steps;
    }

    if (!steps || !Array.isArray(steps)) {
      return NextResponse.json(
        { error: "No steps provided for evaluation" },
        { status: 400 }
      );
    }

    const currentSpend = store.getCurrentMonthSpend();
    const evaluatedSteps: PaymentStep[] = [];

    for (const step of steps) {
      // 1. Deterministic Guardrails Check
      const guardrailResult = evaluateGuardrails(step, {
        rules: store.rules,
        approvedPayees: store.approvedPayees,
        recentPayments: store.historicalPayments,
        currentMonthTotalSpend: currentSpend,
      });

      // 2. Risk Assessment
      const riskAssessment = assessPaymentRisk(step, {
        approvedPayees: store.approvedPayees,
      });

      // Combine decision: if guardrails block, it's BLOCKED; if guardrails hold or risk is HIGH, it's HELD; else ALLOW
      let finalDecision = guardrailResult.decision;
      if (finalDecision === "ALLOW" && riskAssessment.overallScore >= 65) {
        finalDecision = "HOLD_FOR_APPROVAL";
      }

      const updatedStep: PaymentStep = {
        ...step,
        guardrailResult,
        riskAssessment,
        decision: finalDecision,
        executionStatus:
          finalDecision === "BLOCK"
            ? "BLOCKED"
            : finalDecision === "HOLD_FOR_APPROVAL"
            ? "PENDING_REVIEW"
            : "APPROVED",
      };

      evaluatedSteps.push(updatedStep);

      // Audit Tape Logging
      store.addAuditEntry(
        createAuditEntry({
          eventType: "RULE_CHECKED",
          title: `Guardrail Evaluation: ${step.payee} ($${step.amount.toFixed(
            2
          )})`,
          detail: `Decision: ${finalDecision}. Triggered Rule: ${guardrailResult.triggeredRule}. ${guardrailResult.reasoning}`,
          payee: step.payee,
          amount: step.amount,
          currency: step.currency,
          stepId: step.id,
        })
      );

      store.addAuditEntry(
        createAuditEntry({
          eventType: "RISK_SCORED",
          title: `Risk Analysis: ${step.payee} (${riskAssessment.overallScore}/100 - ${riskAssessment.level})`,
          detail: riskAssessment.explanation,
          payee: step.payee,
          amount: step.amount,
          currency: step.currency,
          stepId: step.id,
        })
      );

      if (finalDecision === "HOLD_FOR_APPROVAL") {
        store.addAuditEntry(
          createAuditEntry({
            eventType: "HELD_FOR_APPROVAL",
            title: `Held for Human Review: ${step.payee} ($${step.amount.toFixed(
              2
            )})`,
            detail: `Spending leash activated. Requires user approval. Reason: ${guardrailResult.reasoning}`,
            payee: step.payee,
            amount: step.amount,
            currency: step.currency,
            statusStamp: "HELD",
            stepId: step.id,
          })
        );
      } else if (finalDecision === "BLOCK") {
        store.addAuditEntry(
          createAuditEntry({
            eventType: "PAYMENT_BLOCKED",
            title: `Payment Prohibited: ${step.payee} ($${step.amount.toFixed(
              2
            )})`,
            detail: `Autonomous execution refused: ${guardrailResult.reasoning}`,
            payee: step.payee,
            amount: step.amount,
            currency: step.currency,
            statusStamp: "BLOCKED",
            stepId: step.id,
          })
        );
      }
    }

    if (store.activePlan) {
      store.activePlan.steps = evaluatedSteps;
    }

    return NextResponse.json({
      success: true,
      steps: evaluatedSteps,
    });
  } catch (err: any) {
    console.error("Evaluation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to evaluate guardrails" },
      { status: 500 }
    );
  }
}
