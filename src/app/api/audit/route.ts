import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/storage/store";
import { exportAuditTapeToCSV } from "@/lib/audit/tape";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isExport = searchParams.get("export") === "csv";

  if (isExport) {
    const csvContent = exportAuditTapeToCSV(store.auditTape);
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="paypilot-audit-tape-${Date.now()}.csv"`,
      },
    });
  }

  return NextResponse.json({
    entries: store.auditTape,
    count: store.auditTape.length,
  });
}
