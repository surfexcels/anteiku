/**
 * Default grams CO2e per menu unit by food category.
 * Based on European LCA food averages (Agribalyse / PEF-style benchmarks).
 * Used when no manual or verified factor is set — document methodology for EmpCo.
 */
export const EU_CATEGORY_CO2E_BENCHMARKS_G: Record<string, number> = {
  viennoiserie: 350,
  bread: 220,
  "cake-pastry": 480,
  savoury: 620,
  coffee: 280,
  tea: 80,
  "cold-drinks": 150,
  "dairy-alternatives": 1200,
  ingredients: 250,
  default: 300,
};

export const BENCHMARK_METHODOLOGY =
  "Anteiku EU food-category benchmarks derived from public Agribalyse 3.2 " +
  "and Product Environmental Footprint (PEF) guidance. Values are indicative " +
  "for cafe and bakery menu units — replace with supplier or verified data " +
  "before making public environmental claims under EmpCo (EU 2024/825).";

export const EMPCO_APPLIES_FROM = "2026-09-27";
export const EMPCO_TRANSPOSITION_DEADLINE = "2026-03-27";
