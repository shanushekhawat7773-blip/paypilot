import { NextResponse } from "next/server";
import { store } from "@/lib/storage/store";

export async function GET() {
  return NextResponse.json({
    rules: store.rules,
    approvedPayees: store.approvedPayees,
    currentMonthSpend: store.getCurrentMonthSpend(),
    monthlyBudget: store.rules.monthlyBudget,
    totalBlockedSavings: store.totalBlockedSavings,
    historicalPayments: store.historicalPayments,
    activePlan: store.activePlan,
    auditTape: store.auditTape.slice(0, 30),
  });
}
