import { NextResponse } from "next/server";
import { getBusinessContext } from "@/src/lib/auth/get-business-context";
import { SupabaseReportRepository } from "@/src/modules/reports/infrastructure/supabase-report-repository";

export async function GET() {
  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  try {
    const repository = new SupabaseReportRepository(context.supabase);
    const reports = await repository.list(
      context.business.id,
      context.location.id,
    );

    return NextResponse.json({
      currencyCode: context.business.currencyCode,
      reports,
    });
  } catch {
    return NextResponse.json({ error: "Could not load reports" }, { status: 500 });
  }
}
