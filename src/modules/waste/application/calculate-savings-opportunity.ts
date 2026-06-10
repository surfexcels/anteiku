import type { SavingsOpportunity } from "@/src/modules/waste/domain/waste";

export function calculateSavingsOpportunity(
  totalCostMinor: number,
  days: number,
  reductionRate = 0.15,
): SavingsOpportunity {
  const weeklyCostMinor = Math.round((totalCostMinor / Math.max(days, 1)) * 7);
  const annualRecoverableMinor = Math.round(weeklyCostMinor * 52 * reductionRate);

  return {
    weeklyCostMinor,
    annualRecoverableMinor,
    reductionRate,
  };
}
