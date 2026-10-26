import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/storage/store";
import { createAuditEntry } from "@/lib/audit/tape";

export async function GET() {
  return NextResponse.json({
    rules: store.rules,
    approvedPayees: store.approvedPayees,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.rules) {
      store.rules = {
        ...store.rules,
        ...body.rules,
      };

      store.addAuditEntry(
        createAuditEntry({
          eventType: "RULE_CHECKED",
          title: "Spending Rules Policy Updated",
          detail: `Parameters adjusted: Monthly Cap $${store.rules.monthlyBudget}, Per-Payment Cap $${store.rules.perPaymentCap}, Ask Above $${store.rules.askAboveThreshold}.`,
          statusStamp: "VERIFIED",
        })
      );
    }

    if (body.addPayee) {
      const newPayee = body.addPayee;
      const exists = store.approvedPayees.some(
        (p) =>
          p.identifier.toLowerCase() === newPayee.identifier.toLowerCase() ||
          p.name.toLowerCase() === newPayee.name.toLowerCase()
      );

      if (!exists) {
        store.approvedPayees.push({
          id: `payee-${Date.now()}`,
          name: newPayee.name,
          identifier: newPayee.identifier,
          type: newPayee.type || "EMAIL",
          isApproved: true,
          addedAt: new Date().toISOString(),
          tags: newPayee.tags || ["Verified"],
          maxPreApprovedLimit: newPayee.maxPreApprovedLimit || store.rules.askAboveThreshold,
        });

        store.addAuditEntry(
          createAuditEntry({
            eventType: "RULE_CHECKED",
            title: `Payee Added to Whitelist: ${newPayee.name}`,
            detail: `Added ${newPayee.name} (${newPayee.identifier}) to approved list. Pre-authorized limit: $${
              newPayee.maxPreApprovedLimit || store.rules.askAboveThreshold
            }.`,
            statusStamp: "VERIFIED",
          })
        );
      }
    }

    if (body.togglePayeeId) {
      const p = store.approvedPayees.find((x) => x.id === body.togglePayeeId);
      if (p) {
        p.isApproved = !p.isApproved;
        store.addAuditEntry(
          createAuditEntry({
            eventType: "RULE_CHECKED",
            title: `Payee Status Toggled: ${p.name}`,
            detail: `Whitelist status set to ${p.isApproved ? "APPROVED" : "SUSPENDED"}.`,
            statusStamp: "VERIFIED",
          })
        );
      }
    }

    return NextResponse.json({
      success: true,
      rules: store.rules,
      approvedPayees: store.approvedPayees,
    });
  } catch (err: any) {
    console.error("Rules update error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update rules" },
      { status: 500 }
    );
  }
}
