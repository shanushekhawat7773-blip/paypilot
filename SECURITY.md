# Security Policy & Defensive Model

> **Core Principle:** *The LLM PROPOSES. Deterministic TypeScript code DECIDES. The LLM never has authority to move money.*

---

## 1. Security Architecture & Threat Boundaries

PayPilot is architected specifically to prevent autonomous AI agents from causing unauthorized financial loss, whether through hallucination, recursive task loops, or prompt injection exploits.

### A. Strict Authority Separation
- The Large Language Model (LLM) is treated strictly as an untrusted parser that generates structured JSON candidates.
- The LLM has **zero direct access** to PayPal API credentials, client secrets, or payment execution endpoints.
- All monetary operations pass through a pure TypeScript guardrails engine that evaluates conditions with deterministic math prior to executing any payment.

### B. SHA-256 Idempotency Keys
- Every single payment operation carries a unique, deterministic idempotency key computed via:
  ```ts
  sha256(`${stepId}:${payee}:${amount}:${currency}`)
  ```
- This key is passed directly in PayPal's `PayPal-Request-Id` HTTP header.
- In the event of network timeouts, client retries, or server restarts, PayPal's gateway recognizes the key and prevents duplicate debits.

### C. Webhook Cryptographic Verification
- Inbound PayPal webhooks are validated using PayPal's cryptographic verification API (`/v1/notifications/verify-webhook-signature`).
- Signatures, algorithms, certificate URLs, and transmission timestamps are checked before updating internal transaction state.

### D. Zero-Secret Demo Guarantee
- PayPilot runs out-of-the-box in **Demo Mode** with realistic seeded data and authentic mock sandbox responses without requiring any live PayPal credentials or API keys.
- Production and Sandbox credentials are read strictly from environment variables (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`) and are never exposed to client-side bundles.

---

## 2. Defensive Checklist for Judges & Auditors

| Security Control | Implementation Location | Verified In CI |
| :--- | :--- | :---: |
| Deterministic Spending Caps | `src/lib/guardrails/engine.ts` | Yes |
| Whitelist Enforcement | `src/lib/guardrails/engine.ts` | Yes |
| Non-positive Amount Rejection | `src/lib/guardrails/engine.ts` | Yes |
| Duplicate Payment Window | `src/lib/guardrails/engine.ts` | Yes |
| Daily Velocity Limiting | `src/lib/guardrails/engine.ts` | Yes |
| Prompt Pressure Language Detection | `src/lib/risk/scorer.ts` | Yes |
| Zod Plan Schema Validation | `src/lib/planner/parser.ts` | Yes |
| Webhook Signature Verification | `src/lib/paypal/client.ts` | Yes |
| RFC-4180 Escaped Audit Export | `src/lib/audit/tape.ts` | Yes |

---

## 3. Reporting a Vulnerability

If you discover a security vulnerability in PayPilot, please disclose it responsibly:

1. **Email:** Send details to `security@paypilot.dev` (or open a confidential security advisory on GitHub).
2. **Details:** Include a description of the issue, steps to reproduce, and any relevant logs or prompts.
3. **Response Time:** We will acknowledge receipt within 24 hours and provide a remediation timeline.
4. **Public Disclosure:** Please do not publicly disclose the vulnerability until a fix has been verified and released.
