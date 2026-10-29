# PayPilot — 3-Minute Live Hackathon Demo Script

> **Target Audience:** PayPal Hackathon Judges, Fintech VCs, AI Agent Developers  
> **Total Time:** 3 minutes (180 seconds)  
> **Tagline:** *"Let AI handle the payments. You keep the final say."*  
> **Core Principle:** *"The LLM PROPOSES. Deterministic code DECIDES."*

---

## Pre-Flight Checklist (T-30s)
1. Open browser to `http://localhost:3000/console` (or click `90s Demo`).
2. Ensure audio / speaker is connected if demonstrating voice input.
3. Have developer console open or inspect network to verify zero console errors.

---

## 0:00 – 0:25 | The Hook & The Problem
**Visual:** Screen is on the PayPilot Console. Point to the top metric: *"Monthly Spend: $351 / $3,500"* and the private ledger interface.

**Spoken:**
> *"Judges, AI agents can now browse flights, research vendors, and write code. But nobody trusts an AI agent with their credit card or PayPal credentials. Why? Because LLMs hallucinate, prompt injections happen, and unrestricted API keys mean drained bank accounts.
>
> PayPilot solves this with a simple, foundational architecture: **The LLM PROPOSES. Deterministic code DECIDES.** The AI agent never has direct authority to move money. Every payment passes through a pure TypeScript spending leash before touching PayPal Sandbox."*

---

## 0:25 – 1:15 | The Canonical 90-Second Demo Scenario
**Visual Action:** Click the preset button: **"⭐ Full Demo Scenario (90s)"** or click **"Run 90s Hackathon Demo"**.
Prompt appears in the box:
> *"Pay Riya $200 for the logo work, renew my domain if it's under $15, and send $900 to a new vendor called QuickInvoice Ltd."*

**Visual Action:** Click **"Plan"** (or watch the 1-click execution).

**Spoken:**
> *"Watch how PayPilot processes this single prompt into three completely different autonomous outcomes in real time:
>
> **1. Riya Sharma ($200):**
> *Riya is on our pre-approved contractor whitelist with an authorized cap of $250. The guardrail immediately returns **ALLOW**. PayPilot calls the PayPal Payouts v1 API with a deterministic SHA-256 idempotency key, settles the transfer, and drops a green PAID rubber stamp on the audit tape.*
>
> **2. Domain Registrar Co ($18):**
> *The user specified 'renew if it's under $15', but the vendor quoted $18. The guardrail immediately trips on the explicit condition limit $\rightarrow$ **BLOCK**. Zero dollars move. The agent logs an explanation without human intervention.*
>
> **3. QuickInvoice Ltd ($900):**
> *QuickInvoice is an unknown entity, requesting $900—over 8 times our baseline—with high-pressure wording. Our Risk Engine scores this at **82/100 (HIGH RISK)** and holds the funds."*

---

## 1:15 – 1:45 | The Human Approval Gate
**Visual Action:** Point to the amber Approval Card on the screen. Highlight the microcopy:
*"Held for your OK: QuickInvoice Ltd is a new vendor with an 8x amount outlier and urgency cues."*

**Visual Action:** Hover over **"Edit Amount"** to show real-time guardrail recalculation, then click the red button: **"Reject Payment"**.

**Spoken:**
> *"Look at the microcopy. It doesn't say 'Error 403'. It writes like a calm private banker: 'Held for your review: this is a new vendor with an unusually large transfer.'
>
> I can edit the amount right here, or I can click **Reject Payment**. Watch what happens when I click Reject...*
> *(Click Reject)*
> *The card updates to REJECTED with a red stamp, and our dashboard instantly updates: **PayPilot stopped $1,240 this month.**"*

---

## 1:45 – 2:15 | Signature Live Audit Receipt Roll
**Visual Action:** Scroll down the right-hand column: the physical receipt roll with perforated edges and monospaced font.
Point to the rubber stamps: `PAID`, `BLOCKED`, `HELD`, `VERIFIED`.
Click **"Download CSV"**.

**Spoken:**
> *"This is PayPilot's signature element: the Live Audit Tape. It's styled like a physical private ledger roll. Notice the rubber stamps—they animate in with a slight rotational ink-settle effect.
>
> Every single entry records the timestamp, the plain-English reasoning, and the cryptographic SHA-256 idempotency key passed to the `PayPal-Request-Id` header. With one click on 'CSV', you have a full RFC-4180 audit trail for your accountant or compliance team."*

---

## 2:15 – 2:40 | Rules & The "What Would Be Blocked?" Simulator
**Visual Action:** Click top navigation **"Rules & Policy"**. Show the limits:
- Monthly Budget: $3,500
- Per-Payment Hard Cap: $1,000
- Approval Threshold: $150
- Blocked Categories (Entertainment, etc.)
- Approved Payees roster with Riya Sharma, AWS, GitHub.

**Visual Action:** Scroll to the right rail: the **Live Policy Simulator**.
Type `$1,200` into the simulator amount. Verdict instantly changes to **BLOCKED (Per-Payment Hard Cap)**.

**Spoken:**
> *"Under Rules & Policy, developers or CFOs configure their spending leashes. And on the right is our interactive simulator: test any hypothetical transfer in real time before deploying an agent into the wild."*

---

## 2:40 – 3:00 | Dispute Assistant & Closing Pitch
**Visual Action:** Click **"Activity Ledger"**. Click **"Dispute"** on any past transaction. Show the generated formal claim narrative.

**Spoken:**
> *"If an authorized vendor ever fails to deliver, PayPilot compiles the entire cryptographic audit trail into a formal PayPal Resolution Center claim with one click.
>
> PayPilot makes autonomous agent commerce safe, transparent, and auditable. AI agents are here—PayPilot ensures you always keep the final say. Thank you."*
