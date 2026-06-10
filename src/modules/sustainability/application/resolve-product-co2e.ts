import { EUROPEAN_FOOD_BY_ID } from "@/src/data/european-food-catalog";
import type { ProductUnit } from "@/src/modules/catalog/domain/catalog-product";
import {
  BENCHMARK_METHODOLOGY,
  EU_CATEGORY_CO2E_BENCHMARKS_G,
} from "@/src/modules/sustainability/data/eu-category-co2e-benchmarks";
import type { Co2eSource, ProductCo2eProfile } from "@/src/modules/sustainability/domain/carbon";

const UNIT_SCALE: Partial<Record<ProductUnit, number>> = {
  kg: 1,
  g: 0.001,
  l: 1,
  ml: 0.001,
  item: 1,
  portion: 1,
  pack: 1,
};

function categorySlugForCatalogSource(catalogSourceId: string | null) {
  if (!catalogSourceId) return null;
  const entry = EUROPEAN_FOOD_BY_ID.get(catalogSourceId);
  return entry?.categorySlug ?? null;
}

export function benchmarkCo2eForCatalogSource(
  catalogSourceId: string | null,
  unit: ProductUnit,
): ProductCo2eProfile {
  const slug = categorySlugForCatalogSource(catalogSourceId);
  const perBaseUnit =
    EU_CATEGORY_CO2E_BENCHMARKS_G[slug ?? "default"] ??
    EU_CATEGORY_CO2E_BENCHMARKS_G.default;
  const scale = UNIT_SCALE[unit] ?? 1;

  return {
    unitCo2eG: Number((perBaseUnit * scale).toFixed(3)),
    source: "benchmark",
    methodology: BENCHMARK_METHODOLOGY,
  };
}

export function resolveProductCo2e(input: {
  catalogSourceId: string | null;
  unit: ProductUnit;
  unitCo2eG?: number | null;
  co2eSource?: Co2eSource | null;
  co2eMethodology?: string | null;
}): ProductCo2eProfile {
  if (input.unitCo2eG != null && input.unitCo2eG >= 0) {
    return {
      unitCo2eG: input.unitCo2eG,
      source: input.co2eSource ?? "manual",
      methodology:
        input.co2eMethodology ??
        (input.co2eSource === "benchmark" ? BENCHMARK_METHODOLOGY : "Owner-provided factor"),
    };
  }

  return benchmarkCo2eForCatalogSource(input.catalogSourceId, input.unit);
}
