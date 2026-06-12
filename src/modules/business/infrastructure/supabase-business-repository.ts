import type { SupabaseClient } from "@supabase/supabase-js";
import type { BusinessRepository } from "@/src/modules/business/application/business-repository";
import type {
  BusinessInvitation,
  BusinessLocation,
  BusinessLocationDetail,
  BusinessMember,
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
    const locations = await this.listLocations(businessId);
    return locations[0] ?? null;
  }

  async listLocations(businessId: string): Promise<BusinessLocation[]> {
    const locations = await this.listLocationDetails(businessId);
    return locations
      .filter((location) => location.isActive)
      .map((location) => ({ id: location.id, name: location.name }));
  }

  async listLocationDetails(businessId: string): Promise<BusinessLocationDetail[]> {
    const { data, error } = await this.client
      .from("locations")
      .select("id, name, country_code, timezone, is_active, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      countryCode: row.country_code,
      timezone: row.timezone,
      isActive: row.is_active,
      createdAt: row.created_at,
    }));
  }

  async createLocation(input: {
    businessId: string;
    name: string;
    countryCode: string;
    timezone: string;
  }): Promise<BusinessLocationDetail> {
    const { data, error } = await this.client
      .from("locations")
      .insert({
        business_id: input.businessId,
        name: input.name,
        country_code: input.countryCode,
        timezone: input.timezone,
      })
      .select("id, name, country_code, timezone, is_active, created_at")
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      countryCode: data.country_code,
      timezone: data.timezone,
      isActive: data.is_active,
      createdAt: data.created_at,
    };
  }

  async updateLocation(input: {
    businessId: string;
    locationId: string;
    name?: string;
    isActive?: boolean;
  }): Promise<BusinessLocationDetail> {
    const patch: Record<string, string | boolean> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.isActive !== undefined) patch.is_active = input.isActive;

    const { data, error } = await this.client
      .from("locations")
      .update(patch)
      .eq("business_id", input.businessId)
      .eq("id", input.locationId)
      .select("id, name, country_code, timezone, is_active, created_at")
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      countryCode: data.country_code,
      timezone: data.timezone,
      isActive: data.is_active,
      createdAt: data.created_at,
    };
  }

  async countActiveLocations(businessId: string): Promise<number> {
    const { count, error } = await this.client
      .from("locations")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("is_active", true);

    if (error) throw error;
    return count ?? 0;
  }

  async listPendingInvitations(businessId: string): Promise<BusinessInvitation[]> {
    const { data, error } = await this.client
      .from("business_invitations")
      .select("id, email, role, full_name, created_at")
      .eq("business_id", businessId)
      .is("accepted_at", null)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role as MembershipRole,
      fullName: row.full_name,
      createdAt: row.created_at,
    }));
  }

  async addMember(input: {
    businessId: string;
    userId: string;
    role: MembershipRole;
  }): Promise<BusinessMember> {
    const { data, error } = await this.client
      .from("business_memberships")
      .insert({
        business_id: input.businessId,
        user_id: input.userId,
        role: input.role,
      })
      .select("id, user_id, role, is_active, created_at")
      .single();

    if (error) throw error;

    const { data: profile } = await this.client
      .from("profiles")
      .select("full_name")
      .eq("id", input.userId)
      .maybeSingle();

    return {
      id: data.id,
      userId: data.user_id,
      fullName: profile?.full_name ?? null,
      role: data.role as MembershipRole,
      isActive: data.is_active,
      createdAt: data.created_at,
    };
  }

  async createInvitation(input: {
    businessId: string;
    invitedBy: string;
    email: string;
    role: MembershipRole;
    fullName?: string;
  }): Promise<BusinessInvitation> {
    const { data, error } = await this.client
      .from("business_invitations")
      .insert({
        business_id: input.businessId,
        email: input.email.toLowerCase(),
        role: input.role,
        full_name: input.fullName ?? null,
        invited_by: input.invitedBy,
      })
      .select("id, email, role, full_name, created_at")
      .single();

    if (error) throw error;

    return {
      id: data.id,
      email: data.email,
      role: data.role as MembershipRole,
      fullName: data.full_name,
      createdAt: data.created_at,
    };
  }

  async updateMember(input: {
    businessId: string;
    membershipId: string;
    role?: MembershipRole;
    isActive?: boolean;
  }): Promise<BusinessMember> {
    const patch: Record<string, MembershipRole | boolean> = {};
    if (input.role !== undefined) patch.role = input.role;
    if (input.isActive !== undefined) patch.is_active = input.isActive;

    const { data, error } = await this.client
      .from("business_memberships")
      .update(patch)
      .eq("business_id", input.businessId)
      .eq("id", input.membershipId)
      .select("id, user_id, role, is_active, created_at")
      .single();

    if (error) throw error;

    const { data: profile } = await this.client
      .from("profiles")
      .select("full_name")
      .eq("id", data.user_id)
      .maybeSingle();

    return {
      id: data.id,
      userId: data.user_id,
      fullName: profile?.full_name ?? null,
      role: data.role as MembershipRole,
      isActive: data.is_active,
      createdAt: data.created_at,
    };
  }

  async countActiveOwners(businessId: string): Promise<number> {
    const { count, error } = await this.client
      .from("business_memberships")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("role", "owner")
      .eq("is_active", true);

    if (error) throw error;
    return count ?? 0;
  }

  async getMembershipForUser(
    userId: string,
  ): Promise<{ businessId: string; membershipId: string } | null> {
    const { data, error } = await this.client
      .from("business_memberships")
      .select("id, business_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      businessId: data.business_id,
      membershipId: data.id,
    };
  }

  async listMembers(businessId: string): Promise<BusinessMember[]> {
    const { data: memberships, error } = await this.client
      .from("business_memberships")
      .select("id, user_id, role, is_active, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    if (!memberships?.length) return [];

    const userIds = memberships.map((row) => row.user_id);
    const { data: profiles } = await this.client
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    const nameByUserId = new Map(
      (profiles ?? []).map((profile) => [profile.id, profile.full_name]),
    );

    return memberships.map((row) => ({
      id: row.id,
      userId: row.user_id,
      fullName: nameByUserId.get(row.user_id) ?? null,
      role: row.role as MembershipRole,
      isActive: row.is_active,
      createdAt: row.created_at,
    }));
  }

  async updateBusinessName(businessId: string, name: string): Promise<void> {
    const { error } = await this.client
      .from("businesses")
      .update({ name })
      .eq("id", businessId);

    if (error) throw error;
  }

  async getActiveLocationPreference(
    userId: string,
    businessId: string,
  ): Promise<{ locationId: string } | null> {
    const { data, error } = await this.client
      .from("member_preferences")
      .select("active_location_id")
      .eq("user_id", userId)
      .eq("business_id", businessId)
      .maybeSingle();

    if (error) {
      if (error.code === "42P01") return null;
      throw error;
    }

    if (!data) return null;
    return { locationId: data.active_location_id };
  }

  async setActiveLocationPreference(
    userId: string,
    businessId: string,
    locationId: string,
  ): Promise<void> {
    const { error } = await this.client.from("member_preferences").upsert(
      {
        user_id: userId,
        business_id: businessId,
        active_location_id: locationId,
      },
      { onConflict: "user_id,business_id" },
    );

    if (error) throw error;
  }
}
