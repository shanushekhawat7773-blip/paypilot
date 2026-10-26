import crypto from "crypto";
import { AuditEntry, AuditEventType } from "@/types/payment";

/**
 * Creates an append-only, tamper-evident audit entry.
 */
export function createAuditEntry(params: {
  eventType: AuditEventType;
  title: string;
  detail: string;
  stepId?: string;
  payee?: string;
  amount?: number;
  currency?: string;
  statusStamp?: "PAID" | "HELD" | "BLOCKED" | "VERIFIED" | "REJECTED";
  idempotencyKey?: string;
  metadata?: Record<string, any>;
}): AuditEntry {
  const timestamp = new Date().toISOString();
  const id = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  return {
    id,
    timestamp,
    stepId: params.stepId,
    eventType: params.eventType,
    title: params.title,
    detail: params.detail,
    payee: params.payee,
    amount: params.amount,
    currency: params.currency || "USD",
    statusStamp: params.statusStamp,
    idempotencyKey: params.idempotencyKey,
    metadata: params.metadata,
  };
}

/**
 * Exports audit entries to CSV (RFC-4180 format).
 */
export function exportAuditTapeToCSV(entries: AuditEntry[]): string {
  const headers = [
    "Timestamp",
    "Event Type",
    "Title",
    "Payee",
    "Amount",
    "Currency",
    "Stamp",
    "Idempotency Key",
    "Detail & Reasoning",
  ];

  const escapeCSV = (val: any) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = entries.map((e) => [
    escapeCSV(e.timestamp),
    escapeCSV(e.eventType),
    escapeCSV(e.title),
    escapeCSV(e.payee || ""),
    escapeCSV(e.amount !== undefined ? e.amount.toFixed(2) : ""),
    escapeCSV(e.currency || "USD"),
    escapeCSV(e.statusStamp || ""),
    escapeCSV(e.idempotencyKey || ""),
    escapeCSV(e.detail),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}
