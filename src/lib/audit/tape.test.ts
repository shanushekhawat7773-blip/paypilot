import { describe, it, expect } from "vitest";
import { createAuditEntry, exportAuditTapeToCSV } from "./tape";
import { AuditEntry } from "@/types/payment";

describe("PayPilot Audit Tape & Ledger Export", () => {
  it("1. creates append-only timestamped audit entry with stamp and idempotency key", () => {
    const entry = createAuditEntry({
      eventType: "PAYPAL_PAYOUT_SENT",
      title: "PayPal Payout Cleared",
      detail: "Disbursed $200.00 USD to Riya Sharma via Payouts v1",
      stepId: "step-demo-1",
      payee: "Riya Sharma",
      amount: 200,
      currency: "USD",
      statusStamp: "PAID",
      idempotencyKey: "idem-riya-200-test",
    });

    expect(entry.id).toMatch(/^audit-/);
    expect(entry.timestamp).toBeDefined();
    expect(entry.statusStamp).toBe("PAID");
    expect(entry.amount).toBe(200);
    expect(entry.payee).toBe("Riya Sharma");
    expect(entry.idempotencyKey).toBe("idem-riya-200-test");
  });

  it("2. supports rubber stamp variants: PAID, HELD, BLOCKED, VERIFIED, REJECTED", () => {
    const stamps: Array<"PAID" | "HELD" | "BLOCKED" | "VERIFIED" | "REJECTED"> = [
      "PAID",
      "HELD",
      "BLOCKED",
      "VERIFIED",
      "REJECTED",
    ];

    stamps.forEach((stamp) => {
      const entry = createAuditEntry({
        eventType: "RULE_CHECKED",
        title: `Test Stamp ${stamp}`,
        detail: `Verification check for ${stamp}`,
        statusStamp: stamp,
      });
      expect(entry.statusStamp).toBe(stamp);
    });
  });

  it("3. exports audit tape to RFC-4180 compliant CSV format with properly escaped quotes", () => {
    const entries: AuditEntry[] = [
      {
        id: "audit-1",
        timestamp: "2026-10-29T12:00:00.000Z",
        eventType: "RULE_CHECKED",
        title: 'Rule "Cap" Checked',
        detail: 'User limit was $15.00, invoice had "overage" fees.',
        payee: "Domain Registrar Co",
        amount: 18.0,
        currency: "USD",
        statusStamp: "BLOCKED",
        idempotencyKey: "idem-domain-18",
      },
      {
        id: "audit-2",
        timestamp: "2026-10-29T12:01:00.000Z",
        eventType: "PAYPAL_PAYOUT_SENT",
        title: "PayPal Payout Successful",
        detail: "Paid contractor for design.",
        payee: "Riya Sharma",
        amount: 200.0,
        currency: "USD",
        statusStamp: "PAID",
        idempotencyKey: "idem-riya-200",
      },
    ];

    const csv = exportAuditTapeToCSV(entries);

    // Header check
    expect(csv).toContain("Timestamp,Event Type,Title,Payee,Amount,Currency,Stamp,Idempotency Key,Detail & Reasoning");
    // Escaped content check
    expect(csv).toContain('"Domain Registrar Co"');
    expect(csv).toContain('"BLOCKED"');
    expect(csv).toContain('"18.00"');
    expect(csv).toContain('""overage""'); // double quoted for RFC-4180
    expect(csv).toContain('"Riya Sharma"');
    expect(csv).toContain('"PAID"');
  });
});
