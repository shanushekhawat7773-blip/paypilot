import {
  PaymentStep,
  UserRulesConfig,
  Payee,
  GuardrailResult,
} from "@/types/payment";

export interface EvaluationContext {
  rules: UserRulesConfig;
  approvedPayees: Payee[];
  recentPayments?: PaymentStep[];
  currentMonthTotalSpend?: number;
}

/**
 * Matches a payment payee string against the known approved payees roster.
 * Matches on normalized email/identifier or normalized name.
 */
export function findApprovedPayee(
  payeeNameOrId: string,
  payeeIdentifier: string | undefined,
  approvedPayees: Payee[]
): Payee | undefined {
  const normInputName = payeeNameOrId.trim().toLowerCase();
  const normInputId = (payeeIdentifier || "").trim().toLowerCase();

  return approvedPayees.find((p) => {
    if (!p.isApproved) return false;
    const pName = p.name.trim().toLowerCase();
    const pId = p.identifier.trim().toLowerCase();

    if (normInputId && pId === normInputId) return true;
    if (pName === normInputName) return true;
    // Substring match e.g. "Riya" in "Riya Sharma"
    if (normInputName.length >= 3 && pName.includes(normInputName)) return true;
    if (pName.length >= 3 && normInputName.includes(pName)) return true;
    return false;
  });
}

/**
 * Core Deterministic Guardrails Engine.
 * Pure TypeScript. Zero network dependencies.
 *
 * "The LLM PROPOSES. Deterministic code DECIDES."
 */
