# PayPilot — 1-Page Pitch Deck Slide Outline

```
┌────────────────────────────────────────────────────────────────────────┐
│ SLIDE 1: COVER                                                        │
│ PayPilot: The Autonomous Spending Leash for AI Agents                  │
│ Tagline: "Let AI handle the payments. You keep the final say."         │
│ Subtext: Built on PayPal Sandbox • PayPal AI Hackathon 2026            │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ SLIDE 2: THE PROBLEM                                                   │
│ AI agents can now browse, negotiate, and code.                        │
│ BUT NOBODY TRUSTS THEM WITH MONEY.                                     │
│ • Prompt injections trick agents into transferring money to scammers. │
│ • Hallucinations and recursive loops can drain thousands in minutes.   │
│ • Zero auditability: CFOs cannot decipher opaque API key logs.         │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ SLIDE 3: THE SOLUTION                                                  │
│ PayPilot: A Deterministic Supervisory Layer for Agent Commerce.        │
│ • Plain language task input (text + Web Speech voice).                 │
│ • Structured JSON planning validated strictly by Zod.                  │
│ • Pure TypeScript guardrails (budgets, whitelists, velocity, caps).    │
│ • Real-time Risk Scoring (0–100) with plain-English human explanation. │
│ • Append-only Live Audit Receipt Roll with physical ink stamps.        │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ SLIDE 4: THE ARCHITECTURAL MOAT                                        │
│ "THE LLM PROPOSES. DETERMINISTIC CODE DECIDES."                        │
│ • The LLM NEVER has direct authority to move money.                    │
│ • Every payment passes through a rules engine verified by 27 tests.    │
│ • Even a 100% compromised LLM cannot bypass hardcoded TypeScript caps. │
│ • SHA-256 Idempotency keys on every transaction prevent double debits.│
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ SLIDE 5: LIVE 90-SECOND DEMO                                           │
│ Task: "Pay Riya $200 for logo, renew domain if <$15, send $900 to      │
│        QuickInvoice Ltd."                                              │
│ [1] Riya ($200)        ──> ALLOW  ──> Paid via PayPal Payouts v1       │
│ [2] Domain ($18)       ──> BLOCK  ──> Over $15 condition, $0 moved    │
│ [3] QuickInvoice ($900)──> HOLD   ──> Risk 82/100, user hits Reject   │
│ Result: "PayPilot stopped $1,240 this month" displayed on live meter.  │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ SLIDE 6: PAYPAL NATIVE INTEGRATION                                     │
│ • Orders v2 API: Purchases, SaaS subscriptions, and digital checkouts. │
│ • Payouts v1 API: Direct contractor disbursements across 180+ countries│
│ • Webhook HMAC Verification: Cryptographic protection on status updates│
│ • PayPal Resolution Center Packager: 1-click dispute narrative builder│
│ • PayPal Agent Toolkit / MCP: Fully compliant agent tool endpoints.    │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ SLIDE 7: BUSINESS MODEL & TRACTION                                     │
│ 1. Developer SaaS: $29/mo (3 agents) to $299/mo (Enterprise compliance)│
│ 2. Payment Volume Take-Rate: 0.50% fee on agent-managed disbursements. │
│ 3. Market Size: $48B developer APIs & digital contractor spend.        │
│ Moat: Proprietary agent risk scoring + tamper-evident audit journal.   │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ SLIDE 8: THE ASK & VISION                                              │
│ The autonomous economy needs a trusted banking layer.                  │
│ PayPilot makes PayPal the default rails for autonomous AI agents.      │
│ Contact: team@paypilot.dev • Live Sandbox Demo Ready                   │
└────────────────────────────────────────────────────────────────────────┘
```
