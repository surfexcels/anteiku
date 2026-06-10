export const CO2E_SOURCES = [
  "benchmark",
  "manual",
  "supplier",
  "verified",
] as const;

export type Co2eSource = (typeof CO2E_SOURCES)[number];

export interface ProductCo2eProfile {
  unitCo2eG: number;
  source: Co2eSource;
  methodology: string;
}

export interface CarbonSummary {
  totalCo2eG: number;
  itemCount: number;
  topProducts: Array<{
    productName: string;
    totalCo2eG: number;
    quantity: number;
  }>;
}

export interface DailyCarbonTrend {
  date: string;
  totalCo2eG: number;
  itemCount: number;
}

export interface CarbonPeriodComparison {
  currentTotalCo2eG: number;
  previousTotalCo2eG: number;
  changePercent: number | null;
}

export interface CarbonOverviewAnalytics {
  summary: CarbonSummary;
  trend: DailyCarbonTrend[];
  comparison: CarbonPeriodComparison;
}

export interface EmpCoReadiness {
  appliesFrom: string;
  transpositionDeadline: string;
  disclosureEnabled: boolean;
  productsWithFactors: number;
  productsMissingFactors: number;
  productsVerified: number;
  canMakePublicClaims: boolean;
  checklist: Array<{
    id: string;
    label: string;
    done: boolean;
    detail: string;
  }>;
}

export interface SustainabilityBootstrap {
  businessName: string;
  countryCode: string;
  currencyCode: string;
  periodDays: number;
  carbon: CarbonOverviewAnalytics;
  empco: EmpCoReadiness;
  equivalencies: {
    carKm: number;
    smartphoneCharges: number;
  };
}
