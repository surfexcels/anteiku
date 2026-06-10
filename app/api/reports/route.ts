import { NextResponse } from "next/server";
import { getBusinessContext } from "@/src/lib/auth/get-business-context";
import { createReportSchema } from "@/src/modules/reports/application/report-schemas";
import { SupabaseReportRepository } from "@/src/modules/reports/infrastructure/supabase-report-repository";

export async function GET() {
  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  try {
    const repository = new SupabaseReportRepository(context.supabase);
    const reports = await repository.list(context.business.id);
    return NextResponse.json({ reports });
  } catch {
    return NextResponse.json({ error: "Could not load reports" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  const parsed = createReportSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid report period", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const repository = new SupabaseReportRepository(context.supabase);
    const report = await repository.create({
      businessId: context.business.id,
      userId: context.userId,
      locationId: context.location.id,
      periodStart: parsed.data.periodStart,
      periodEnd: parsed.data.periodEnd,
    });
    return NextResponse.json({ report }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create report" }, { status: 500 });
  }
}
