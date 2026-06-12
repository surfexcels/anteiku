import { NextResponse } from "next/server";
import { requireCapability } from "@/src/lib/auth/require-capability";
import { exportWasteCsv } from "@/src/modules/waste/application/export-waste-csv";
import { SupabaseWasteRepository } from "@/src/modules/waste/infrastructure/supabase-waste-repository";

export async function GET(request: Request) {
  const context = await requireCapability("exportData");
  if ("error" in context) return context.error;

  const { searchParams } = new URL(request.url);
  const days = Math.min(Math.max(Number(searchParams.get("days") ?? 30), 1), 365);

  try {
    const repository = new SupabaseWasteRepository(context.supabase);
    const locationId = searchParams.get("locationId") ?? context.location.id;
    const logs = await repository.listLogsForExport(
      context.business.id,
      days,
      locationId,
    );
    const csv = exportWasteCsv(logs, context.business.name);
    const filename = `anteiku-waste-log-${days}d.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Could not export waste logs" }, { status: 500 });
  }
}
