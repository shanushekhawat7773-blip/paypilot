import {
  PaymentStep,
  Payee,
  RiskAssessment,
  RiskFactor,
} from "@/types/payment";
import { findApprovedPayee } from "../guardrails/engine";

const URGENCY_REGEX =
  /\b(urgent|urgently|immediate|immediately|right away|right now|asap|today|overdue|suspension|penalty|quick|fast|rush|final notice|emergency|wire now)\b/i;

const SUSPICIOUS_NAME_REGEX =
  /\b(quickinvoice|fastbill|wirepay|invoiceltd|expresspay|transferdesk|securebilling)\b/i;

export interface RiskScorerOptions {
  approvedPayees: Payee[];
  overallHistoricalAverage?: number; // e.g. $120
}

/**
 * Calculates a comprehensive Risk Assessment for a payment step.
 * Returns a 0-100 score, factors breakdown, and plain-English explanation.
 */
export function assessPaymentRisk(
  step: PaymentStep,
  options: RiskScorerOptions
): RiskAssessment {
  const { approvedPayees, overallHistoricalAverage = 110 } = options;
  const factors: RiskFactor[] = [];

  const matchedPayee = findApprovedPayee(
    step.payee,
    step.payeeIdentifier,
    approvedPayees
  );
  const isNewPayee = !matchedPayee;

  // 1. Payee Novelty
  if (isNewPayee) {
    factors.push({
      label: "New Unverified Payee",
      score: 35,
      severity: "HIGH",
      reason: `'${step.payee}' has no prior transaction history with your account.`,
    });
  } else {
    factors.push({
      label: "Known Payee",
      score: 0,
      severity: "LOW",
      reason: `Verified payee '${matchedPayee.name}' with established payment history.`,
    });
  }

  // 2. Amount vs Historical Benchmark
  const benchmark =
    matchedPayee?.historicalAverage ?? overallHistoricalAverage;
  const amountRatio = step.amount / Math.max(benchmark, 1);
  let isAmountOutlier = false;

  if (amountRatio >= 3.5 || (isNewPayee && step.amount >= 500)) {
    isAmountOutlier = true;
    factors.push({
      label: "Unusual Amount Outlier",
      score: 25,
      severity: "HIGH",
      reason: `Payment of $${step.amount.toFixed(
        2
      )} is ${amountRatio.toFixed(1)}x greater than average transactions ($${benchmark.toFixed(
        2
      )}).`,
    });
  } else if (amountRatio >= 1.8) {
    isAmountOutlier = true;
    factors.push({
      label: "Elevated Amount",
      score: 12,
      severity: "MEDIUM",
      reason: `Amount ($${step.amount.toFixed(
        2
      )}) is moderately higher than usual for this payee ($${benchmark.toFixed(
        2
      )}).`,
    });
  }

  // 3. Urgency & Coercive Language
  const textToScan = `${step.purpose} ${step.rawText || ""} ${step.payee}`;
  const hasUrgency =
    URGENCY_REGEX.test(textToScan) || step.urgency === "HIGH" || step.urgency === "CRITICAL";

  if (hasUrgency) {
    factors.push({
      label: "Urgency / High-Pressure Phrasing",
      score: 15,
      severity: "HIGH",
      reason:
        "High-pressure timing cues detected in the task request. Urgency is frequently leveraged in invoice redirection attacks.",
    });
  }

  // 4. Payee Name & Generic Entity Pattern
  const hasSuspiciousPattern =
    SUSPICIOUS_NAME_REGEX.test(step.payee.toLowerCase()) ||
    (isNewPayee && /\bltd\b|\bllc\b|\bcorp\b/i.test(step.payee) && step.amount > 500);

  let isMismatchedName = false;
  if (hasSuspiciousPattern) {
    isMismatchedName = true;
    factors.push({
      label: "Generic Invoicing Entity Signature",
      score: 7,
      severity: "MEDIUM",
      reason: `Entity name '${step.payee}' matches patterns common to cold invoice manipulation attempts.`,
    });
  }

  // Compute total score: base of 5 points for any transaction + sum of risk factors
  const rawSum = 5 + factors.reduce((sum, f) => sum + f.score, 0);
  const overallScore = Math.min(Math.max(rawSum, 5), 100);

  // Level classification
  const level: "LOW" | "MEDIUM" | "HIGH" =
    overallScore < 30 ? "LOW" : overallScore < 65 ? "MEDIUM" : "HIGH";

  // Plain-English synthesis explanation
  let explanation = "";
  if (overallScore <= 15) {
    explanation = `Low risk (Score: ${overallScore}/100). Routine transaction to known payee '${step.payee}'.`;
  } else if (overallScore < 60) {
    explanation = `Moderate risk (Score: ${overallScore}/100). Caution recommended: ${factors
      .filter((f) => f.score > 0)
      .map((f) => f.label)
      .join(", ")}.`;
  } else {
    explanation = `Elevated risk (Score: ${overallScore}/100). Held for your review: this is a new vendor (${step.payee}) with an unusually large transfer ($${step.amount.toFixed(
      2
    )}) and urgency markers.`;
  }

  return {
    overallScore,
    level,
    factors,
    explanation,
    isUrgentOrCoercive: hasUrgency,
    isNewPayee,
    isAmountOutlier,
    isMismatchedName,
  };
}
