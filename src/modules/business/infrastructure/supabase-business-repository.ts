import type { SupabaseClient } from "@supabase/supabase-js";
import type { BusinessRepository } from "@/src/modules/business/application/business-repository";
import type {
  BusinessLocation,
  CurrentBusiness,
  MembershipRole,
} from "@/src/modules/business/domain/business";

interface MembershipRow {
  business_id: string;
  role: MembershipRole;
}

interface BusinessRow {
  id: string;
  name: string;
  country_code: string;
  currency_code: string;
  timezone: string;
  carbon_disclosure_enabled: boolean;
}

export class SupabaseBusinessRepository implements BusinessRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getCurrentForUser(userId: string): Promise<CurrentBusiness | null> {
    const { data: membership, error: membershipError } = await this.client
      .from("business_memberships")
      .select("business_id, role")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (membershipError) throw membershipError;
    if (!membership) return null;

    const typedMembership = membership as MembershipRow;
    const { data: business, error: businessError } = await this.client
      .from("businesses")
      .select("id, name, country_code, currency_code, timezone, carbon_disclosure_enabled")
      .eq("id", typedMembership.business_id)
      .single();

    if (businessError) throw businessError;
    const row = business as BusinessRow;

    return {
      id: row.id,
      name: row.name,
      countryCode: row.country_code,
      currencyCode: row.currency_code,
      timezone: row.timezone,
      role: typedMembership.role,
      carbonDisclosureEnabled: row.carbon_disclosure_enabled ?? true,
    };
  }

  async updateCarbonDisclosure(
    businessId: string,
    enabled: boolean,
  ): Promise<void> {
    const { error } = await this.client
      .from("businesses")
      .update({ carbon_disclosure_enabled: enabled })
      .eq("id", businessId);

    if (error) throw error;
  }

  async getPrimaryLocation(
    businessId: string,
  ): Promise<BusinessLocation | null> {
    const { data, error } = await this.client
      .from("locations")
      .select("id, name")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return { id: data.id, name: data.name };
  }
}
