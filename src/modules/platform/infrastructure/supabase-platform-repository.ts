import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  PlatformTenantDetail,
  PlatformTenantSummary,
} from "@/src/modules/platform/domain/tenant";

interface BusinessRow {
  id: string;
  name: string;
  country_code: string;
  currency_code: string;
  timezone: string;
  created_at: string;
  subscriptions: Array<{
    status: string;
    plan_code: string;
  }> | null;
}

export class SupabasePlatformRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listTenants(): Promise<PlatformTenantSummary[]> {
    const { data, error } = await this.client
      .from("businesses")
      .select(
        "id, name, country_code, currency_code, timezone, created_at, subscriptions(status, plan_code)",
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    const businesses = (data ?? []) as BusinessRow[];
    const summaries: PlatformTenantSummary[] = [];

    for (const business of businesses) {
      const [locationCount, memberCount] = await Promise.all([
        this.countRows("locations", business.id),
        this.countRows("business_memberships", business.id),
      ]);

      const subscription = business.subscriptions?.[0] ?? null;
      summaries.push({
        id: business.id,
        name: business.name,
        countryCode: business.country_code,
        currencyCode: business.currency_code,
        timezone: business.timezone,
        createdAt: business.created_at,
        locationCount,
        memberCount,
        subscriptionStatus: subscription?.status ?? null,
        planCode: subscription?.plan_code ?? null,
      });
    }

    return summaries;
  }

  async getTenant(businessId: string): Promise<PlatformTenantDetail | null> {
    const { data, error } = await this.client
      .from("businesses")
      .select(
        "id, name, country_code, currency_code, timezone, created_at, subscriptions(status, plan_code)",
      )
      .eq("id", businessId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const business = data as BusinessRow;
    const [locations, members] = await Promise.all([
      this.client
        .from("locations")
        .select("id, name, is_active, created_at")
        .eq("business_id", businessId)
        .order("created_at", { ascending: true }),
      this.client
        .from("business_memberships")
        .select("id, user_id, role, is_active, created_at")
        .eq("business_id", businessId)
        .order("created_at", { ascending: true }),
    ]);

    if (locations.error) throw locations.error;
    if (members.error) throw members.error;

    const subscription = business.subscriptions?.[0] ?? null;

    return {
      id: business.id,
      name: business.name,
      countryCode: business.country_code,
      currencyCode: business.currency_code,
      timezone: business.timezone,
      createdAt: business.created_at,
      locationCount: locations.data?.length ?? 0,
      memberCount: members.data?.length ?? 0,
      subscriptionStatus: subscription?.status ?? null,
      planCode: subscription?.plan_code ?? null,
      locations: (locations.data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        isActive: row.is_active,
        createdAt: row.created_at,
      })),
      members: (members.data ?? []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        role: row.role,
        isActive: row.is_active,
        createdAt: row.created_at,
      })),
    };
  }

  private async countRows(table: "locations" | "business_memberships", businessId: string) {
    const { count, error } = await this.client
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId);

    if (error) throw error;
    return count ?? 0;
  }
}
