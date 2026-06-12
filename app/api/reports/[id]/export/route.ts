import { NextResponse } from "next/server";
import { requireCapability } from "@/src/lib/auth/require-capability";
import { exportReportCsv } from "@/src/modules/reports/application/export-report-csv";
import { SupabaseReportRepository } from "@/src/modules/reports/infrastructure/supabase-report-repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await requireCapability("exportData");
  if ("error" in context) return context.error;

  const { id } = await params;

  try {
    const repository = new SupabaseReportRepository(context.supabase);
    const report = await repository.getById(context.business.id, id);

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const csv = exportReportCsv(report, context.business.currencyCode);
    const filename = `anteiku-report-${report.periodStart}-to-${report.periodEnd}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Could not export report" }, { status: 500 });
  }
}
