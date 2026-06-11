import type {
  BusinessLocation,
  CurrentBusiness,
} from "@/src/modules/business/domain/business";

export interface MemberLocationPreference {
  locationId: string;
}

export interface BusinessRepository {
  getCurrentForUser(userId: string): Promise<CurrentBusiness | null>;
  getPrimaryLocation(businessId: string): Promise<BusinessLocation | null>;
  listLocations(businessId: string): Promise<BusinessLocation[]>;
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
