import { redirect } from "next/navigation";
import { requireUser } from "@/src/lib/auth/require-user";
import { SupabaseBusinessRepository } from "@/src/modules/business/infrastructure/supabase-business-repository";
import { SupabaseSupplierImportRepository } from "@/src/modules/imports/infrastructure/supabase-import-repository";
import { ImportsPanel } from "./imports-panel";

export default async function ImportsPage() {
  const { supabase, userId } = await requireUser();
  const businessRepository = new SupabaseBusinessRepository(supabase);
  const business = await businessRepository.getCurrentForUser(userId);
  if (!business) redirect("/onboarding");

  const repository = new SupabaseSupplierImportRepository(supabase);
  const imports = await repository.list(business.id);

  return (
    <main className="dashboard-overview">
      <header className="app-page-header">
        <div>
          <span className="app-kicker">SUPPLIER IMPORTS</span>
          <h1>Match invoices to your menu.</h1>
          <p>Queue supplier files for product and cost matching.</p>
        </div>
      </header>
      <ImportsPanel initialImports={imports} />
    </main>
  );
}
