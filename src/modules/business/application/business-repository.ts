import type {
  BusinessLocation,
  CurrentBusiness,
} from "@/src/modules/business/domain/business";

export interface BusinessRepository {
  getCurrentForUser(userId: string): Promise<CurrentBusiness | null>;
  getPrimaryLocation(businessId: string): Promise<BusinessLocation | null>;
  updateCarbonDisclosure(businessId: string, enabled: boolean): Promise<void>;
}
