import {
  UserRulesConfig,
  Payee,
  PaymentStep,
  PaymentPlan,
  AuditEntry,
  DisputeDraft,
} from "@/types/payment";
import { DEFAULT_RULES, INITIAL_APPROVED_PAYEES } from "../guardrails/defaultRules";
import { createAuditEntry } from "../audit/tape";

// In-memory persistent state across API routes for the active session
class PayPilotStore {
  public rules: UserRulesConfig = { ...DEFAULT_RULES };
  public approvedPayees: Payee[] = [...INITIAL_APPROVED_PAYEES];
  public historicalPayments: PaymentStep[] = [
    {
      id: "hist-1",
      payee: "Amazon Web Services",
      payeeIdentifier: "aws-billing@amazon.com",
      payeeType: "EMAIL",
      amount: 85.0,
      currency: "USD",
      purpose: "Monthly cloud infrastructure compute & storage",
      category: "SERVICES",
      urgency: "NORMAL",
      decision: "ALLOW",
      executionStatus: "PAID",
      idempotencyKey: "idem-hist-aws-8500",
      paypalOrderId: "SANDBOX-ORD-HIST-AWS",
      paypalCaptureId: "CAP-AWS-001",
      executedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "hist-2",
      payee: "GitHub Inc",
      payeeIdentifier: "billing@github.com",
      payeeType: "EMAIL",
      amount: 21.0,
      currency: "USD",
      purpose: "GitHub Team & Actions runner credits",
      category: "SOFTWARE",
      urgency: "NORMAL",
      decision: "ALLOW",
      executionStatus: "PAID",
      idempotencyKey: "idem-hist-gh-2100",
      paypalOrderId: "SANDBOX-ORD-HIST-GH",
      paypalCaptureId: "CAP-GH-002",
      executedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "hist-3",
      payee: "Figma Inc",
      payeeIdentifier: "payments@figma.com",
      payeeType: "EMAIL",
      amount: 45.0,
      currency: "USD",
      purpose: "Design seat subscription",
      category: "SOFTWARE",
      urgency: "NORMAL",
      decision: "ALLOW",
      executionStatus: "PAID",
      idempotencyKey: "idem-hist-figma-4500",
      paypalOrderId: "SANDBOX-ORD-HIST-FIGMA",
      paypalCaptureId: "CAP-FIGMA-003",
      executedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "hist-4",
      payee: "Riya Sharma",
      payeeIdentifier: "riya.design@example.com",
      payeeType: "EMAIL",
      amount: 200.0,
      currency: "USD",
      purpose: "Sprint 1 brand icon illustrations",
      category: "CONTRACTOR",
      urgency: "NORMAL",
      decision: "ALLOW",
      executionStatus: "PAID",
      idempotencyKey: "idem-hist-riya-20000",
      paypalPayoutBatchId: "SANDBOX-PAYOUT-RIYA-01",
      executedAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  public activePlan: PaymentPlan | null = null;
  public totalBlockedSavings: number = 340.0; // Baseline stopped payments this month

  public auditTape: AuditEntry[] = [
    createAuditEntry({
      eventType: "RULE_CHECKED",
      title: "Guardrails Policy Loaded",
      detail:
        "Deterministic spending policy active: $3,500 monthly cap, $1,000 single cap, $150 approval threshold.",
      statusStamp: "VERIFIED",
    }),
    createAuditEntry({
      eventType: "PAYMENT_INITIATED",
      title: "Settled: AWS Cloud Infrastructure",
      detail: "Routine cloud billing cleared within approved bounds ($85.00 USD).",
      payee: "Amazon Web Services",
      amount: 85.0,
      statusStamp: "PAID",
      idempotencyKey: "idem-hist-aws-8500",
    }),
    createAuditEntry({
      eventType: "PAYMENT_BLOCKED",
      title: "Blocked: Unknown Crypto Gateway",
      detail:
        "Rule BLOCKED_CATEGORY triggered. Policy prohibited $340 transfer to unverified gambling/crypto merchant.",
      payee: "CryptoQuickDesk",
      amount: 340.0,
      statusStamp: "BLOCKED",
    }),
  ];

  // Helper methods
  public getCurrentMonthSpend(): number {
    return this.historicalPayments
      .filter((p) => p.executionStatus === "PAID")
      .reduce((sum, p) => sum + p.amount, 0);
  }

  public addAuditEntry(entry: AuditEntry) {
    this.auditTape.unshift(entry); // newest first for live tape display
  }

  public recordBlockedSavings(amount: number) {
    this.totalBlockedSavings += amount;
  }

  public resetToDefaults() {
    this.rules = { ...DEFAULT_RULES };
    this.approvedPayees = [...INITIAL_APPROVED_PAYEES];
    this.activePlan = null;
  }
}

// Global singleton instance across Next.js server invocations
const globalForStore = global as unknown as { payPilotStore?: PayPilotStore };
export const store = globalForStore.payPilotStore || new PayPilotStore();
if (process.env.NODE_ENV !== "production") globalForStore.payPilotStore = store;
