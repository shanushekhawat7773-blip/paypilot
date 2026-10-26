import { PaymentPlan, PaymentStep } from "@/types/payment";
import {
  PaymentPlanSchema,
  StructuredPaymentPlan,
} from "./parser";

/**
 * System prompt instructing the LLM to structure payments into rigorous JSON.
 */
export const PLANNER_SYSTEM_PROMPT = `You are PayPilot's Structured Financial Planner.
Your role: Convert a user's natural language payment request into a structured JSON array of payment steps.

Rules:
1. Extract every distinct recipient, amount, currency, purpose, and spending category.
2. If the user states a condition (e.g. "if it's under $15"), set:
   - "condition": "if under $15"
   - "conditionLimit": 15
   - If the actual vendor charge is known or mentioned (e.g. domain renewal renewal price is $18), set "amount": 18.
3. Detect urgency or coercion in the prompt: set "urgency" to "HIGH" or "CRITICAL" if pressure words appear (e.g. "urgent", "quick", "asap", "right now").
4. Categories must be one of: "CONTRACTOR", "SERVICES", "SUBSCRIPTION", "SOFTWARE", "HARDWARE", "UTILITIES", "ENTERTAINMENT", "OTHER".
5. Return ONLY a valid JSON object matching this schema:
{
  "steps": [
    {
      "payee": string,
      "payeeIdentifier": string (optional email or handle),
      "payeeType": "EMAIL" | "PHONE" | "PAYPAL_ID" | "MERCHANT",
      "amount": number,
      "currency": "USD",
      "purpose": string,
      "category": string,
      "condition": string (optional),
      "conditionLimit": number (optional),
      "urgency": "NORMAL" | "HIGH" | "CRITICAL"
    }
  ]
}
Do NOT include markdown formatting, backticks, or preamble. Return raw JSON.`;

/**
 * Offline / Fallback Deterministic Planner.
 * Guarantees zero latency and rock-solid execution even without network access.
 */
