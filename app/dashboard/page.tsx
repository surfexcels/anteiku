import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/src/lib/auth/require-user";
import { formatMoney } from "@/src/lib/format-money";
import { SupabaseBusinessRepository } from "@/src/modules/business/infrastructure/supabase-business-repository";
import { SupabaseRecommendationRepository } from "@/src/modules/recommendations/infrastructure/supabase-recommendation-repository";
import { SupabaseCatalogRepository } from "@/src/modules/catalog/infrastructure/supabase-catalog-repository";
import { SupabaseWasteRepository } from "@/src/modules/waste/infrastructure/supabase-waste-repository";

export default async function DashboardPage() {
  const { supabase, userId } = await requireUser();
  const businessRepository = new SupabaseBusinessRepository(supabase);
  const business = await businessRepository.getCurrentForUser(userId);
  if (!business) redirect("/onboarding");

  const wasteRepository = new SupabaseWasteRepository(supabase);
  const catalogRepository = new SupabaseCatalogRepository(supabase);
  const recommendationRepository = new SupabaseRecommendationRepository(supabase);

  const [summary, products, recommendations] = await Promise.all([
    wasteRepository.getSummary(business.id, 7),
    catalogRepository.listBusinessProducts(business.id),
    recommendationRepository.list(business.id),
  ]);

  const newInsights = recommendations.filter((item) => item.status === "new").length;

  return (
    <main className="dashboard-overview">
      <header className="app-page-header">
        <div>
          <span className="app-kicker">OVERVIEW</span>
          <h1>Good morning.</h1>
          <p>
            Here is where your margin went this week at {business.name}.
          </p>
        </div>
        <Link className="button primary small" href="/dashboard/waste">
          Log waste
        </Link>
      </header>

      <section className="metric-grid-app">
        <article className="metric-card-app featured">
          <span>Waste cost (7 days)</span>
          <strong>{formatMoney(summary.totalCostMinor, business.currencyCode)}</strong>
          <p>{summary.itemCount} entries logged</p>
        </article>
        <article className="metric-card-app">
          <span>Menu items</span>
          <strong>{products.length}</strong>
          <p>
            <Link href="/dashboard/products">Manage products</Link>
          </p>
        </article>
        <article className="metric-card-app">
          <span>New insights</span>
          <strong>{newInsights}</strong>
          <p>
            <Link href="/dashboard/insights">View insights</Link>
          </p>
        </article>
      </section>

      <section className="panel-app">
        <div className="panel-head-app">
          <div>
            <h2>Where your money went</h2>
            <p>Top wasted products this week</p>
          </div>
        </div>
        {summary.topProducts.length === 0 ? (
          <div className="empty-state-app">
            <strong>No waste logged yet</strong>
            <p>Add products to your menu, then log today&apos;s waste.</p>
            <Link className="button primary small" href="/dashboard/waste">
              Log first entry
            </Link>
          </div>
        ) : (
          <div className="ranked-list">
            {summary.topProducts.map((product, index) => (
              <div className="ranked-row" key={product.productName}>
                <span>{index + 1}</span>
                <strong>{product.productName}</strong>
                <small>{product.quantity} units</small>
                <b>{formatMoney(product.totalCostMinor, business.currencyCode)}</b>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
