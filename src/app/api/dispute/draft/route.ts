import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/storage/store";
import { createAuditEntry } from "@/lib/audit/tape";
import { DisputeDraft } from "@/types/payment";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      transactionId,
      reasonCategory = "UNAUTHORIZED",
      additionalNotes = "",
    } = body;

    const payment = store.historicalPayments.find((p) => p.id === transactionId);

    if (!payment) {
      return NextResponse.json(
        { error: "Payment transaction not found in ledger" },
        { status: 404 }
      );
    }

    const paypalRef =
      payment.paypalOrderId ||
      payment.paypalPayoutBatchId ||
      payment.idempotencyKey ||
      "N/A";

    const reasonTitles: Record<string, string> = {
      UNAUTHORIZED: "Unauthorized or Erroneous Transaction",
      INCORRECT_AMOUNT: "Incorrect Billing Amount Discrepancy",
      ITEM_NOT_RECEIVED: "Services/Goods Not Delivered as Agreed",
      DEFECTIVE_SERVICE: "Defective Deliverable or Breach of Agreement",
    };

    const narrative = `RE: Dispute Claim for Transaction Ref #${paypalRef}
Payee: ${payment.payee} (${payment.payeeIdentifier || "N/A"})
Amount: $${payment.amount.toFixed(2)} ${payment.currency}
Settlement Date: ${payment.executedAt || new Date().toISOString()}

Dear PayPal Resolution Team,

I am filing a formal dispute regarding the above-referenced payment. This transaction was processed via an autonomous agent workflow without proper delivery or authorization matching the intended specifications:

Purpose on record: "${payment.purpose}".
Dispute Classification: ${reasonTitles[reasonCategory] || reasonCategory}.

Factual Summary:
${
  additionalNotes
    ? additionalNotes
    : `The vendor (${payment.payee}) failed to fulfill the contractual deliverable described in the order memo, or billed an amount incongruent with prior written terms. Cryptographic execution logs confirm the payment was released under ref ${payment.idempotencyKey}.`
}

We request a full refund of $${payment.amount.toFixed(
      2
    )} ${payment.currency} to the funding source in accordance with PayPal Buyer Protection guidelines. Complete cryptographic audit trails from PayPilot are attached for verification.`;

    const disputeDraft: DisputeDraft = {
      transactionId: payment.id,
      paypalId: paypalRef,
      payee: payment.payee,
      amount: payment.amount,
      currency: payment.currency,
      date: payment.executedAt || new Date().toISOString(),
      reasonCategory,
      narrative,
      evidenceItems: [
        `Deterministic Idempotency Hash: ${payment.idempotencyKey || "N/A"}`,
        `Settlement Timestamp: ${payment.executedAt || new Date().toISOString()}`,
        `Original Agent Prompt: "${payment.purpose}"`,
        `Category: ${payment.category}`,
      ],
      paypalDisputeUrl: `https://www.sandbox.paypal.com/disputes/`,
    };

    store.addAuditEntry(
      createAuditEntry({
        eventType: "DISPUTE_DRAFTED",
        title: `Dispute Package Prepared: ${payment.payee} ($${payment.amount.toFixed(
          2
        )})`,
        detail: `Generated PayPal Resolution Center claim package. Classification: ${reasonCategory}. PayPal Ref: ${paypalRef}.`,
        payee: payment.payee,
        amount: payment.amount,
        currency: payment.currency,
        stepId: payment.id,
      })
    );

    return NextResponse.json({
      success: true,
      draft: disputeDraft,
    });
  } catch (err: any) {
    console.error("Dispute draft error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to draft dispute" },
      { status: 500 }
    );
  }
}
