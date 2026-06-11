import type { ProductUnit } from "@/src/modules/catalog/domain/catalog-product";

export function quantityStep(unit: ProductUnit): number {
  switch (unit) {
    case "kg":
    case "l":
      return 0.1;
    case "g":
    case "ml":
      return 1;
    default:
      return 1;
  }
}

/** Snap counts to sensible increments — whole items by default, not 0.031. */
export function normalizeQuantity(value: number, unit: ProductUnit): number {
  const step = quantityStep(unit);
  const safe = Math.max(0, value);

  if (step >= 1) {
    return Math.round(safe);
  }

  return Math.round(safe / step) * step;
}

export function formatQuantityDisplay(value: number, unit: ProductUnit): string {
  const normalized = normalizeQuantity(value, unit);
  if (quantityStep(unit) >= 1) {
    return String(normalized);
  }
  return normalized.toFixed(1);
}