export function evaluateGuardrails(
  step: PaymentStep,
  context: EvaluationContext
): GuardrailResult {
  const {
    rules,
    approvedPayees,
    recentPayments = [],
    currentMonthTotalSpend = 0,
  } = context;

  // 0a. Amount Validity (Non-positive / NaN Protection)
  if (step.amount <= 0 || isNaN(step.amount)) {
    return {
      decision: "BLOCK",
      ruleCode: "INVALID_AMOUNT",
      triggeredRule: "Amount Validity Check",
      reasoning: `Payment amount must be greater than zero. Received: $${step.amount}.`,
      details: { amount: step.amount },
    };
  }

  // 0b. Currency Compatibility
  const supportedCurrencies = ["USD", "EUR", "GBP", "CAD", "AUD", "PYUSD"];
  if (!step.currency || !supportedCurrencies.includes(step.currency.toUpperCase())) {
    return {
      decision: "BLOCK",
      ruleCode: "CURRENCY_MISMATCH",
      triggeredRule: "Currency Compatibility",
      reasoning: `Currency '${step.currency}' is unsupported or incompatible with your PayPal settlement account.`,
      details: { currency: step.currency },
    };
  }

  // 1. Explicit User Constraint / Condition Limit
  // E.g., "renew domain if under $15" -> vendor asks $18 -> BLOCK
  if (
    step.conditionLimit !== undefined &&
    step.conditionLimit !== null &&
    step.amount > step.conditionLimit
  ) {
    return {
      decision: "BLOCK",
      ruleCode: "SPECIFIC_CONDITION_FAILED",
      triggeredRule: "Explicit User Condition",
      reasoning: `Blocked by your condition: requested maximum was $${step.conditionLimit.toFixed(
        2
      )} ${step.currency}, but invoice/charge is $${step.amount.toFixed(
        2
      )} ${step.currency}.`,
      details: {
        conditionLimit: step.conditionLimit,
        actualAmount: step.amount,
        condition: step.condition,
      },
    };
  }

  // 2. Blocked Categories
  if (rules.blockedCategories && rules.blockedCategories.includes(step.category)) {
    return {
      decision: "BLOCK",
      ruleCode: "BLOCKED_CATEGORY",
      triggeredRule: "Blocked Category Restriction",
      reasoning: `The category '${step.category}' is blocked by your spending policy. Payments to this merchant type are prohibited.`,
      details: {
        category: step.category,
      },
    };
  }

  // 3. Hard Per-Payment Cap
  if (step.amount > rules.perPaymentCap) {
    return {
      decision: "BLOCK",
      ruleCode: "PER_PAYMENT_CAP_EXCEEDED",
      triggeredRule: "Per-Payment Hard Cap",
      reasoning: `Amount ($${step.amount.toFixed(
        2
      )}) exceeds your maximum per-payment limit of $${rules.perPaymentCap.toFixed(
        2
      )}.`,
      details: {
        amount: step.amount,
        perPaymentCap: rules.perPaymentCap,
      },
    };
  }

  // 4. Monthly Budget Exceeded
  if (currentMonthTotalSpend + step.amount > rules.monthlyBudget) {
    const projected = currentMonthTotalSpend + step.amount;
    return {
      decision: "HOLD_FOR_APPROVAL",
      ruleCode: "MONTHLY_BUDGET_EXCEEDED",
      triggeredRule: "Monthly Budget Limit",
      reasoning: `Payment of $${step.amount.toFixed(
        2
      )} pushes monthly spend to $${projected.toFixed(
        2
      )}, exceeding your $${rules.monthlyBudget.toFixed(2)} monthly budget.`,
      details: {
        currentMonthSpend: currentMonthTotalSpend,
        projectedSpend: projected,
        monthlyBudget: rules.monthlyBudget,
      },
    };
  }

  // 5. Duplicate Payment Detection
  const duplicateWindowMs = (rules.duplicateWindowHours || 24) * 60 * 60 * 1000;
  const now = Date.now();

  const isDuplicate = recentPayments.some((p) => {
    // Only check successful or pending payments
    if (p.executionStatus === "REJECTED" || p.executionStatus === "FAILED" || p.executionStatus === "BLOCKED") {
      return false;
    }
    // Amount matches
    if (Math.abs(p.amount - step.amount) > 0.001) return false;

    // Payee matches
    const nameMatch =
      p.payee.toLowerCase().trim() === step.payee.toLowerCase().trim();
    const idMatch =
      Boolean(step.payeeIdentifier) &&
      p.payeeIdentifier?.toLowerCase().trim() ===
        step.payeeIdentifier.toLowerCase().trim();

    if (!nameMatch && !idMatch) return false;

    // Time window
    if (p.executedAt) {
      const execTime = new Date(p.executedAt).getTime();
      return now - execTime <= duplicateWindowMs;
    }
    return false;
  });

  if (isDuplicate) {
    return {
      decision: "HOLD_FOR_APPROVAL",
      ruleCode: "DUPLICATE_PAYMENT_DETECTED",
      triggeredRule: "Duplicate Payment Protection",
      reasoning: `Identical payment of $${step.amount.toFixed(
        2
      )} to ${step.payee} was recently executed within the last ${rules.duplicateWindowHours} hours.`,
      details: {
        payee: step.payee,
        amount: step.amount,
        windowHours: rules.duplicateWindowHours,
      },
    };
  }

  // 6. Daily Velocity Limit
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const paymentsIn24h = recentPayments.filter((p) => {
    if (p.executionStatus === "PAID" || p.executionStatus === "PROCESSING") {
      if (p.executedAt) {
        return new Date(p.executedAt).getTime() >= oneDayAgo;
      }
    }
    return false;
  });

  if (paymentsIn24h.length >= rules.dailyVelocityLimit) {
    return {
      decision: "HOLD_FOR_APPROVAL",
      ruleCode: "DAILY_VELOCITY_EXCEEDED",
      triggeredRule: "Daily Velocity Limit",
      reasoning: `Velocity limit reached: ${paymentsIn24h.length} payments have been made in the last 24 hours (max: ${rules.dailyVelocityLimit}).`,
      details: {
        paymentsCount: paymentsIn24h.length,
        velocityLimit: rules.dailyVelocityLimit,
      },
    };
  }

  // 7. Payee Approval & Thresholds
  const matchedPayee = findApprovedPayee(
    step.payee,
    step.payeeIdentifier,
    approvedPayees
  );

  if (!matchedPayee) {
    if (rules.approvedPayeesOnly) {
      return {
        decision: "BLOCK",
        ruleCode: "UNAPPROVED_PAYEE",
        triggeredRule: "Strict Payee Whitelist",
        reasoning: `'${step.payee}' is not on your approved payee list. Policy restricts transfers to whitelisted payees only.`,
        details: { payee: step.payee },
      };
    }

    if (rules.holdUnapprovedPayees) {
      return {
        decision: "HOLD_FOR_APPROVAL",
        ruleCode: "UNAPPROVED_PAYEE",
        triggeredRule: "New Payee Verification",
        reasoning: `'${step.payee}' is a new or unverified payee. First-time payments require your manual approval.`,
        details: { payee: step.payee },
      };
    }
  } else {
    // Payee is approved! Check if payment exceeds payee's pre-approved limit
    // or the general askAboveThreshold.
    const preApprovedLimit =
      matchedPayee.maxPreApprovedLimit ?? rules.askAboveThreshold;

    if (step.amount > preApprovedLimit) {
      return {
        decision: "HOLD_FOR_APPROVAL",
        ruleCode: "APPROVAL_THRESHOLD_EXCEEDED",
        triggeredRule: "Single Payment Threshold",
        reasoning: `Payment amount of $${step.amount.toFixed(
          2
        )} exceeds the pre-authorized limit of $${preApprovedLimit.toFixed(
          2
        )} for ${matchedPayee.name}.`,
        details: {
          amount: step.amount,
          preApprovedLimit,
          payee: matchedPayee.name,
        },
      };
    }
  }

  // 8. All deterministic checks passed
  return {
    decision: "ALLOW",
    ruleCode: "ALL_RULES_PASSED",
    triggeredRule: "Pre-Authorized Policy",
    reasoning: matchedPayee
      ? `Pre-approved payee '${matchedPayee.name}' within authorized spending bounds ($${step.amount.toFixed(
          2
        )}).`
      : `Payment of $${step.amount.toFixed(
          2
        )} is within all automated guardrail parameters.`,
    details: {
      matchedPayee: matchedPayee?.name,
      amount: step.amount,
    },
  };
}
