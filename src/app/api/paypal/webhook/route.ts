import { NextRequest, NextResponse } from "next/server";
import { verifyPayPalWebhookSignature } from "@/lib/paypal/client";
import { store } from "@/lib/storage/store";
import { createAuditEntry } from "@/lib/audit/tape";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const event = JSON.parse(rawBody);

    const authAlgo = req.headers.get("paypal-auth-algo") || "";
    const certUrl = req.headers.get("paypal-cert-url") || "";
    const transmissionId = req.headers.get("paypal-transmission-id") || "";
    const transmissionSig = req.headers.get("paypal-transmission-sig") || "";
    const transmissionTime = req.headers.get("paypal-transmission-time") || "";
    const webhookId = process.env.PAYPAL_WEBHOOK_ID || "mock-webhook-id-12345";

    // Verify signature
    const isValid = await verifyPayPalWebhookSignature({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: event,
    });

    if (!isValid) {
      console.warn("Invalid PayPal webhook signature detected");
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 401 }
      );
    }

    const eventType = event.event_type || "PAYMENT.CAPTURE.COMPLETED";
    const summary = event.summary || "PayPal status update received";
    const resource = event.resource || {};
    const amountVal = resource.amount?.value ? parseFloat(resource.amount.value) : undefined;

    // Log verified webhook event to audit tape
    store.addAuditEntry(
      createAuditEntry({
        eventType: "WEBHOOK_CONFIRMED",
        title: `PayPal Webhook Verified: ${eventType}`,
        detail: `Cryptographically verified PayPal transmission (${transmissionId.substring(
          0,
          8
        )}...). Summary: ${summary}.`,
        amount: amountVal,
        currency: resource.amount?.currency_code || "USD",
        statusStamp: "VERIFIED",
        metadata: {
          transmissionId,
          eventType,
        },
      })
    );

    return NextResponse.json({
      status: "SUCCESS",
      message: "Webhook verified and processed",
    });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process webhook" },
      { status: 500 }
    );
  }
}
