/** Average EU passenger car emissions ~120 g CO2e/km (EEA indicative). */
const GRAMS_CO2E_PER_CAR_KM = 120;

/** Rough smartphone full charge ~8 g CO2e (grid average). */
const GRAMS_CO2E_PER_PHONE_CHARGE = 8;

export function carbonEquivalencies(totalCo2eG: number) {
  return {
    carKm: Number((totalCo2eG / GRAMS_CO2E_PER_CAR_KM).toFixed(1)),
    smartphoneCharges: Math.round(totalCo2eG / GRAMS_CO2E_PER_PHONE_CHARGE),
  };
}

export function formatCo2e(totalGrams: number): string {
  if (totalGrams >= 1_000_000) {
    return `${(totalGrams / 1_000_000).toFixed(2)} t CO₂e`;
  }
  if (totalGrams >= 1000) {
    return `${(totalGrams / 1000).toFixed(2)} kg CO₂e`;
  }
  return `${totalGrams.toFixed(0)} g CO₂e`;
}
