import { describe, it, expect } from "vitest";
import { assessPaymentRisk } from "./scorer";
import { INITIAL_APPROVED_PAYEES } from "../guardrails/defaultRules";
import { PaymentStep } from "@/types/payment";

const mockBaseStep: PaymentStep = {
  id: "step-1",
  payee: "Riya Sharma",
  payeeIdentifier: "riya.design@example.com",
  payeeType: "EMAIL",
  amount: 200,
  currency: "USD",
  purpose: "Logo design work",
  category: "CONTRACTOR",
  urgency: "NORMAL",
  executionStatus: "PENDING_REVIEW",
};

describe("PayPilot Risk Scoring Engine (0 - 100)", () => {
  it("1. assigns LOW risk score (<=15) to routine payment for known payee", () => {
    const risk = assessPaymentRisk(mockBaseStep, {
      approvedPayees: INITIAL_APPROVED_PAYEES,
    });

    expect(risk.overallScore).toBeLessThanOrEqual(15);
    expect(risk.level).toBe("LOW");
    expect(risk.isNewPayee).toBe(false);
    expect(risk.explanation).toContain("Low risk");
  });

  it("2. flags new unverified payee with +35 risk points", () => {
    const step: PaymentStep = {
      ...mockBaseStep,
      payee: "New Freelancer Corp",
      payeeIdentifier: "hello@newcorp.com",
    };

    const risk = assessPaymentRisk(step, {
      approvedPayees: INITIAL_APPROVED_PAYEES,
    });

    expect(risk.isNewPayee).toBe(true);
    const newPayeeFactor = risk.factors.find((f) => f.label === "New Unverified Payee");
    expect(newPayeeFactor).toBeDefined();
    expect(newPayeeFactor?.score).toBe(35);
  });

  it("3. flags urgency and coercive pressure cues with +15 risk points", () => {
    const step: PaymentStep = {
      ...mockBaseStep,
      purpose: "Urgent wire transfer needed right now to avoid suspension",
      urgency: "HIGH",
    };

    const risk = assessPaymentRisk(step, {
      approvedPayees: INITIAL_APPROVED_PAYEES,
    });

    expect(risk.isUrgentOrCoercive).toBe(true);
    const urgencyFactor = risk.factors.find((f) => f.label === "Urgency / High-Pressure Phrasing");
    expect(urgencyFactor).toBeDefined();
    expect(urgencyFactor?.score).toBe(15);
  });

  it("4. flags amount outlier (>3.5x benchmark) with +25 risk points", () => {
    const step: PaymentStep = {
      ...mockBaseStep,
      amount: 850, // Benchmark for Riya is ~$200
    };

    const risk = assessPaymentRisk(step, {
      approvedPayees: INITIAL_APPROVED_PAYEES,
    });

    expect(risk.isAmountOutlier).toBe(true);
    const outlierFactor = risk.factors.find((f) => f.label === "Unusual Amount Outlier");
    expect(outlierFactor).toBeDefined();
    expect(outlierFactor?.score).toBe(25);
  });

  it("5. flags generic invoicing entity signature with +7 risk points", () => {
    const step: PaymentStep = {
      ...mockBaseStep,
      payee: "QuickInvoice Ltd",
      amount: 900,
    };

    const risk = assessPaymentRisk(step, {
      approvedPayees: INITIAL_APPROVED_PAYEES,
    });

    expect(risk.isMismatchedName).toBe(true);
    const nameFactor = risk.factors.find((f) => f.label === "Generic Invoicing Entity Signature");
    expect(nameFactor).toBeDefined();
    expect(nameFactor?.score).toBe(7);
  });

  it("6. accurately calculates high risk (Score: 82-87/100, HIGH) for the QuickInvoice Ltd $900 demo scenario", () => {
    const step: PaymentStep = {
      id: "step-demo-3",
      payee: "QuickInvoice Ltd",
      payeeIdentifier: "billing@quickinvoiceltd.com",
      payeeType: "EMAIL",
      amount: 900,
      currency: "USD",
      purpose: "Urgent vendor onboarding and expedited invoice",
      category: "SERVICES",
      urgency: "HIGH",
      executionStatus: "PENDING_REVIEW",
    };

    const risk = assessPaymentRisk(step, {
      approvedPayees: INITIAL_APPROVED_PAYEES,
    });

    expect(risk.level).toBe("HIGH");
    expect(risk.overallScore).toBeGreaterThanOrEqual(80);
    expect(risk.isNewPayee).toBe(true);
    expect(risk.isAmountOutlier).toBe(true);
    expect(risk.isUrgentOrCoercive).toBe(true);
    expect(risk.explanation).toContain("Elevated risk");
    expect(risk.explanation).toContain("QuickInvoice Ltd");
  });
});
