"use client";

import React, { useState, useEffect } from "react";
import { PaymentStep, DisputeDraft } from "@/types/payment";
import {
  ReceiptIcon,
  DownloadIcon,
  ShieldCheckIcon,
  ExternalLinkIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  LockIcon,
} from "@/components/ui/Icons";

export default function ActivityPage() {
  const [payments, setPayments] = useState<PaymentStep[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentStep | null>(null);

  // Dispute state
  const [disputingPayment, setDisputingPayment] = useState<PaymentStep | null>(null);
  const [disputeCategory, setDisputeCategory] = useState<
    "UNAUTHORIZED" | "INCORRECT_AMOUNT" | "ITEM_NOT_RECEIVED" | "DEFECTIVE_SERVICE"
  >("UNAUTHORIZED");
  const [disputeNotes, setDisputeNotes] = useState("");
  const [disputeDraft, setDisputeDraft] = useState<DisputeDraft | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/state")
      .then((res) => res.json())
      .then((data) => {
        if (data.historicalPayments) {
          setPayments(data.historicalPayments);
        }
      })
      .catch((err) => console.warn("Failed to load activity:", err));
  }, []);

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.payee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.idempotencyKey && p.idempotencyKey.includes(searchQuery)) ||
      p.amount.toString().includes(searchQuery);

    if (!matchesSearch) return false;
    if (statusFilter === "ALL") return true;
    return p.executionStatus === statusFilter;
  });

  const handleGenerateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputingPayment) return;

    setIsDrafting(true);
    try {
      const res = await fetch("/api/dispute/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: disputingPayment.id,
          reasonCategory: disputeCategory,
          additionalNotes: disputeNotes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDisputeDraft(data.draft);
      }
    } catch (err) {
      console.error("Dispute error:", err);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleCopyNarrative = () => {
    if (disputeDraft) {
      navigator.clipboard.writeText(disputeDraft.narrative);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState<string | null>(null);

  const handleSimulateWebhook = async () => {
    setIsSimulatingWebhook(true);
    try {
      const res = await fetch("/api/paypal/webhook/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "PAYMENT.CAPTURE.COMPLETED",
          amount: 200.0,
          payee: "Riya Sharma",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setWebhookMessage(`✓ Webhook verified (${data.transmissionId.substring(0, 12)}...) and stamped on audit tape.`);
        setTimeout(() => setWebhookMessage(null), 4000);
      }
    } catch (err) {
      console.error("Webhook error:", err);
    } finally {
      setIsSimulatingWebhook(false);
    }
  };

  return (
    <div className="space-y-6">
      {webhookMessage && (
        <div className="bg-green-50 hairline-border border-green-200 p-2.5 rounded text-xs font-mono text-status-allowed flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <ShieldCheckIcon size={14} />
            <span>{webhookMessage}</span>
          </div>
          <button onClick={() => setWebhookMessage(null)} className="font-bold">×</button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 hairline-b pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <ReceiptIcon size={20} className="text-navy" />
            <h1 className="font-serif text-2xl font-bold text-ink">
              Activity Ledger & Receipts
            </h1>
          </div>
          <p className="mt-1 text-sm text-ink-muted font-sans">
            Searchable history of settled agent transactions with cryptographic proof of authorization.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={handleSimulateWebhook}
            disabled={isSimulatingWebhook}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-paper-100 hover:bg-paper-300 text-ink text-xs font-mono font-medium rounded hairline-border transition-colors"
            title="Simulate inbound PayPal webhook with signature verification"
          >
            <ShieldCheckIcon size={14} className="text-navy" />
            <span>{isSimulatingWebhook ? "Verifying..." : "Simulate PayPal Webhook"}</span>
          </button>

          <a
            href="/api/audit?export=csv"
            download
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-navy hover:bg-navy-hover text-white text-xs font-mono font-medium rounded transition-colors shadow-sm"
          >
            <DownloadIcon size={14} />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded hairline-border p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search payee, memo, or idempotency hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 bg-paper-100 hairline-border rounded text-ink focus:outline-none focus:ring-1 focus:ring-navy"
          />
        </div>

        <div className="flex items-center space-x-1 w-full sm:w-auto justify-end">
          {["ALL", "PAID", "BLOCKED", "REJECTED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === tab
                  ? "bg-ink text-paper-100 font-semibold"
                  : "text-ink-muted hover:text-ink hover:bg-paper-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded hairline-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead className="bg-paper-100 font-mono text-[11px] uppercase tracking-wider text-ink-muted hairline-b">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Beneficiary</th>
                <th className="py-3 px-4">Purpose</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status Stamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-hairline/60">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-ink-muted italic font-mono">
                    No transactions match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const dateStr = p.executedAt
                    ? new Date(p.executedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Recent";

                  return (
                    <tr key={p.id} className="hover:bg-paper-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-ink-muted whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-ink">{p.payee}</div>
                        <div className="text-[11px] font-mono text-ink-muted">
                          {p.payeeIdentifier || "N/A"}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-ink max-w-xs truncate" title={p.purpose}>
                        {p.purpose}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 bg-paper-200 rounded text-ink-muted">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-ink whitespace-nowrap tabular-nums">
                        ${p.amount.toFixed(2)} {p.currency}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`stamp ${
                            p.executionStatus === "PAID"
                              ? "stamp-paid"
                              : p.executionStatus === "BLOCKED" || p.executionStatus === "REJECTED"
                              ? "stamp-blocked"
                              : "stamp-held"
                          }`}
                        >
                          {p.executionStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap font-mono text-[11px]">
                        <button
                          onClick={() => setSelectedReceipt(p)}
                          className="text-navy hover:underline font-semibold"
                        >
                          Receipt
                        </button>
                        {p.executionStatus === "PAID" && (
                          <button
                            onClick={() => {
                              setDisputingPayment(p);
                              setDisputeDraft(null);
                            }}
                            className="text-status-blocked hover:underline font-medium ml-2"
                          >
                            Dispute
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Full Cryptographic Receipt */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
          <div className="bg-paper-100 rounded-sm hairline-border max-w-md w-full p-6 shadow-xl relative animate-ink-settle">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute right-4 top-4 text-ink-muted hover:text-ink font-mono text-base"
            >
              ×
            </button>

            <div className="text-center pb-3 hairline-b mb-4">
              <div className="font-mono text-[11px] uppercase tracking-widest text-ink font-bold">
                PAYPILOT OFFICIAL RECEIPT
              </div>
              <div className="font-serif italic text-sm text-ink-muted">
                Settled via PayPal Sandbox REST API
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-ink-muted">Beneficiary:</span>
                <span className="font-bold text-ink">{selectedReceipt.payee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Destination:</span>
                <span className="text-ink">{selectedReceipt.payeeIdentifier || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Amount:</span>
                <span className="font-bold text-base text-ink tabular-nums">
                  ${selectedReceipt.amount.toFixed(2)} {selectedReceipt.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Date Executed:</span>
                <span className="text-ink">
                  {selectedReceipt.executedAt || new Date().toISOString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">PayPal Batch / Order Ref:</span>
                <span className="text-ink truncate max-w-[200px]">
                  {selectedReceipt.paypalPayoutBatchId || selectedReceipt.paypalOrderId || "SANDBOX-MOCK-ID"}
                </span>
              </div>
              <div className="pt-2 hairline-t">
                <span className="text-[10px] text-ink-muted block mb-1">
                  SHA-256 Idempotency Key:
                </span>
                <span className="text-[10px] bg-paper-200 p-1.5 rounded block break-all text-ink">
                  {selectedReceipt.idempotencyKey || "idem-sha256-verified"}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-3 hairline-t flex justify-end">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-1.5 bg-ink text-paper-100 rounded text-xs font-mono font-medium hover:bg-navy transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Undo / Dispute Resolution Assistant */}
      {disputingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded hairline-border max-w-xl w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setDisputingPayment(null);
                setDisputeDraft(null);
              }}
              className="absolute right-4 top-4 text-ink-muted hover:text-ink font-mono text-base"
            >
              ×
            </button>

            <div className="flex items-center space-x-2 pb-3 hairline-b mb-4">
              <AlertTriangleIcon size={18} className="text-status-blocked" />
              <h3 className="font-serif text-lg font-bold text-ink">
                PayPal Dispute Claim Assistant
              </h3>
            </div>

            <p className="text-xs text-ink-muted mb-4 font-sans leading-relaxed">
              If a payment was released due to fraudulent invoice tampering, deliverable failure, or
              misrepresentation, PayPilot packages the full cryptographic audit logs into a formal
              claim for the PayPal Resolution Center.
            </p>

            {!disputeDraft ? (
              <form onSubmit={handleGenerateDispute} className="space-y-4 font-sans text-xs">
                <div className="bg-paper-100 p-3 rounded hairline-border space-y-1">
                  <span className="font-mono text-[10px] uppercase text-ink-muted block">
                    Disputing Transaction:
                  </span>
                  <div className="font-bold text-ink text-sm">
                    {disputingPayment.payee} — ${disputingPayment.amount.toFixed(2)}{" "}
                    {disputingPayment.currency}
                  </div>
                  <div className="font-mono text-ink-muted text-[11px]">
                    Memo: &ldquo;{disputingPayment.purpose}&rdquo;
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[11px] uppercase text-ink block mb-1">
                    Dispute Reason Category
                  </label>
                  <select
                    value={disputeCategory}
                    onChange={(e: any) => setDisputeCategory(e.target.value)}
                    className="w-full p-2 bg-paper-100 hairline-border rounded text-ink focus:outline-none focus:ring-1 focus:ring-navy"
                  >
                    <option value="UNAUTHORIZED">Unauthorized or Erroneous Transaction</option>
                    <option value="ITEM_NOT_RECEIVED">Services or Goods Not Delivered</option>
                    <option value="INCORRECT_AMOUNT">Incorrect Billing Discrepancy</option>
                    <option value="DEFECTIVE_SERVICE">Defective Deliverable / Contract Breach</option>
                  </select>
                </div>

                <div>
                  <label className="font-mono text-[11px] uppercase text-ink block mb-1">
                    Specific Circumstances / Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide context (e.g. 'Vendor never submitted source files after release', or 'Vendor altered billing name')..."
                    value={disputeNotes}
                    onChange={(e) => setDisputeNotes(e.target.value)}
                    className="w-full p-2 bg-paper-100 hairline-border rounded text-ink focus:outline-none focus:ring-1 focus:ring-navy"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 hairline-t">
                  <button
                    type="button"
                    onClick={() => setDisputingPayment(null)}
                    className="px-3 py-1.5 font-mono text-xs text-ink-muted hover:text-ink"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDrafting}
                    className="px-4 py-1.5 bg-status-blocked text-white text-xs font-semibold rounded hover:bg-red-800 transition-colors"
                  >
                    {isDrafting ? "Compiling Claim..." : "Generate Dispute Package"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-green-50 border border-green-200 rounded text-xs text-status-allowed flex items-center space-x-2">
                  <CheckCircleIcon size={16} />
                  <span>Dispute claim package generated and logged to audit tape.</span>
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase text-ink-muted block mb-1">
                    Formatted PayPal Resolution Narrative:
                  </label>
                  <textarea
                    readOnly
                    rows={8}
                    value={disputeDraft.narrative}
                    className="w-full p-3 font-mono text-[11px] bg-paper-100 hairline-border rounded text-ink leading-relaxed"
                  />
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase text-ink-muted block">
                    Cryptographic Evidence Attached:
                  </span>
                  <ul className="text-[11px] font-mono list-disc list-inside text-ink space-y-0.5">
                    {disputeDraft.evidenceItems.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 hairline-t flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={handleCopyNarrative}
                    className="px-3.5 py-1.5 text-xs font-mono bg-paper-200 hover:bg-paper-300 text-ink rounded hairline-border transition-colors"
                  >
                    {copied ? "✓ Copied to Clipboard" : "Copy Dispute Text"}
                  </button>

                  <a
                    href={disputeDraft.paypalDisputeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-navy text-white text-xs font-semibold rounded hover:bg-navy-hover transition-colors"
                  >
                    <span>Open PayPal Resolution Center</span>
                    <ExternalLinkIcon size={13} />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
