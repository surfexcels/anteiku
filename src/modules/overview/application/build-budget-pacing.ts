import type { BudgetPacing, WastePeriodComparison } from "@/src/modules/waste/domain/waste";

export function buildBudgetPacing(
  comparison: WastePeriodComparison,
  periodDays: number,
): BudgetPacing {
  const actualCostMinor = comparison.currentTotalCostMinor;
  const targetCostMinor =
    comparison.previousTotalCostMinor > 0
      ? comparison.previousTotalCostMinor
      : actualCostMinor;

  const percentUsed =
    targetCostMinor > 0
      ? Math.round((actualCostMinor / targetCostMinor) * 100)
      : actualCostMinor > 0
        ? 100
        : 0;

  let status: BudgetPacing["status"] = "on_track";
  if (percentUsed > 105) status = "over";
  else if (percentUsed < 95) status = "under";

  return {
    periodDays,
    actualCostMinor,
    targetCostMinor,
    percentUsed,
    status,
  };
}
