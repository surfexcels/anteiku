import type { BusinessLocation, CurrentBusiness } from "@/src/modules/business/domain/business";

export interface WorkspaceContext {
  business: CurrentBusiness;
  location: BusinessLocation;
  locations: BusinessLocation[];
}
