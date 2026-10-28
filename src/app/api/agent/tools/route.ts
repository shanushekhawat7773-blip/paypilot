import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/storage/store";
import { planPaymentPrompt } from "@/lib/planner/planner";
import { evaluateGuardrails } from "@/lib/guardrails/engine";
import { assessPaymentRisk } from "@/lib/risk/scorer";

const PAYPAL_AGENT_TOOLKIT_SPECS = [
  {
    name: "paypal_propose_payment",
    description:
      "Convert a natural language payment instruction into structured payment steps. Core architecture: The LLM PROPOSES; deterministic code DECIDES.",
    inputSchema: {
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
      "Pass proposed payment parameters through the deterministic TypeScript spending guardrails engine to verify budget, whitelist, cap, and risk.",
    inputSchema: {
      type: "object",
      properties: {
        payee: { type: "string", description: "Beneficiary name or identifier" },
        amount: { type: "number", description: "Payment amount in currency" },
        category: { type: "string", description: "Merchant/disbursement category" },
        conditionLimit: { type: "number", description: "Optional user price ceiling" },
      },
      required: ["payee", "amount"],
    },
  },
  {
    name: "paypal_get_balance_and_budget",
    description:
      "Inspect current monthly spending limits, spend-to-date, remaining spending leash, and policy thresholds.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

export async function GET() {
  return NextResponse.json({
    tools: PAYPAL_AGENT_TOOLKIT_SPECS,
    standard: "Model Context Protocol (MCP) v1.0",
    protocolVersion: "2024-11-05",
    serverInfo: {
      name: "paypilot-paypal-agent-toolkit",
      version: "1.0.0",
      description: "Autonomous payment guardrails and private ledger for PayPal",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support both standard MCP JSON-RPC format and REST tool call format
    const isJsonRpc = body.jsonrpc === "2.0";
    const method = body.method;
    const reqId = body.id;

    if (isJsonRpc && method === "tools/list") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id: reqId,
        result: {
          tools: PAYPAL_AGENT_TOOLKIT_SPECS,
        },
      });
    }

    const toolName = isJsonRpc ? body.params?.name : body.tool;
    const args = isJsonRpc ? body.params?.arguments || {} : body.arguments || {};

    if (toolName === "paypal_propose_payment") {
      const plan = await planPaymentPrompt(args.prompt);
      const result = { success: true, plan };
      return isJsonRpc
        ? NextResponse.json({ jsonrpc: "2.0", id: reqId, result: { content: [{ type: "text", text: JSON.stringify(result) }] } })
        : NextResponse.json(result);
    }

    if (toolName === "paypal_evaluate_guardrails") {
      const mockStep: any = {
        id: `tool-step-${Date.now()}`,
        payee: args.payee,
        amount: args.amount,
        currency: "USD",
        purpose: args.purpose || "Agent tool evaluation check",
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

      const result = {
        success: true,
        decision: guardrail.decision,
        guardrail,
        risk,
      };

      return isJsonRpc
        ? NextResponse.json({ jsonrpc: "2.0", id: reqId, result: { content: [{ type: "text", text: JSON.stringify(result) }] } })
        : NextResponse.json(result);
    }

    if (toolName === "paypal_get_balance_and_budget") {
      const spend = store.getCurrentMonthSpend();
      const result = {
        monthlyBudget: store.rules.monthlyBudget,
        currentSpend: spend,
        remainingLeash: Math.max(store.rules.monthlyBudget - spend, 0),
        perPaymentCap: store.rules.perPaymentCap,
        askAboveThreshold: store.rules.askAboveThreshold,
        dailyVelocityLimit: store.rules.dailyVelocityLimit,
      };

      return isJsonRpc
        ? NextResponse.json({ jsonrpc: "2.0", id: reqId, result: { content: [{ type: "text", text: JSON.stringify(result) }] } })
        : NextResponse.json(result);
    }

    return NextResponse.json(
      isJsonRpc
        ? { jsonrpc: "2.0", id: reqId, error: { code: -32601, message: `Tool not found: ${toolName}` } }
        : { error: `Unknown tool: ${toolName}` },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
