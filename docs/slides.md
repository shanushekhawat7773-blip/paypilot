# PayPilot — 10-Slide Pitch Deck Presentation Outline

> **Theme:** PayPal AI Hackathon 2026  
> **Tagline:** *"Let AI handle the payments. You keep the final say."*

---

### Slide 1: Title & The Vision
- **Header:** PayPilot — The Autonomous Spending Leash for AI Agents
- **Subtitle:** The missing trust layer between autonomous LLMs and payment rails.
- **Badge:** Built for PayPal Hackathon 2026 • PayPal Sandbox Native
- **Presenter Note:** "AI agents can browse, negotiate, and code. PayPilot gives them a safe wallet."

---

### Slide 2: The Agent Trust Chasm (The Problem)
- **Problem Statement:** Everyone is building AI agents. Nobody trusts them with money.
- **3 Fatal Vulnerabilities of Raw API Keys:**
  1. *Prompt Injection:* Attackers trick agents into wiring money to rogue accounts.
  2. *Hallucinations & Infinite Loops:* An agent stuck in a recursive task can drain thousands in minutes.
  3. *Zero Compliance Auditability:* CFOs cannot decipher raw terminal logs when reviewing monthly spend.

---

### Slide 3: The Foundational Principle (The Moat)
- **Visual:** Split screen diagram.
- **Rule:** **THE LLM PROPOSES. DETERMINISTIC CODE DECIDES.**
- **Architecture:** The LLM never touches payment credentials or wallet APIs.
- Every cent passes through a pure TypeScript guardrails engine verified by unit tests before touching PayPal.

---

### Slide 4: Core Product Capabilities
- **Natural Language Task Input:** Plain text + Web Speech API voice with one-click presets.
- **Structured Planner:** Decomposes user goals into typed JSON steps validated by Zod schemas.
- **Deterministic Guardrails Engine:** Enforces monthly budgets, velocity limits, per-payment caps, duplicate windows, and user conditions.
- **Risk Scorer (0–100):** Evaluates new payees, historical amount deviations, and urgency cues.
- **Signature Audit Tape:** Append-only physical receipt roll with rubber stamps and RFC-4180 CSV export.

---

### Slide 5: The Canonical 90-Second Demo
- **Instruction:** *"Pay Riya $200 for logo, renew domain if under $15, send $900 to QuickInvoice Ltd."*
- **3 Distinct Outcomes in 90 Seconds:**
  - `Riya ($200)` $\rightarrow$ Whitelisted payee, under limit $\rightarrow$ **ALLOW & PAID** via PayPal Payouts v1.
  - `Domain ($18)` $\rightarrow$ Breaches user's $15 condition $\rightarrow$ **BLOCKED** at gateway ($0 moved).
  - `QuickInvoice ($900)` $\rightarrow$ New payee, 8x outlier, urgency markers $\rightarrow$ **HELD** (Risk 82/100). User clicks Reject $\rightarrow$ Dashboard displays "$900 stopped".

---

### Slide 6: PayPal Native Architecture
- **Orders v2 API:** Purchases, SaaS subscriptions, digital services checkout with capture flow.
- **Payouts v1 API:** Instant global disbursements to contractors and freelancers.
- **SHA-256 Idempotency Keys:** Passed via `PayPal-Request-Id` headers to eliminate double debits on network retries.
- **HMAC Webhook Verification:** Verifies inbound webhook events via `/v1/notifications/verify-webhook-signature`.
- **PayPal Agent Toolkit / MCP:** Exposes compliant JSON tools for Claude, Gemini, and LangChain agents.

---

### Slide 7: Design & Microcopy Studio
- **Aesthetic:** "A Modern Private Ledger" — warm paper (`#F5F2EC`), crisp ink (`#111111`), single navy accent (`#0B2A5B`), editorial typography (Newsreader serif + Inter Tight sans + JetBrains Mono).
- **Physical Signature:** Perforated receipt paper roll with rubber stamp marks (`PAID`, `HELD`, `BLOCKED`) that land with ink-settle rotation.
- **Human Microcopy:** Calm explanations ("Held for your OK: 4x your usual payment to someone new") instead of cryptic HTTP codes.

---

### Slide 8: Market Opportunity & TAM
- **B2B Disbursements Market:** $1.3 Trillion worldwide.
- **Developer & SaaS Spend:** $48 Billion in APIs, compute, and contractor bounties.
- **Autonomous Agent Commerce:** Projected $3.2 Billion by 2028 as enterprise agents replace manual procurement.

---

### Slide 9: Business Model & Monetization
- **Developer Tier:** $29/month (up to 3 active agents, $5,000 monthly volume).
- **Enterprise Tier:** $299/month (unlimited agents, multi-sig approvals, SOC2 compliance).
- **Managed Volume Take-Rate:** 0.50% fee on agent-disbursed funds.
- **Fraud Intelligence Feed:** Premium domain spoofing and invoice fraud detection.

---

### Slide 10: The Ask & Call to Action
- **Goal:** Make PayPal the default payment rails for the autonomous agent economy.
- **Live Demo:** Fully operational in PayPal Sandbox with zero setup or API keys required.
- **Try It Now:** Clone, `npm install`, `npm run dev` $\rightarrow$ run demo scenario in under 90 seconds.
