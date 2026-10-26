import { z } from "zod";

export const PaymentStepSchema = z.object({
  id: z.string().default(() => `step-${Math.random().toString(36).substring(2, 9)}`),
  payee: z.string().min(1, "Payee name or handle is required"),
  payeeIdentifier: z.string().default(""),
  payeeType: z
    .enum(["EMAIL", "PHONE", "PAYPAL_ID", "MERCHANT"])
    .default("EMAIL"),
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .max(1000000, "Amount exceeds sanity cap"),
  currency: z
    .string()
    .length(3, "Currency must be a 3-letter ISO code")
    .toUpperCase()
    .default("USD"),
  purpose: z.string().min(1, "Payment purpose must be specified"),
  category: z
    .enum([
      "CONTRACTOR",
      "SERVICES",
      "SUBSCRIPTION",
      "SOFTWARE",
      "HARDWARE",
      "UTILITIES",
      "ENTERTAINMENT",
      "OTHER",
    ])
    .default("SERVICES"),
  condition: z.string().optional(),
  conditionLimit: z.number().positive().optional(),
  urgency: z.enum(["NORMAL", "HIGH", "CRITICAL"]).default("NORMAL"),
});

export const PaymentPlanSchema = z.object({
  id: z.string().default(() => `plan-${Math.random().toString(36).substring(2, 9)}`),
  originalPrompt: z.string().min(1),
  createdAt: z.string().default(() => new Date().toISOString()),
  steps: z
    .array(PaymentStepSchema)
    .min(1, "At least one payment step must be structured"),
});

export type StructuredPaymentStep = z.infer<typeof PaymentStepSchema>;
export type StructuredPaymentPlan = z.infer<typeof PaymentPlanSchema>;
