"use client";

import React, { useState, useEffect } from "react";
import { UserRulesConfig, Payee, GuardrailResult, RiskAssessment } from "@/types/payment";
import { DEFAULT_RULES, INITIAL_APPROVED_PAYEES } from "@/lib/guardrails/defaultRules";
import {
  SlidersIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  LockIcon,
} from "@/components/ui/Icons";

export default function RulesPage() {
  const [rules, setRules] = useState<UserRulesConfig>(DEFAULT_RULES);
  const [payees, setPayees] = useState<Payee[]>(INITIAL_APPROVED_PAYEES);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New payee input form
  const [newPayeeName, setNewPayeeName] = useState("");
  const [newPayeeEmail, setNewPayeeEmail] = useState("");
  const [newPayeeLimit, setNewPayeeLimit] = useState("250");

  // Simulator inputs
  const [simPayee, setSimPayee] = useState("QuickInvoice Ltd");
  const [simAmount, setSimAmount] = useState("900");
  const [simCategory, setSimCategory] = useState("SERVICES");
  const [simConditionLimit, setSimConditionLimit] = useState("");
  const [simResult, setSimResult] = useState<{
    guardrail: GuardrailResult;
    risk: RiskAssessment;
  } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Load existing rules from API
  useEffect(() => {
    fetch("/api/rules")
      .then((res) => res.json())
      .then((data) => {
        if (data.rules) setRules(data.rules);
        if (data.approvedPayees) setPayees(data.approvedPayees);
      })
      .catch((err) => console.warn("Failed to load rules:", err));
  }, []);

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPayee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayeeName.trim() || !newPayeeEmail.trim()) return;

    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addPayee: {
            name: newPayeeName.trim(),
            identifier: newPayeeEmail.trim(),
            type: "EMAIL",
            maxPreApprovedLimit: parseFloat(newPayeeLimit) || 150,
            tags: ["Verified", "Manual"],
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPayees(data.approvedPayees);
        setNewPayeeName("");
        setNewPayeeEmail("");
        setNewPayeeLimit("250");
      }
    } catch (err) {
      console.error("Add payee error:", err);
    }
  };

  const handleTogglePayee = async (id: string) => {
    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ togglePayeeId: id }),
      });

      if (res.ok) {
        const data = await res.json();
        setPayees(data.approvedPayees);
      }
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  // Run live simulation
  const runSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch("/api/agent/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "paypal_evaluate_guardrails",
          arguments: {
            payee: simPayee,
            amount: parseFloat(simAmount) || 0,
            category: simCategory,
            conditionLimit: simConditionLimit ? parseFloat(simConditionLimit) : undefined,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSimResult({
          guardrail: data.guardrail,
          risk: data.risk,
        });
      }
    } catch (err) {
      console.error("Sim error:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Re-run simulation when inputs change
  useEffect(() => {
    const timer = setTimeout(() => {
      runSimulation();
    }, 250);
    return () => clearTimeout(timer);
  }, [simPayee, simAmount, simCategory, simConditionLimit, rules]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="hairline-b pb-4">
        <div className="flex items-center space-x-2">
          <SlidersIcon size={20} className="text-navy" />
          <h1 className="font-serif text-2xl font-bold text-ink">
            Guardrails & Spending Policy
          </h1>
        </div>
        <p className="mt-1 text-sm text-ink-muted font-sans">
          Deterministic bounds governing autonomous agent authority. The LLM proposes; these rules decide.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Spending Rules Policy (7 Cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Rules Form */}
          <form
            onSubmit={handleSaveRules}
            className="bg-white rounded hairline-border p-6 shadow-sm space-y-6"
          >
            <div className="flex items-center justify-between hairline-b pb-3">
              <h2 className="font-mono text-xs uppercase font-bold text-ink tracking-wider">
                Autonomous Spending Leash Limits
              </h2>
              {saveSuccess && (
                <span className="text-xs font-mono text-status-allowed flex items-center space-x-1">
                  <CheckCircleIcon size={13} />
                  <span>Policy Enacted</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-ink-muted mb-1">
                  Monthly Budget ($ USD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={rules.monthlyBudget}
                  onChange={(e) =>
                    setRules({ ...rules, monthlyBudget: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full p-2 text-sm font-mono font-bold bg-paper-100 hairline-border rounded text-ink focus:outline-none focus:ring-1 focus:ring-navy"
                />
                <span className="text-[11px] text-ink-subtle">
                  Exceeding transfers are held for manual OK
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-ink-muted mb-1">
                  Per-Payment Hard Cap ($ USD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={rules.perPaymentCap}
                  onChange={(e) =>
                    setRules({ ...rules, perPaymentCap: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full p-2 text-sm font-mono font-bold bg-paper-100 hairline-border rounded text-ink focus:outline-none focus:ring-1 focus:ring-navy"
                />
                <span className="text-[11px] text-ink-subtle">
                  Hard ceiling; any amount above is strictly BLOCKED
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-ink-muted mb-1">
                  Approval Threshold ($ USD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={rules.askAboveThreshold}
                  onChange={(e) =>
                    setRules({
                      ...rules,
                      askAboveThreshold: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2 text-sm font-mono font-bold bg-paper-100 hairline-border rounded text-ink focus:outline-none focus:ring-1 focus:ring-navy"
                />
                <span className="text-[11px] text-ink-subtle">
                  Payments above this require your manual OK
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-ink-muted mb-1">
                  Daily Velocity Limit
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={rules.dailyVelocityLimit}
                  onChange={(e) =>
                    setRules({
                      ...rules,
                      dailyVelocityLimit: parseInt(e.target.value) || 5,
                    })
                  }
                  className="w-full p-2 text-sm font-mono font-bold bg-paper-100 hairline-border rounded text-ink focus:outline-none focus:ring-1 focus:ring-navy"
                />
                <span className="text-[11px] text-ink-subtle">
                  Max transfers permitted in any rolling 24h window
                </span>
              </div>
            </div>

            {/* Blocked Categories Checklist */}
            <div className="pt-2 hairline-t">
              <label className="block text-xs font-mono uppercase text-ink-muted mb-2">
                Blocked Merchant Categories
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                {[
                  "ENTERTAINMENT",
                  "HARDWARE",
                  "SOFTWARE",
                  "CONTRACTOR",
                  "SERVICES",
                  "SUBSCRIPTION",
                  "UTILITIES",
                  "OTHER",
                ].map((cat) => {
                  const isBlocked = rules.blockedCategories.includes(cat as any);
                  return (
                    <label
                      key={cat}
                      className={`flex items-center space-x-2 p-2 rounded hairline-border cursor-pointer transition-colors ${
                        isBlocked
                          ? "bg-red-50 text-status-blocked border-red-200"
                          : "bg-paper-100 text-ink hover:bg-paper-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isBlocked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRules({
                              ...rules,
                              blockedCategories: [...rules.blockedCategories, cat as any],
                            });
                          } else {
                            setRules({
                              ...rules,
                              blockedCategories: rules.blockedCategories.filter(
                                (c) => c !== cat
                              ),
                            });
                          }
                        }}
                        className="rounded text-navy focus:ring-navy"
                      />
                      <span>{cat}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-navy text-white text-xs font-semibold rounded hover:bg-navy-hover transition-colors shadow-sm"
              >
                {isSaving ? "Enacting..." : "Save Policy"}
              </button>
            </div>
          </form>

          {/* Approved Payees Roster */}
          <div className="bg-white rounded hairline-border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between hairline-b pb-3">
              <div>
                <h2 className="font-mono text-xs uppercase font-bold text-ink tracking-wider">
                  Approved Payees Whitelist
                </h2>
                <p className="text-xs text-ink-muted">
                  Known beneficiaries with pre-authorized spending bounds.
                </p>
              </div>
              <span className="font-mono text-xs text-ink px-2 py-0.5 bg-paper-200 rounded">
                {payees.filter((p) => p.isApproved).length} Active
              </span>
            </div>

            <div className="divide-y divide-ink-hairline/60">
              {payees.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-ink">{p.name}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                          p.isApproved
                            ? "bg-green-50 text-status-allowed"
                            : "bg-red-50 text-status-blocked"
                        }`}
                      >
                        {p.isApproved ? "Approved" : "Suspended"}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-ink-muted">
                      {p.identifier} • Pre-approved up to $
                      {p.maxPreApprovedLimit ?? rules.askAboveThreshold}
                    </div>
                  </div>

                  <button
                    onClick={() => handleTogglePayee(p.id)}
                    className="text-xs font-mono px-2.5 py-1 rounded hairline-border hover:bg-paper-200 text-ink-muted hover:text-ink transition-colors"
                  >
                    {p.isApproved ? "Suspend" : "Re-activate"}
                  </button>
                </div>
              ))}
            </div>

            {/* Add Payee Form */}
            <form onSubmit={handleAddPayee} className="pt-3 hairline-t space-y-3">
              <span className="text-xs font-mono font-semibold uppercase text-ink block">
                Add New Approved Payee
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Entity / Name"
                  value={newPayeeName}
                  onChange={(e) => setNewPayeeName(e.target.value)}
                  className="p-2 text-xs bg-paper-100 hairline-border rounded text-ink focus:outline-none focus:ring-1 focus:ring-navy"
                />
                <input
                  type="email"
                  placeholder="PayPal Email Address"
                  value={newPayeeEmail}
                  onChange={(e) => setNewPayeeEmail(e.target.value)}
                  className="p-2 text-xs bg-paper-100 hairline-border rounded text-ink focus:outline-none focus:ring-1 focus:ring-navy"
                />
                <input
                  type="number"
                  placeholder="Pre-approved limit ($)"
                  value={newPayeeLimit}
                  onChange={(e) => setNewPayeeLimit(e.target.value)}
                  className="p-2 text-xs bg-paper-100 hairline-border rounded text-ink focus:outline-none focus:ring-1 focus:ring-navy"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-paper-200 text-ink hover:bg-paper-300 text-xs font-mono font-medium rounded hairline-border transition-colors"
              >
                + Add to Whitelist
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Live "What Would Be Blocked" Simulator (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-paper-50 rounded hairline-border p-5 shadow-sm sticky top-20">
            <div className="flex items-center space-x-2 pb-3 hairline-b mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-navy" />
              <h3 className="font-mono text-xs uppercase font-bold tracking-wider text-ink">
                Live Policy Simulator
              </h3>
            </div>
            <p className="text-xs text-ink-muted mb-4 font-sans leading-relaxed">
              Test how any hypothetical payment would be treated by PayPilot&apos;s
              deterministic guardrails before deploying money.
            </p>

            {/* Quick Test Presets */}
            <div className="mb-4">
              <span className="text-[10px] font-mono uppercase text-ink-muted block mb-1">
                Quick Test Scenarios:
              </span>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setSimPayee("QuickInvoice Ltd");
                    setSimAmount("900");
                    setSimCategory("SERVICES");
                    setSimConditionLimit("");
                  }}
                  className="text-[10px] font-mono px-2 py-0.5 bg-paper-200 rounded hover:bg-paper-300 text-ink"
                >
                  QuickInvoice $900
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSimPayee("Riya Sharma");
                    setSimAmount("200");
                    setSimCategory("CONTRACTOR");
                    setSimConditionLimit("");
                  }}
                  className="text-[10px] font-mono px-2 py-0.5 bg-paper-200 rounded hover:bg-paper-300 text-ink"
                >
                  Riya $200
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSimPayee("Domain Registrar Co");
                    setSimAmount("18");
                    setSimCategory("SERVICES");
                    setSimConditionLimit("15");
                  }}
                  className="text-[10px] font-mono px-2 py-0.5 bg-paper-200 rounded hover:bg-paper-300 text-ink"
                >
                  Domain $18 (&lt; $15)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSimPayee("Casino Direct");
                    setSimAmount("50");
                    setSimCategory("ENTERTAINMENT");
                    setSimConditionLimit("");
                  }}
                  className="text-[10px] font-mono px-2 py-0.5 bg-paper-200 rounded hover:bg-paper-300 text-ink"
                >
                  Blocked Category
                </button>
              </div>
            </div>

            {/* Simulation Input Fields */}
            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[10px] uppercase text-ink-muted block mb-0.5">
                  Hypothetical Payee
                </label>
                <input
                  type="text"
                  value={simPayee}
                  onChange={(e) => setSimPayee(e.target.value)}
                  className="w-full p-2 bg-white hairline-border rounded text-ink focus:outline-none focus:ring-1 focus:ring-navy"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase text-ink-muted block mb-0.5">
                    Amount ($ USD)
                  </label>
                  <input
                    type="number"
                    value={simAmount}
                    onChange={(e) => setSimAmount(e.target.value)}
                    className="w-full p-2 bg-white hairline-border rounded text-ink font-bold focus:outline-none focus:ring-1 focus:ring-navy"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-ink-muted block mb-0.5">
                    Category
                  </label>
                  <select
                    value={simCategory}
                    onChange={(e) => setSimCategory(e.target.value)}
                    className="w-full p-2 bg-white hairline-border rounded text-ink focus:outline-none focus:ring-1 focus:ring-navy"
                  >
                    <option value="CONTRACTOR">CONTRACTOR</option>
                    <option value="SERVICES">SERVICES</option>
                    <option value="SOFTWARE">SOFTWARE</option>
                    <option value="HARDWARE">HARDWARE</option>
                    <option value="ENTERTAINMENT">ENTERTAINMENT</option>
                    <option value="SUBSCRIPTION">SUBSCRIPTION</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase text-ink-muted block mb-0.5">
                  Condition Ceiling ($ optional)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 15 for 'if under $15'"
                  value={simConditionLimit}
                  onChange={(e) => setSimConditionLimit(e.target.value)}
                  className="w-full p-2 bg-white hairline-border rounded text-ink focus:outline-none focus:ring-1 focus:ring-navy"
                />
              </div>
            </div>

            {/* Simulation Verdict */}
            <div className="mt-5 pt-4 hairline-t">
              <span className="text-[10px] font-mono uppercase text-ink-muted block mb-2">
                Deterministic Engine Outcome:
              </span>

              {simResult ? (
                <div
                  className={`p-3.5 rounded hairline-border space-y-2 ${
                    simResult.guardrail.decision === "BLOCK"
                      ? "bg-status-blockedBg border-red-300"
                      : simResult.guardrail.decision === "HOLD_FOR_APPROVAL"
                      ? "bg-status-heldBg border-amber-300"
                      : "bg-status-allowedBg border-green-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`stamp font-bold ${
                        simResult.guardrail.decision === "BLOCK"
                          ? "stamp-blocked"
                          : simResult.guardrail.decision === "HOLD_FOR_APPROVAL"
                          ? "stamp-held"
                          : "stamp-paid"
                      }`}
                    >
                      {simResult.guardrail.decision}
                    </span>

                    <span className="text-[10px] font-mono font-bold text-ink">
                      Risk: {simResult.risk.overallScore}/100 ({simResult.risk.level})
                    </span>
                  </div>

                  <div className="text-xs text-ink font-sans leading-relaxed">
                    <span className="font-semibold font-mono text-[11px] block">
                      Triggered: {simResult.guardrail.triggeredRule}
                    </span>
                    <p className="mt-0.5 text-ink-muted">
                      {simResult.guardrail.reasoning}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-xs font-mono text-ink-subtle italic">
                  Calculating verdict...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
