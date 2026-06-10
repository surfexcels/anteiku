import { redirect } from "next/navigation";
import { requireUser } from "@/src/lib/auth/require-user";
import { SupabaseBusinessRepository } from "@/src/modules/business/infrastructure/supabase-business-repository";
import { SupabaseCatalogRepository } from "@/src/modules/catalog/infrastructure/supabase-catalog-repository";
import { SupabaseWasteRepository } from "@/src/modules/waste/infrastructure/supabase-waste-repository";
import { WasteLogPanel } from "./waste-log-panel";

export default async function WastePage() {
  const { supabase, userId } = await requireUser();
  const businessRepository = new SupabaseBusinessRepository(supabase);
  const business = await businessRepository.getCurrentForUser(userId);
  if (!business) redirect("/onboarding");

  const wasteRepository = new SupabaseWasteRepository(supabase);
  const catalogRepository = new SupabaseCatalogRepository(supabase);

  const [logs, products, reasons] = await Promise.all([
    wasteRepository.listLogs(business.id),
    catalogRepository.listBusinessProducts(business.id),
    wasteRepository.listReasons(business.id),
  ]);

  return (
    <main className="dashboard-overview">
      <header className="app-page-header">
        <div>
          <span className="app-kicker">WASTE LOG</span>
          <h1>Track what gets thrown away.</h1>
          <p>Each entry snapshots the unit cost so losses stay accurate.</p>
        </div>
      </header>
      <WasteLogPanel
        currencyCode={business.currencyCode}
        initialLogs={logs}
        products={products}
        reasons={reasons}
      />
    </main>
  );
}
