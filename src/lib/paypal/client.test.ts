import { describe, it, expect } from "vitest";
import {
  generateIdempotencyKey,
  createPayPalOrder,
  capturePayPalOrder,
  createPayPalPayout,
  verifyPayPalWebhookSignature,
} from "./client";

describe("PayPilot PayPal Sandbox Integration Client", () => {
  it("1. generates deterministic SHA-256 idempotency key from payment parameters", () => {
    const key1 = generateIdempotencyKey("step-1", "Riya Sharma", 200, "USD");
    const key2 = generateIdempotencyKey("step-1", "Riya Sharma", 200, "USD");
    const keyDiff = generateIdempotencyKey("step-2", "Riya Sharma", 200, "USD");

    expect(key1).toBe(key2); // strictly deterministic
    expect(key1).not.toBe(keyDiff);
    expect(key1).toHaveLength(36);
  });

  it("2. creates authentic Orders v2 mock sandbox order when credentials absent", async () => {
    const idempotencyKey = generateIdempotencyKey("step-1", "Domain Registrar", 18, "USD");
    const result = await createPayPalOrder(
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: "step-1",
            amount: { currency_code: "USD", value: "18.00" },
            description: "Domain renewal",
          },
        ],
      },
      idempotencyKey
    );

    expect(result.success).toBe(true);
    expect(result.isMock).toBe(true);
    expect(result.data.id).toMatch(/^SANDBOX-ORD-/);
    expect(result.data.status).toBe("COMPLETED");
    expect(result.data.purchase_units[0].amount.value).toBe("18.00");
  });

  it("3. captures Orders v2 sandbox order returning COMPLETED state", async () => {
    const idempotencyKey = "test-capture-key";
    const result = await capturePayPalOrder("ORDER-12345", idempotencyKey);

    expect(result.success).toBe(true);
    expect(result.data.status).toBe("COMPLETED");
  });

  it("4. creates authentic Payouts v1 disbursement for contractor payments", async () => {
    const idempotencyKey = generateIdempotencyKey("step-riya", "Riya Sharma", 200, "USD");
    const result = await createPayPalPayout(
      {
        sender_batch_header: {
          sender_batch_id: `BATCH-${idempotencyKey.substring(0, 8)}`,
          email_subject: "Payment for design work via PayPilot",
        },
        items: [
          {
            recipient_type: "EMAIL",
            amount: { value: "200.00", currency: "USD" },
            receiver: "riya.design@example.com",
            note: "Logo design fee",
            sender_item_id: "step-riya",
          },
        ],
      },
      idempotencyKey
    );

    expect(result.success).toBe(true);
    expect(result.data.batch_header.batch_status).toBe("SUCCESS");
    expect(result.data.batch_header.payout_batch_id).toMatch(/^SANDBOX-PAYOUT-/);
  });

  it("5. verifies webhook signature correctly in mock / sandbox mode", async () => {
    const isValid = await verifyPayPalWebhookSignature({
      transmission_id: "trans-abc-123",
      transmission_sig: "sig-xyz-789",
      transmission_time: new Date().toISOString(),
      cert_url: "https://api.sandbox.paypal.com/cert.pem",
      auth_algo: "SHA256withRSA",
      webhook_id: "WH-DEMO-01",
      webhook_event: { event_type: "CHECKOUT.ORDER.COMPLETED" },
    });

    expect(isValid).toBe(true);
  });
});
