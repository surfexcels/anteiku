import { redirect } from "next/navigation";
import { requireUser } from "@/src/lib/auth/require-user";
import { SupabaseBusinessRepository } from "@/src/modules/business/infrastructure/supabase-business-repository";
import { SupabaseRecommendationRepository } from "@/src/modules/recommendations/infrastructure/supabase-recommendation-repository";
import { InsightsPanel } from "./insights-panel";

export default async function InsightsPage() {
  const { supabase, userId } = await requireUser();
  const businessRepository = new SupabaseBusinessRepository(supabase);
  const business = await businessRepository.getCurrentForUser(userId);
  if (!business) redirect("/onboarding");

  const repository = new SupabaseRecommendationRepository(supabase);
  const recommendations = await repository.list(business.id);

  return (
    <main className="dashboard-overview">
      <header className="app-page-header">
        <div>
          <span className="app-kicker">INSIGHTS</span>
          <h1>Turn waste data into action.</h1>
          <p>Each recommendation includes an estimated financial impact.</p>
        </div>
      </header>
      <InsightsPanel
        currencyCode={business.currencyCode}
        initialRecommendations={recommendations}
      />
    </main>
  );
}
