import { z } from "zod";

export type DecisionStatus = "ALLOW" | "HOLD_FOR_APPROVAL" | "BLOCK";

export type PaymentCategory =
  | "CONTRACTOR"
  | "SERVICES"
  | "SUBSCRIPTION"
  | "SOFTWARE"
  | "HARDWARE"
  | "UTILITIES"
  | "ENTERTAINMENT"
  | "OTHER";

export type PayeeType = "EMAIL" | "PHONE" | "PAYPAL_ID" | "MERCHANT";

export type UrgencyLevel = "NORMAL" | "HIGH" | "CRITICAL";

export interface Payee {
  id: string;
  name: string;
  identifier: string; // email, phone, or PayPal merchant ID
  type: PayeeType;
  isApproved: boolean;
  addedAt: string;
  tags?: string[];
  historicalAverage?: number;
  totalPaidToDate?: number;
  maxPreApprovedLimit?: number;
}

export interface UserRulesConfig {
  monthlyBudget: number; // e.g. 5000 USD
  perPaymentCap: number; // e.g. 500 USD (hard cap)
  askAboveThreshold: number; // e.g. 150 USD requires user approval
  approvedPayeesOnly: boolean; // if true, any unapproved payee is blocked or held
  holdUnapprovedPayees: boolean; // default true: unapproved payees trigger HOLD
  blockedCategories: PaymentCategory[];
  dailyVelocityLimit: number; // maximum payments allowed in a rolling 24h window (e.g. 10)
  duplicateWindowHours: number; // e.g. 24h window for duplicate detection
  customRules?: Array<{
    id: string;
    description: string;
    condition: string;
    action: DecisionStatus;
  }>;
}

export interface GuardrailResult {
  decision: DecisionStatus;
  triggeredRule: string;
  ruleCode:
    | "MONTHLY_BUDGET_EXCEEDED"
    | "PER_PAYMENT_CAP_EXCEEDED"
    | "APPROVAL_THRESHOLD_EXCEEDED"
    | "UNAPPROVED_PAYEE"
    | "BLOCKED_CATEGORY"
    | "DAILY_VELOCITY_EXCEEDED"
    | "DUPLICATE_PAYMENT_DETECTED"
    | "SPECIFIC_CONDITION_FAILED"
    | "ALL_RULES_PASSED";
  reasoning: string;
  details?: Record<string, any>;
}

export interface RiskFactor {
  label: string;
  score: number; // 0 to 100 contribution
  severity: "LOW" | "MEDIUM" | "HIGH";
  reason: string;
}

export interface RiskAssessment {
  overallScore: number; // 0 to 100
  level: "LOW" | "MEDIUM" | "HIGH";
  factors: RiskFactor[];
  explanation: string;
  isUrgentOrCoercive: boolean;
  isNewPayee: boolean;
  isAmountOutlier: boolean;
  isMismatchedName: boolean;
}

export interface PaymentStep {
  id: string;
  payee: string;
  payeeIdentifier: string;
  payeeType: PayeeType;
  amount: number;
  currency: string;
  purpose: string;
  category: PaymentCategory;
  condition?: string; // e.g., "if under $15"
  conditionLimit?: number; // e.g., 15
  urgency: UrgencyLevel;
  rawText?: string;
  // Execution status
  guardrailResult?: GuardrailResult;
  riskAssessment?: RiskAssessment;
  decision?: DecisionStatus;
  executionStatus:
    | "PENDING_REVIEW"
    | "APPROVED"
    | "REJECTED"
    | "PROCESSING"
    | "PAID"
    | "FAILED"
    | "BLOCKED";
  idempotencyKey?: string;
  paypalOrderId?: string;
  paypalPayoutBatchId?: string;
  paypalCaptureId?: string;
  executedAt?: string;
  failureReason?: string;
}

export interface PaymentPlan {
  id: string;
  originalPrompt: string;
  createdAt: string;
  steps: PaymentStep[];
  totalPlannedAmount: number;
  status: "DRAFT" | "READY" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
}

export type AuditEventType =
  | "TASK_RECEIVED"
  | "PLAN_STRUCTURED"
  | "RULE_CHECKED"
  | "RISK_SCORED"
  | "HELD_FOR_APPROVAL"
  | "USER_APPROVED"
  | "USER_REJECTED"
  | "AMOUNT_EDITED"
  | "PAYMENT_INITIATED"
  | "PAYPAL_ORDER_CREATED"
  | "PAYPAL_CAPTURED"
  | "PAYPAL_PAYOUT_SENT"
  | "WEBHOOK_CONFIRMED"
  | "PAYMENT_BLOCKED"
  | "DISPUTE_DRAFTED";

export interface AuditEntry {
  id: string;
  timestamp: string;
  stepId?: string;
  eventType: AuditEventType;
  title: string;
  detail: string;
  payee?: string;
  amount?: number;
  currency?: string;
  statusStamp?: "PAID" | "HELD" | "BLOCKED" | "VERIFIED" | "REJECTED";
  idempotencyKey?: string;
  metadata?: Record<string, any>;
}

export interface DisputeDraft {
  transactionId: string;
  paypalId: string;
  payee: string;
  amount: number;
  currency: string;
  date: string;
  reasonCategory: "UNAUTHORIZED" | "INCORRECT_AMOUNT" | "ITEM_NOT_RECEIVED" | "DEFECTIVE_SERVICE";
  narrative: string;
  evidenceItems: string[];
  paypalDisputeUrl: string;
}
