import { AnteikuLogo } from "@/app/components/anteiku-logo";
import { redirect } from "next/navigation";
import { requireUser } from "@/src/lib/auth/require-user";
import { SupabaseBusinessRepository } from "@/src/modules/business/infrastructure/supabase-business-repository";
import { createBusiness } from "./actions";

export const dynamic = "force-dynamic";

const countries = [
  ["GB", "United Kingdom", "GBP", "Europe/London"],
  ["IE", "Ireland", "EUR", "Europe/Dublin"],
  ["FR", "France", "EUR", "Europe/Paris"],
  ["DE", "Germany", "EUR", "Europe/Berlin"],
  ["ES", "Spain", "EUR", "Europe/Madrid"],
  ["IT", "Italy", "EUR", "Europe/Rome"],
  ["NL", "Netherlands", "EUR", "Europe/Amsterdam"],
  ["BE", "Belgium", "EUR", "Europe/Brussels"],
  ["PT", "Portugal", "EUR", "Europe/Lisbon"],
] as const;

export default async function OnboardingPage() {
  const { supabase, userId } = await requireUser();
  const businessRepository = new SupabaseBusinessRepository(supabase);
  const existingBusiness = await businessRepository.getCurrentForUser(userId);

  if (existingBusiness) redirect("/dashboard");

  return (
    <main className="onboarding-page">
      <section className="onboarding-card">
        <AnteikuLogo className="onboarding-logo" size="md" variant="default" />
        <span className="app-kicker">ONE MINUTE SETUP</span>
        <h1>Tell us about your cafe.</h1>
        <p>
          We use this to set your currency, local catalog, and reporting
          timezone.
        </p>
        <form action={createBusiness} className="onboarding-form">
          <label>
            Business name
            <input name="name" placeholder="Brume & Lait" required />
          </label>
          <label>
            Country
            <select defaultValue="FR" name="countryCode">
              {countries.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Currency
            <select defaultValue="EUR" name="currencyCode">
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British pound</option>
              <option value="CHF">CHF - Swiss franc</option>
              <option value="DKK">DKK - Danish krone</option>
              <option value="NOK">NOK - Norwegian krone</option>
              <option value="SEK">SEK - Swedish krona</option>
              <option value="PLN">PLN - Polish zloty</option>
            </select>
          </label>
          <label>
            Timezone
            <select defaultValue="Europe/Paris" name="timezone">
              {countries.map(([code, name, , timezone]) => (
                <option key={code} value={timezone}>
                  {name} - {timezone}
                </option>
              ))}
            </select>
          </label>
          <button className="button primary large full" type="submit">
            Create my workspace
          </button>
        </form>
      </section>
    </main>
  );
}
