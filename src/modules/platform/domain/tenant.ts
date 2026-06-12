export interface PlatformTenantSummary {
  id: string;
  name: string;
  countryCode: string;
  currencyCode: string;
  timezone: string;
  createdAt: string;
  locationCount: number;
  memberCount: number;
  subscriptionStatus: string | null;
  planCode: string | null;
}

export interface PlatformTenantDetail extends PlatformTenantSummary {
  locations: Array<{
    id: string;
    name: string;
    isActive: boolean;
    createdAt: string;
  }>;
  members: Array<{
    id: string;
    userId: string;
    role: string;
    isActive: boolean;
    createdAt: string;
  }>;
}
