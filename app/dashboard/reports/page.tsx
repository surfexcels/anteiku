import { redirect } from "next/navigation";
import { requireUser } from "@/src/lib/auth/require-user";
import { SupabaseBusinessRepository } from "@/src/modules/business/infrastructure/supabase-business-repository";
import { SupabaseReportRepository } from "@/src/modules/reports/infrastructure/supabase-report-repository";
import { ReportsPanel } from "./reports-panel";

export default async function ReportsPage() {
  const { supabase, userId } = await requireUser();
  const businessRepository = new SupabaseBusinessRepository(supabase);
  const business = await businessRepository.getCurrentForUser(userId);
  if (!business) redirect("/onboarding");

  const repository = new SupabaseReportRepository(supabase);
  const reports = await repository.list(business.id);

  return (
    <main className="dashboard-overview">
      <header className="app-page-header">
        <div>
          <span className="app-kicker">REPORTS</span>
          <h1>Exportable waste summaries.</h1>
          <p>Review period totals and top wasted products.</p>
        </div>
      </header>
      <ReportsPanel currencyCode={business.currencyCode} initialReports={reports} />
    </main>
  );
}
