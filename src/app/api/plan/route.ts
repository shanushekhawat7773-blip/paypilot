import { NextRequest, NextResponse } from "next/server";
import { planPaymentPrompt } from "@/lib/planner/planner";
import { store } from "@/lib/storage/store";
import { createAuditEntry } from "@/lib/audit/tape";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = (body.prompt || "").trim();

    if (!prompt) {
      return NextResponse.json(
        { error: "Payment prompt is required" },
        { status: 400 }
      );
    }

    // Record incoming task received in audit tape
    store.addAuditEntry(
      createAuditEntry({
        eventType: "TASK_RECEIVED",
        title: "Task Received via Agent Interface",
        detail: `Instruction: "${prompt}"`,
      })
    );

    // Run planner
    const plan = await planPaymentPrompt(prompt);
    store.activePlan = plan;

    // Record planning completion in audit tape
    store.addAuditEntry(
      createAuditEntry({
        eventType: "PLAN_STRUCTURED",
        title: `Plan Formulated: ${plan.steps.length} Payment Step${
          plan.steps.length > 1 ? "s" : ""
        }`,
        detail: `Decomposed into ${plan.steps.length} structured step(s). Total planned volume: $${plan.totalPlannedAmount.toFixed(
          2
        )} USD. Handing off to deterministic guardrails engine.`,
      })
    );

    return NextResponse.json({ success: true, plan });
  } catch (err: any) {
    console.error("Plan route error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to formulate plan" },
      { status: 500 }
    );
  }
}
