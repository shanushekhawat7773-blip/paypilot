import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/storage/store";
import { planPaymentPrompt } from "@/lib/planner/planner";
import { evaluateGuardrails } from "@/lib/guardrails/engine";
import { assessPaymentRisk } from "@/lib/risk/scorer";

const PAYPAL_AGENT_TOOLKIT_SPECS = [
  {
    name: "paypal_propose_payment",
    description:
      "Convert a natural language payment instruction into a structured payment step. The LLM PROPOSES; deterministic code DECIDES.",
    parameters: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Plain language payment command, e.g. 'Pay Alex $50 for lunch'",
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "paypal_evaluate_guardrails",
    description:
      "Pass proposed payment parameters through the deterministic TypeScript spending guardrails engine.",
    parameters: {
      type: "object",
      properties: {
        payee: { type: "string" },
        amount: { type: "number" },
        category: { type: "string" },
        conditionLimit: { type: "number" },
      },
      required: ["payee", "amount"],
    },
  },
  {
    name: "paypal_get_balance_and_budget",
    description:
      "Inspect current monthly spending limits, spend-to-date, and remaining spending leash.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
];

export async function GET() {
  return NextResponse.json({
    tools: PAYPAL_AGENT_TOOLKIT_SPECS,
    standard: "PayPal Agent Toolkit / MCP v1.0",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tool, arguments: args } = body;

    if (tool === "paypal_propose_payment") {
      const plan = await planPaymentPrompt(args.prompt);
      return NextResponse.json({ success: true, result: plan });
    }

    if (tool === "paypal_evaluate_guardrails") {
      const mockStep: any = {
        id: "tool-step",
        payee: args.payee,
        amount: args.amount,
        currency: "USD",
        purpose: args.purpose || "Agent tool check",
        category: args.category || "SERVICES",
        conditionLimit: args.conditionLimit,
        urgency: "NORMAL",
        executionStatus: "PENDING_REVIEW",
      };

      const guardrail = evaluateGuardrails(mockStep, {
        rules: store.rules,
        approvedPayees: store.approvedPayees,
        recentPayments: store.historicalPayments,
        currentMonthTotalSpend: store.getCurrentMonthSpend(),
      });
      const risk = assessPaymentRisk(mockStep, {
        approvedPayees: store.approvedPayees,
      });

      return NextResponse.json({
        success: true,
        guardrail,
        risk,
      });
    }

    if (tool === "paypal_get_balance_and_budget") {
      const spend = store.getCurrentMonthSpend();
      return NextResponse.json({
        monthlyBudget: store.rules.monthlyBudget,
        currentSpend: spend,
        remainingLeash: Math.max(store.rules.monthlyBudget - spend, 0),
        perPaymentCap: store.rules.perPaymentCap,
        askAboveThreshold: store.rules.askAboveThreshold,
      });
    }

    return NextResponse.json({ error: `Unknown tool: ${tool}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
