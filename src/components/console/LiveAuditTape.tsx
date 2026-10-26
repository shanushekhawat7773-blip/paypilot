"use client";

import React, { useState } from "react";
import { AuditEntry } from "@/types/payment";
import { DownloadIcon, RefreshCwIcon, LockIcon } from "@/components/ui/Icons";

interface LiveAuditTapeProps {
  entries: AuditEntry[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function LiveAuditTape({
  entries,
  onRefresh,
  isLoading = false,
}: LiveAuditTapeProps) {
  const [filter, setFilter] = useState<string>("ALL");

  const filteredEntries = entries.filter((e) => {
    if (filter === "ALL") return true;
    if (filter === "STAMPS") return Boolean(e.statusStamp);
    if (filter === "PAID") return e.statusStamp === "PAID";
    if (filter === "HELD") return e.statusStamp === "HELD";
    if (filter === "BLOCKED") return e.statusStamp === "BLOCKED";
    return true;
  });

  const getStampClass = (stamp?: string) => {
    switch (stamp) {
      case "PAID":
        return "stamp stamp-paid";
      case "HELD":
        return "stamp stamp-held";
      case "BLOCKED":
        return "stamp stamp-blocked";
      case "VERIFIED":
        return "stamp stamp-verified";
      case "REJECTED":
        return "stamp stamp-blocked";
      default:
        return "stamp";
    }
  };

  return (
    <div className="w-full flex flex-col">
      {/* Header Controls */}
      <div className="flex items-center justify-between pb-3 hairline-b mb-3">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-navy animate-pulse" />
          <h3 className="font-mono text-xs uppercase font-bold tracking-wider text-ink">
            Live Audit Tape
          </h3>
          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-paper-300 text-ink-muted rounded">
            Append-Only
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1 text-ink-muted hover:text-ink rounded hover:bg-paper-300 transition-colors"
              title="Refresh Audit Feed"
              aria-label="Refresh Audit Feed"
            >
              <RefreshCwIcon size={13} className={isLoading ? "animate-spin" : ""} />
            </button>
          )}

          <a
            href="/api/audit?export=csv"
            download
            className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-mono text-ink bg-paper-100 hover:bg-paper-300 hairline-border rounded transition-colors"
            title="Download verified CSV log"
          >
            <DownloadIcon size={12} />
            <span>CSV</span>
          </a>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 mb-3 text-[11px] font-mono">
        {["ALL", "STAMPS", "PAID", "HELD", "BLOCKED"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-2 py-0.5 rounded transition-colors ${
              filter === tab
                ? "bg-ink text-paper-100 font-semibold"
                : "text-ink-muted hover:text-ink hover:bg-paper-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* The Physical Receipt Roll */}
      <div className="receipt-paper rounded-sm p-4 font-mono text-xs text-ink min-h-[380px] max-h-[580px] overflow-y-auto">
        <div className="text-center pb-3 mb-3 hairline-b">
          <div className="font-bold text-[11px] uppercase tracking-widest text-ink">
            PAYPILOT TERMINAL RECEIPT ROLL
          </div>
          <div className="text-[10px] text-ink-muted">
            TAMPER-EVIDENT JOURNAL • SHA-256 IDEMPOTENCY
          </div>
          <div className="text-[9px] text-ink-subtle">
            {new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}{" "}
            • SANDBOX INSTANCE
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="py-12 text-center text-ink-subtle italic text-[11px]">
            Tape is running. Waiting for agent events...
          </div>
        ) : (
          <div className="space-y-3.5 divide-y divide-ink-hairline/50">
            {filteredEntries.map((entry, idx) => {
              const dateObj = new Date(entry.timestamp);
              const timeStr = dateObj.toLocaleTimeString("en-US", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });

              return (
                <div
                  key={entry.id}
                  className={`pt-3 first:pt-0 ${
                    idx === 0 ? "animate-ink-settle" : ""
                  }`}
                >
                  {/* Top line: time + title + stamp */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-1.5 text-[10px] text-ink-muted">
                      <span className="tabular-nums font-semibold">{timeStr}</span>
                      <span>•</span>
                      <span className="text-[10px] font-semibold text-ink">
                        {entry.title}
                      </span>
                    </div>

                    {entry.statusStamp && (
                      <span className={getStampClass(entry.statusStamp)}>
                        {entry.statusStamp}
                      </span>
                    )}
                  </div>

                  {/* Body: detail */}
                  <p className="mt-1 text-[11px] text-ink leading-relaxed font-sans">
                    {entry.detail}
                  </p>

                  {/* Bottom line: payee, amount, idempotency hash */}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-ink-muted font-mono">
                    {entry.payee && (
                      <span className="bg-paper-200 px-1 rounded">
                        To: <span className="text-ink font-medium">{entry.payee}</span>
                      </span>
                    )}

                    {entry.amount !== undefined && (
                      <span className="bg-paper-200 px-1 rounded tabular-nums font-bold text-ink">
                        ${entry.amount.toFixed(2)} {entry.currency || "USD"}
                      </span>
                    )}

                    {entry.idempotencyKey && (
                      <span
                        className="text-[9px] text-ink-subtle truncate max-w-[140px]"
                        title={`Idempotency Key: ${entry.idempotencyKey}`}
                      >
                        id:{entry.idempotencyKey.substring(0, 10)}...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 pt-3 hairline-t text-center text-[10px] text-ink-subtle">
          *** END OF ACTIVE AUDIT BUFFER ***
        </div>
      </div>
    </div>
  );
}
