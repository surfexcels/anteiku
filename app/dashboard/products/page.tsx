import { redirect } from "next/navigation";
import { requireUser } from "@/src/lib/auth/require-user";
import { SupabaseBusinessRepository } from "@/src/modules/business/infrastructure/supabase-business-repository";
import { SupabaseCatalogRepository } from "@/src/modules/catalog/infrastructure/supabase-catalog-repository";
import { ProductCatalog } from "./product-catalog";

export default async function ProductsPage() {
  const { supabase, userId } = await requireUser();
  const businessRepository = new SupabaseBusinessRepository(supabase);
  const business = await businessRepository.getCurrentForUser(userId);
  if (!business) redirect("/onboarding");

  const catalogRepository = new SupabaseCatalogRepository(supabase);
  const products = await catalogRepository.listBusinessProducts(business.id);

  return (
    <main className="products-page">
      <header className="app-page-header">
        <div>
          <span className="app-kicker">PRODUCT SETUP</span>
          <h1>Build your cafe menu.</h1>
          <p>
            Search the bundled European food catalog, choose an item, and set
            what one unit costs your business.
          </p>
        </div>
        <div className="menu-count">
          <strong>{products.length}</strong>
          <span>menu items</span>
        </div>
      </header>

      <ProductCatalog
        countryCode={business.countryCode}
        currencyCode={business.currencyCode}
        initialProducts={products}
      />
    </main>
  );
}
