import {
  PayPalCreateOrderRequest,
  PayPalOrderResponse,
  PayPalCreatePayoutRequest,
  PayPalPayoutBatchResponse,
} from "@/types/paypal";

export function mockPayPalOrder(
  req: PayPalCreateOrderRequest,
  idempotencyKey: string
): PayPalOrderResponse {
  const orderId = `SANDBOX-ORD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const now = new Date().toISOString();

  return {
    id: orderId,
    status: "COMPLETED",
    intent: req.intent || "CAPTURE",
    purchase_units: req.purchase_units.map((unit, index) => ({
      reference_id: unit.reference_id || `PU-${index}`,
      amount: unit.amount,
      payee: unit.payee,
      payments: {
        captures: [
          {
            id: `CAP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            status: "COMPLETED",
            amount: unit.amount,
            create_time: now,
          },
        ],
      },
    })),
    create_time: now,
    links: [
      {
        href: `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}`,
        rel: "self",
        method: "GET",
      },
    ],
  };
}

export function mockPayPalPayout(
  req: PayPalCreatePayoutRequest,
  idempotencyKey: string
): PayPalPayoutBatchResponse {
  const batchId = `SANDBOX-PAYOUT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const now = new Date().toISOString();
  const firstItem = req.items[0];

  return {
    batch_header: {
      payout_batch_id: batchId,
      batch_status: "SUCCESS",
      time_created: now,
      sender_batch_header: {
        sender_batch_id: req.sender_batch_header.sender_batch_id,
        email_subject: req.sender_batch_header.email_subject || "Payment from PayPilot Agent",
      },
      amount: {
        currency: firstItem?.amount.currency || "USD",
        value: firstItem?.amount.value || "0.00",
      },
    },
    links: [
      {
        href: `https://api-m.sandbox.paypal.com/v1/payments/payouts/${batchId}`,
        rel: "self",
        method: "GET",
      },
    ],
  };
}
