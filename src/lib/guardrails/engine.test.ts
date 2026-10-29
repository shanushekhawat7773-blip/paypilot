import { describe, it, expect } from "vitest";
import { evaluateGuardrails, findApprovedPayee } from "./engine";
import { DEFAULT_RULES, INITIAL_APPROVED_PAYEES } from "./defaultRules";
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

describe("PayPilot Guardrails Engine", () => {
  // --- Rule 1: Specific User Conditions ---
  describe("Explicit User Conditions", () => {
    it("1. blocks payment when vendor charge exceeds user condition limit ($18 vs $15)", () => {
      const step: PaymentStep = {
        ...mockBaseStep,
        payee: "Domain Registrar",
        amount: 18,
        condition: "if under $15",
        conditionLimit: 15,
        category: "SERVICES",
      };

      const result = evaluateGuardrails(step, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
      });

      expect(result.decision).toBe("BLOCK");
      expect(result.ruleCode).toBe("SPECIFIC_CONDITION_FAILED");
      expect(result.reasoning).toContain("requested maximum was $15.00");
    });

    it("2. allows payment when vendor charge is within condition limit ($14.99 <= $15)", () => {
      const step: PaymentStep = {
        ...mockBaseStep,
        payee: "Domain Registrar",
        amount: 14.99,
        condition: "if under $15",
        conditionLimit: 15,
        category: "SERVICES",
      };

      const result = evaluateGuardrails(step, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
      });

      expect(result.decision).toBe("ALLOW");
      expect(result.ruleCode).toBe("ALL_RULES_PASSED");
    });

    it("3. blocks payment when amount is 1 cent over user limit", () => {
      const step: PaymentStep = {
        ...mockBaseStep,
        amount: 15.01,
        conditionLimit: 15.0,
      };

      const result = evaluateGuardrails(step, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
      });

      expect(result.decision).toBe("BLOCK");
      expect(result.ruleCode).toBe("SPECIFIC_CONDITION_FAILED");
    });
  });

  // --- Rule 2: Blocked Categories ---
  describe("Blocked Categories", () => {
    it("4. blocks payment for a restricted category (ENTERTAINMENT)", () => {
      const step: PaymentStep = {
        ...mockBaseStep,
        category: "ENTERTAINMENT",
        amount: 50,
      };

      const result = evaluateGuardrails(step, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
      });

      expect(result.decision).toBe("BLOCK");
      expect(result.ruleCode).toBe("BLOCKED_CATEGORY");
      expect(result.reasoning).toContain("ENTERTAINMENT");
    });

    it("5. allows payment for permitted category (CONTRACTOR)", () => {
      const step: PaymentStep = {
        ...mockBaseStep,
        category: "CONTRACTOR",
        amount: 100,
      };

      const result = evaluateGuardrails(step, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
      });

      expect(result.decision).toBe("ALLOW");
    });

    it("6. allows payment for permitted category (SOFTWARE)", () => {
      const step: PaymentStep = {
        ...mockBaseStep,
        payee: "GitHub Inc",
        category: "SOFTWARE",
        amount: 21,
      };

      const result = evaluateGuardrails(step, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
      });

      expect(result.decision).toBe("ALLOW");
    });
  });

  // --- Rule 3: Per-Payment Hard Cap ---
  describe("Per-Payment Hard Cap", () => {
    it("7. blocks payment exceeding per-payment cap ($1200 > $1000)", () => {
      const step: PaymentStep = {
        ...mockBaseStep,
        amount: 1200,
      };

      const result = evaluateGuardrails(step, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
      });

      expect(result.decision).toBe("BLOCK");
      expect(result.ruleCode).toBe("PER_PAYMENT_CAP_EXCEEDED");
      expect(result.reasoning).toContain("maximum per-payment limit");
    });

    it("8. allows payment equal to exact per-payment cap ($1000)", () => {
      const step: PaymentStep = {
        ...mockBaseStep,
        amount: 1000,
      };

      // Set custom threshold for Riya to test boundary
      const payees = [
        {
          ...INITIAL_APPROVED_PAYEES[0],
          maxPreApprovedLimit: 1000,
        },
      ];

      const result = evaluateGuardrails(step, {
        rules: DEFAULT_RULES,
        approvedPayees: payees,
      });

      expect(result.decision).toBe("ALLOW");
    });
  });

  // --- Rule 4: Monthly Budget ---
  describe("Monthly Budget", () => {
    it("9. holds payment when projected spend exceeds monthly budget ($3400 + $200 > $3500)", () => {
      const step: PaymentStep = {
        ...mockBaseStep,
        amount: 200,
      };

      const result = evaluateGuardrails(step, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
        currentMonthTotalSpend: 3400,
      });

      expect(result.decision).toBe("HOLD_FOR_APPROVAL");
      expect(result.ruleCode).toBe("MONTHLY_BUDGET_EXCEEDED");
      expect(result.reasoning).toContain("pushes monthly spend to $3600.00");
    });

    it("10. allows payment when within monthly budget ($2000 + $200 <= $3500)", () => {
      const step: PaymentStep = {
        ...mockBaseStep,
        amount: 200,
      };

      const result = evaluateGuardrails(step, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
        currentMonthTotalSpend: 2000,
      });

      expect(result.decision).toBe("ALLOW");
    });

    it("11. allows payment when current spend is 0 and amount is within budget", () => {
      const step: PaymentStep = {
        ...mockBaseStep,
        amount: 200,
      };

      const result = evaluateGuardrails(step, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
        currentMonthTotalSpend: 0,
      });

      expect(result.decision).toBe("ALLOW");
    });
  });

  // --- Rule 5: Duplicate Payment Detection ---
  describe("Duplicate Payment Protection", () => {
    it("12. holds payment when identical payee & amount occurred 2 hours ago", () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const recent: PaymentStep[] = [
        {
          ...mockBaseStep,
          id: "step-prev",
          executionStatus: "PAID",
          executedAt: twoHoursAgo,
        },
      ];

      const result = evaluateGuardrails(mockBaseStep, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
        recentPayments: recent,
      });

      expect(result.decision).toBe("HOLD_FOR_APPROVAL");
      expect(result.ruleCode).toBe("DUPLICATE_PAYMENT_DETECTED");
      expect(result.reasoning).toContain("Identical payment of $200.00");
    });

    it("13. allows payment to same payee when amount differs ($200 vs $250)", () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const recent: PaymentStep[] = [
        {
          ...mockBaseStep,
          amount: 250,
          executionStatus: "PAID",
          executedAt: twoHoursAgo,
        },
      ];

      const result = evaluateGuardrails(mockBaseStep, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
        recentPayments: recent,
      });

      expect(result.decision).toBe("ALLOW");
    });

    it("14. allows payment when same amount is sent to a different payee", () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const recent: PaymentStep[] = [
        {
          ...mockBaseStep,
          payee: "Amazon Web Services",
          payeeIdentifier: "aws-billing@amazon.com",
          amount: 200,
          executionStatus: "PAID",
          executedAt: twoHoursAgo,
        },
      ];

      const result = evaluateGuardrails(mockBaseStep, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
        recentPayments: recent,
      });

      expect(result.decision).toBe("ALLOW");
    });

    it("15. ignores duplicate check if prior payment was REJECTED or BLOCKED", () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const recent: PaymentStep[] = [
        {
          ...mockBaseStep,
          executionStatus: "REJECTED",
          executedAt: twoHoursAgo,
        },
      ];

      const result = evaluateGuardrails(mockBaseStep, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
        recentPayments: recent,
      });

      expect(result.decision).toBe("ALLOW");
    });

    it("16. allows payment after duplicate window hours has passed (25h ago)", () => {
      const twentyFiveHoursAgo = new Date(
        Date.now() - 25 * 60 * 60 * 1000
      ).toISOString();
      const recent: PaymentStep[] = [
        {
          ...mockBaseStep,
          executionStatus: "PAID",
          executedAt: twentyFiveHoursAgo,
        },
      ];

      const result = evaluateGuardrails(mockBaseStep, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
        recentPayments: recent,
      });

      expect(result.decision).toBe("ALLOW");
    });
  });

  // --- Rule 6: Daily Velocity Limit ---
  describe("Daily Velocity Limit", () => {
    it("17. holds payment when daily velocity limit is reached (6 payments in 24h)", () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const recent: PaymentStep[] = Array.from({ length: 6 }).map((_, i) => ({
        ...mockBaseStep,
        id: `prev-${i}`,
        payee: `Vendor ${i}`,
        amount: 20 + i,
        executionStatus: "PAID",
        executedAt: oneHourAgo,
      }));

      const result = evaluateGuardrails(mockBaseStep, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
        recentPayments: recent,
      });

      expect(result.decision).toBe("HOLD_FOR_APPROVAL");
      expect(result.ruleCode).toBe("DAILY_VELOCITY_EXCEEDED");
      expect(result.reasoning).toContain("Velocity limit reached");
    });

    it("18. allows payment when below velocity limit (5 payments in 24h)", () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const recent: PaymentStep[] = Array.from({ length: 5 }).map((_, i) => ({
        ...mockBaseStep,
        id: `prev-${i}`,
        payee: `Vendor ${i}`,
        amount: 20 + i,
        executionStatus: "PAID",
        executedAt: oneHourAgo,
      }));

      const result = evaluateGuardrails(mockBaseStep, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
        recentPayments: recent,
      });

      expect(result.decision).toBe("ALLOW");
    });

    it("19. excludes payments older than 24h from velocity calculation", () => {
      const thirtyHoursAgo = new Date(
        Date.now() - 30 * 60 * 60 * 1000
      ).toISOString();
      const recent: PaymentStep[] = Array.from({ length: 10 }).map((_, i) => ({
        ...mockBaseStep,
        id: `prev-${i}`,
        payee: `Vendor ${i}`,
        amount: 20 + i,
        executionStatus: "PAID",
        executedAt: thirtyHoursAgo,
      }));

      const result = evaluateGuardrails(mockBaseStep, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
        recentPayments: recent,
      });

      expect(result.decision).toBe("ALLOW");
    });
  });

  // --- Rule 7: Payee Recognition & Thresholds ---
  describe("Payee Whitelist & Approval Thresholds", () => {
    it("20. allows pre-approved payee Riya within her $250 limit ($200)", () => {
      const result = evaluateGuardrails(mockBaseStep, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
      });

      expect(result.decision).toBe("ALLOW");
      expect(result.ruleCode).toBe("ALL_RULES_PASSED");
      expect(result.reasoning).toContain("Pre-approved payee 'Riya Sharma'");
    });

    it("21. holds payment to Riya if amount exceeds her pre-approved limit ($280 > $250)", () => {
      const step: PaymentStep = {
        ...mockBaseStep,
        amount: 280,
      };

      const result = evaluateGuardrails(step, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
      });

      expect(result.decision).toBe("HOLD_FOR_APPROVAL");
      expect(result.ruleCode).toBe("APPROVAL_THRESHOLD_EXCEEDED");
      expect(result.reasoning).toContain("pre-authorized limit of $250.00");
    });

    it("22. matches approved payee by partial first name ('Riya')", () => {
      const step: PaymentStep = {
        ...mockBaseStep,
        payee: "Riya",
        amount: 100,
      };

      const match = findApprovedPayee("Riya", undefined, INITIAL_APPROVED_PAYEES);
      expect(match).toBeDefined();
      expect(match?.name).toBe("Riya Sharma");

      const result = evaluateGuardrails(step, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
      });

      expect(result.decision).toBe("ALLOW");
    });

    it("23. matches approved payee by exact email address", () => {
      const match = findApprovedPayee(
        "Design Lead",
        "riya.design@example.com",
        INITIAL_APPROVED_PAYEES
      );
      expect(match).toBeDefined();
      expect(match?.id).toBe("payee-riya");
    });

    it("24. holds payment to new unknown vendor (QuickInvoice Ltd, $900)", () => {
      const step: PaymentStep = {
        ...mockBaseStep,
        id: "step-quickinvoice",
        payee: "QuickInvoice Ltd",
        payeeIdentifier: "billing@quickinvoiceltd.com",
        amount: 900,
        purpose: "Urgent invoice settlement",
        category: "SERVICES",
        urgency: "HIGH",
      };

      const result = evaluateGuardrails(step, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
      });

      expect(result.decision).toBe("HOLD_FOR_APPROVAL");
      expect(result.ruleCode).toBe("UNAPPROVED_PAYEE");
      expect(result.reasoning).toContain("new or unverified payee");
    });

    it("25. blocks unapproved payee when approvedPayeesOnly is true", () => {
      const step: PaymentStep = {
        ...mockBaseStep,
        payee: "Unknown Entity Corp",
        payeeIdentifier: "billing@unknownentity.com",
        amount: 50,
      };

      const result = evaluateGuardrails(step, {
        rules: {
          ...DEFAULT_RULES,
          approvedPayeesOnly: true,
        },
        approvedPayees: INITIAL_APPROVED_PAYEES,
      });

      expect(result.decision).toBe("BLOCK");
      expect(result.ruleCode).toBe("UNAPPROVED_PAYEE");
      expect(result.reasoning).toContain("whitelisted payees only");
    });

    it("26. holds payment to approved payee without custom limit when amount exceeds askAboveThreshold ($160 > $150)", () => {
      // Payee with no custom maxPreApprovedLimit
      const payees = [
        {
          ...INITIAL_APPROVED_PAYEES[3], // Domain Registrar Co
          maxPreApprovedLimit: undefined,
        },
      ];

      const step: PaymentStep = {
        ...mockBaseStep,
        payee: "Domain Registrar Co",
        amount: 160,
      };

      const result = evaluateGuardrails(step, {
        rules: DEFAULT_RULES,
        approvedPayees: payees,
      });

      expect(result.decision).toBe("HOLD_FOR_APPROVAL");
      expect(result.ruleCode).toBe("APPROVAL_THRESHOLD_EXCEEDED");
    });

    it("27. allows payment when all rules and limits are respected", () => {
      const step: PaymentStep = {
        ...mockBaseStep,
        payee: "Amazon Web Services",
        amount: 85,
        category: "SERVICES",
      };

      const result = evaluateGuardrails(step, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
      });

      expect(result.decision).toBe("ALLOW");
      expect(result.ruleCode).toBe("ALL_RULES_PASSED");
    });
  });

  // --- Rule 8: Critical Numerical & Currency Edge Cases ---
  describe("Edge Cases: Boundaries, Zero, Negative & Currency Mismatch", () => {
    it("28. blocks payment with zero amount ($0.00)", () => {
      const step: PaymentStep = {
        ...mockBaseStep,
        amount: 0,
      };

      const result = evaluateGuardrails(step, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
      });

      expect(result.decision).toBe("BLOCK");
      expect(result.ruleCode).toBe("INVALID_AMOUNT");
      expect(result.reasoning).toContain("must be greater than zero");
    });

    it("29. blocks payment with negative amount (-$50.00)", () => {
      const step: PaymentStep = {
        ...mockBaseStep,
        amount: -50,
      };

      const result = evaluateGuardrails(step, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
      });

      expect(result.decision).toBe("BLOCK");
      expect(result.ruleCode).toBe("INVALID_AMOUNT");
      expect(result.reasoning).toContain("must be greater than zero");
    });

    it("30. blocks payment with unsupported currency (JPY / BTC)", () => {
      const step: PaymentStep = {
        ...mockBaseStep,
        currency: "JPY",
      };

      const result = evaluateGuardrails(step, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
      });

      expect(result.decision).toBe("BLOCK");
      expect(result.ruleCode).toBe("CURRENCY_MISMATCH");
      expect(result.reasoning).toContain("unsupported or incompatible");
    });

    it("31. blocks payment 1 cent over hard per-payment cap ($1000.01)", () => {
      const step: PaymentStep = {
        ...mockBaseStep,
        amount: 1000.01,
      };

      const result = evaluateGuardrails(step, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
      });

      expect(result.decision).toBe("BLOCK");
      expect(result.ruleCode).toBe("PER_PAYMENT_CAP_EXCEEDED");
    });

    it("32. holds payment 1 cent over monthly budget ($3500.01 projected)", () => {
      const step: PaymentStep = {
        ...mockBaseStep,
        amount: 50.01,
      };

      const result = evaluateGuardrails(step, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
        currentMonthTotalSpend: 3450,
      });

      expect(result.decision).toBe("HOLD_FOR_APPROVAL");
      expect(result.ruleCode).toBe("MONTHLY_BUDGET_EXCEEDED");
    });

    it("33. natively supports PayPal PYUSD stablecoin settlement", () => {
      const step: PaymentStep = {
        ...mockBaseStep,
        currency: "PYUSD",
        amount: 100,
      };

      const result = evaluateGuardrails(step, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
      });

      expect(result.decision).toBe("ALLOW");
      expect(result.ruleCode).toBe("ALL_RULES_PASSED");
    });

    it("34. blocks NaN amount gracefully", () => {
      const step: PaymentStep = {
        ...mockBaseStep,
        amount: NaN,
      };

      const result = evaluateGuardrails(step, {
        rules: DEFAULT_RULES,
        approvedPayees: INITIAL_APPROVED_PAYEES,
      });

      expect(result.decision).toBe("BLOCK");
      expect(result.ruleCode).toBe("INVALID_AMOUNT");
    });
  });
});
