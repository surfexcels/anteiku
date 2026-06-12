import type {
  BusinessLocation,
  BusinessLocationDetail,
  BusinessMember,
  CurrentBusiness,
} from "@/src/modules/business/domain/business";

export interface MemberLocationPreference {
  locationId: string;
}

export interface BusinessRepository {
  getCurrentForUser(userId: string): Promise<CurrentBusiness | null>;
  getPrimaryLocation(businessId: string): Promise<BusinessLocation | null>;
  listLocations(businessId: string): Promise<BusinessLocation[]>;
  listLocationDetails(businessId: string): Promise<BusinessLocationDetail[]>;
  createLocation(input: {
    businessId: string;
    name: string;
    countryCode: string;
    timezone: string;
  }): Promise<BusinessLocationDetail>;
  updateLocation(input: {
    businessId: string;
    locationId: string;
    name?: string;
    isActive?: boolean;
  }): Promise<BusinessLocationDetail>;
  listMembers(businessId: string): Promise<BusinessMember[]>;
  updateBusinessName(businessId: string, name: string): Promise<void>;
  countActiveLocations(businessId: string): Promise<number>;
  getActiveLocationPreference(
    userId: string,
    businessId: string,
  ): Promise<MemberLocationPreference | null>;
  setActiveLocationPreference(
    userId: string,
    businessId: string,
    locationId: string,
  ): Promise<void>;
  updateCarbonDisclosure(businessId: string, enabled: boolean): Promise<void>;
}
