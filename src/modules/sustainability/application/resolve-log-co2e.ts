import type { ProductUnit } from "@/src/modules/catalog/domain/catalog-product";
import type { Co2eSource } from "@/src/modules/sustainability/domain/carbon";
import { resolveProductCo2e } from "@/src/modules/sustainability/application/resolve-product-co2e";

export function resolveLogUnitCo2eG(input: {
  loggedUnitCo2eG?: number | null;
  productUnitCo2eG?: number | null;
  catalogSourceId?: string | null;
  unit: ProductUnit;
  co2eSource?: Co2eSource | null;
  co2eMethodology?: string | null;
}): number {
  if (input.loggedUnitCo2eG != null && input.loggedUnitCo2eG >= 0) {
    return input.loggedUnitCo2eG;
  }

  return resolveProductCo2e({
    catalogSourceId: input.catalogSourceId ?? null,
    unit: input.unit,
    unitCo2eG: input.productUnitCo2eG,
    co2eSource: input.co2eSource,
    co2eMethodology: input.co2eMethodology,
  }).unitCo2eG;
}