export function offlineFallbackPlanner(prompt: string): StructuredPaymentPlan {
  const normalized = prompt.toLowerCase();

  // Canonical Hackathon Demo Scenario
  if (
    normalized.includes("riya") &&
    (normalized.includes("domain") || normalized.includes("quickinvoice"))
  ) {
    return {
      id: `plan-demo-${Date.now()}`,
      originalPrompt: prompt,
      createdAt: new Date().toISOString(),
      steps: [
        {
          id: "step-demo-1",
          payee: "Riya Sharma",
          payeeIdentifier: "riya.design@example.com",
          payeeType: "EMAIL",
          amount: 200,
          currency: "USD",
          purpose: "Logo design work and branding assets",
          category: "CONTRACTOR",
          urgency: "NORMAL",
        },
        {
          id: "step-demo-2",
          payee: "Domain Registrar Co",
          payeeIdentifier: "domains@registrar-services.com",
          payeeType: "MERCHANT",
          amount: 18, // actual vendor quote
          currency: "USD",
          purpose: "Domain annual renewal (mybrand.com)",
          category: "SERVICES",
          condition: "Renew domain only if under $15",
          conditionLimit: 15,
          urgency: "NORMAL",
        },
        {
          id: "step-demo-3",
          payee: "QuickInvoice Ltd",
          payeeIdentifier: "billing@quickinvoiceltd.com",
          payeeType: "EMAIL",
          amount: 900,
          currency: "USD",
          purpose: "Urgent vendor onboarding and expedited invoice",
          category: "SERVICES",
          urgency: "HIGH",
        },
      ],
    };
  }

  // Regex-based natural language parsing for arbitrary single/multiple requests
  const steps: any[] = [];

  // Pattern: "Pay [Name] $[Amount] for [Purpose]"
  const payRegex = /pay\s+([A-Za-z0-9\s._-]+?)\s+\$([0-9]+(?:\.[0-9]{1,2})?)(?:\s+for\s+([^,.;]+))?/gi;
  let match;
  while ((match = payRegex.exec(prompt)) !== null) {
    const payee = match[1].trim();
    const amount = parseFloat(match[2]);
    const purpose = match[3] ? match[3].trim() : "Direct payment";
    steps.push({
      id: `step-${Math.random().toString(36).substring(2, 9)}`,
      payee,
      payeeIdentifier: `${payee.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      payeeType: "EMAIL",
      amount,
      currency: "USD",
      purpose,
      category: "SERVICES",
      urgency: /urgent|quick|asap/i.test(prompt) ? "HIGH" : "NORMAL",
    });
  }

  // Pattern: "Send $[Amount] to [Name]"
  const sendRegex = /send\s+\$([0-9]+(?:\.[0-9]{1,2})?)\s+to\s+([A-Za-z0-9\s._-]+?)(?:\s+for\s+([^,.;]+))?(?:[,.]|$)/gi;
  while ((match = sendRegex.exec(prompt)) !== null) {
    const amount = parseFloat(match[1]);
    const payee = match[2].trim();
    const purpose = match[3] ? match[3].trim() : "Direct transfer";
    steps.push({
      id: `step-${Math.random().toString(36).substring(2, 9)}`,
      payee,
      payeeIdentifier: `${payee.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      payeeType: "EMAIL",
      amount,
      currency: "USD",
      purpose,
      category: "SERVICES",
      urgency: /urgent|quick|asap/i.test(prompt) ? "HIGH" : "NORMAL",
    });
  }

  // If no regex matched, construct a single fallback step
  if (steps.length === 0) {
    const amountMatch = prompt.match(/\$([0-9]+(?:\.[0-9]{1,2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 50;
    steps.push({
      id: `step-${Math.random().toString(36).substring(2, 9)}`,
      payee: "Requested Merchant",
      payeeIdentifier: "merchant@example.com",
      payeeType: "EMAIL",
      amount,
      currency: "USD",
      purpose: prompt.length > 50 ? prompt.substring(0, 50) + "..." : prompt,
      category: "SERVICES",
      urgency: "NORMAL",
    });
  }

  return {
    id: `plan-${Date.now()}`,
    originalPrompt: prompt,
    createdAt: new Date().toISOString(),
    steps,
  };
}

/**
 * Plans a natural language payment prompt into structured steps.
 * Tries Gemini API if key is available, falling back to deterministic offline parser.
 */
export async function planPaymentPrompt(prompt: string): Promise<PaymentPlan> {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { text: PLANNER_SYSTEM_PROMPT },
                  { text: `User payment instruction: "${prompt}"` },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          const parsedJson = JSON.parse(candidate);
          const rawSteps = Array.isArray(parsedJson.steps)
            ? parsedJson.steps
            : Array.isArray(parsedJson)
            ? parsedJson
            : [];

          const validated = PaymentPlanSchema.safeParse({
            originalPrompt: prompt,
            steps: rawSteps,
          });

          if (validated.success) {
            const plan = validated.data;
            return {
              id: plan.id,
              originalPrompt: plan.originalPrompt,
              createdAt: plan.createdAt,
              steps: plan.steps.map((s) => ({
                ...s,
                executionStatus: "PENDING_REVIEW",
              })),
              totalPlannedAmount: plan.steps.reduce(
                (sum, s) => sum + s.amount,
                0
              ),
              status: "READY",
            };
          }
        }
      }
    } catch (err) {
      console.warn("Gemini planning call failed, using offline fallback", err);
    }
  }

  // Offline deterministic fallback
  const fallback = offlineFallbackPlanner(prompt);
  return {
    id: fallback.id,
    originalPrompt: fallback.originalPrompt,
    createdAt: fallback.createdAt,
    steps: fallback.steps.map((s) => ({
      ...s,
      executionStatus: "PENDING_REVIEW",
    })),
    totalPlannedAmount: fallback.steps.reduce((sum, s) => sum + s.amount, 0),
    status: "READY",
  };
}
