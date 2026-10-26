import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/storage/store";
import {
  generateIdempotencyKey,
  createPayPalOrder,
  capturePayPalOrder,
  createPayPalPayout,
} from "@/lib/paypal/client";
import { createAuditEntry } from "@/lib/audit/tape";
import { evaluateGuardrails } from "@/lib/guardrails/engine";
import { assessPaymentRisk } from "@/lib/risk/scorer";
import { PaymentStep } from "@/types/payment";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { stepId, action, editedAmount } = body;

    if (!stepId || !action) {
      return NextResponse.json(
        { error: "stepId and action (APPROVE, REJECT, EDIT) are required" },
        { status: 400 }
      );
    }

    // Find step in active plan or historical
    let step = store.activePlan?.steps.find((s) => s.id === stepId);
    if (!step && body.step) {
      step = body.step;
    }

    if (!step) {
      return NextResponse.json(
        { error: "Payment step not found" },
        { status: 404 }
      );
    }

    // Case 1: USER REJECTS PAYMENT (e.g., QuickInvoice $900 in demo scenario)
    if (action === "REJECT") {
      step.executionStatus = "REJECTED";
      store.recordBlockedSavings(step.amount);

      store.addAuditEntry(
        createAuditEntry({
          eventType: "USER_REJECTED",
          title: `Payment Rejected by User: ${step.payee} ($${step.amount.toFixed(
            2
          )})`,
          detail: `User declined authorization for ${step.payee}. $${step.amount.toFixed(
            2
          )} preserved in account balance.`,
          payee: step.payee,
          amount: step.amount,
          currency: step.currency,
          statusStamp: "REJECTED",
          stepId: step.id,
        })
      );

      return NextResponse.json({
        success: true,
        step,
        totalBlockedSavings: store.totalBlockedSavings,
      });
    }

    // Case 2: USER EDITS AMOUNT
    if (action === "EDIT") {
      if (typeof editedAmount !== "number" || editedAmount <= 0) {
        return NextResponse.json(
          { error: "Valid positive editedAmount is required" },
          { status: 400 }
        );
      }

      const oldAmount = step.amount;
      step.amount = editedAmount;

      // Re-evaluate guardrails and risk with new amount
      const guardrailResult = evaluateGuardrails(step, {
        rules: store.rules,
        approvedPayees: store.approvedPayees,
        recentPayments: store.historicalPayments,
        currentMonthTotalSpend: store.getCurrentMonthSpend(),
      });

      const riskAssessment = assessPaymentRisk(step, {
        approvedPayees: store.approvedPayees,
      });

      let finalDecision = guardrailResult.decision;
      if (finalDecision === "ALLOW" && riskAssessment.overallScore >= 65) {
        finalDecision = "HOLD_FOR_APPROVAL";
      }

      step.guardrailResult = guardrailResult;
      step.riskAssessment = riskAssessment;
      step.decision = finalDecision;
      step.executionStatus =
        finalDecision === "BLOCK"
          ? "BLOCKED"
          : finalDecision === "HOLD_FOR_APPROVAL"
          ? "PENDING_REVIEW"
          : "APPROVED";

      store.addAuditEntry(
        createAuditEntry({
          eventType: "AMOUNT_EDITED",
          title: `Amount Adjusted: ${step.payee} ($${oldAmount.toFixed(
            2
          )} → $${editedAmount.toFixed(2)})`,
          detail: `Amount modified by user. Guardrails recalculated. New decision: ${finalDecision}.`,
          payee: step.payee,
          amount: editedAmount,
          currency: step.currency,
          stepId: step.id,
        })
      );

      return NextResponse.json({ success: true, step });
    }

    // Case 3: EXECUTE PAYMENT (APPROVE / ALLOW)
    if (action === "APPROVE" || action === "EXECUTE") {
      const idempotencyKey = generateIdempotencyKey(
        step.id,
        step.payee,
        step.amount,
        step.currency
      );
      step.idempotencyKey = idempotencyKey;

      if (action === "APPROVE") {
        store.addAuditEntry(
          createAuditEntry({
            eventType: "USER_APPROVED",
            title: `User Authorization Granted: ${step.payee} ($${step.amount.toFixed(
              2
            )})`,
            detail: `Manual override accepted. Proceeding to PayPal Sandbox execution with idempotency key ${idempotencyKey.substring(
              0,
              12
            )}...`,
            payee: step.payee,
            amount: step.amount,
            currency: step.currency,
            stepId: step.id,
            idempotencyKey,
          })
        );
      }

      // Record initiation
      store.addAuditEntry(
        createAuditEntry({
          eventType: "PAYMENT_INITIATED",
          title: `Dispatching to PayPal Sandbox: ${step.payee}`,
          detail: `Calling PayPal REST API for ${step.payee} ($${step.amount.toFixed(
            2
          )} ${step.currency}) with idempotency key.`,
          payee: step.payee,
          amount: step.amount,
          currency: step.currency,
          stepId: step.id,
          idempotencyKey,
        })
      );

      let paypalResult: any = null;

      // Payouts API for contractors/individuals (e.g., Riya Sharma), Orders API for merchants/services
      if (
        step.category === "CONTRACTOR" ||
        step.payeeType === "EMAIL" ||
        step.payeeType === "PHONE"
      ) {
        const payoutReq = {
          sender_batch_header: {
            sender_batch_id: `batch-${idempotencyKey.substring(0, 16)}`,
            email_subject: `PayPilot payment for ${step.purpose}`,
            email_message: `You have received a payment of $${step.amount.toFixed(
              2
            )} from PayPilot AI Agent.`,
          },
          items: [
            {
              recipient_type: (step.payeeType === "PHONE"
                ? "PHONE"
                : "EMAIL") as "EMAIL" | "PHONE",
              amount: {
                value: step.amount.toFixed(2),
                currency: step.currency,
              },
              note: step.purpose,
              sender_item_id: step.id,
              receiver:
                step.payeeIdentifier ||
                `${step.payee.toLowerCase().replace(/\s+/g, ".")}@example.com`,
            },
          ],
        };

        const res = await createPayPalPayout(payoutReq, idempotencyKey);
        paypalResult = res.data;
        step.paypalPayoutBatchId = res.data.batch_header.payout_batch_id;

        store.addAuditEntry(
          createAuditEntry({
            eventType: "PAYPAL_PAYOUT_SENT",
            title: `PayPal Payout Success: ${step.payee} ($${step.amount.toFixed(
              2
            )})`,
            detail: `PayPal Payout batch ${step.paypalPayoutBatchId} confirmed. Recipient: ${payoutReq.items[0].receiver}.`,
            payee: step.payee,
            amount: step.amount,
            currency: step.currency,
            statusStamp: "PAID",
            stepId: step.id,
            idempotencyKey,
            metadata: { batchId: step.paypalPayoutBatchId, isMock: res.isMock },
          })
        );
      } else {
        // Orders API
        const orderReq = {
          intent: "CAPTURE" as const,
          purchase_units: [
            {
              reference_id: step.id,
              description: step.purpose,
              amount: {
                currency_code: step.currency,
                value: step.amount.toFixed(2),
              },
            },
          ],
        };

        const orderRes = await createPayPalOrder(orderReq, idempotencyKey);
        const captureRes = await capturePayPalOrder(
          orderRes.data.id,
          idempotencyKey
        );
        paypalResult = captureRes.data;
        step.paypalOrderId = orderRes.data.id;

        store.addAuditEntry(
          createAuditEntry({
            eventType: "PAYPAL_CAPTURED",
            title: `PayPal Order Captured: ${step.payee} ($${step.amount.toFixed(
              2
            )})`,
            detail: `PayPal Order ${step.paypalOrderId} captured successfully. Funds transferred in Sandbox.`,
            payee: step.payee,
            amount: step.amount,
            currency: step.currency,
            statusStamp: "PAID",
            stepId: step.id,
            idempotencyKey,
            metadata: { orderId: step.paypalOrderId, isMock: orderRes.isMock },
          })
        );
      }

      step.executionStatus = "PAID";
      step.executedAt = new Date().toISOString();

      // Add to historical settled payments
      store.historicalPayments.unshift(step);

      return NextResponse.json({
        success: true,
        step,
        paypal: paypalResult,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Pay execution error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to execute payment" },
      { status: 500 }
    );
  }
}
