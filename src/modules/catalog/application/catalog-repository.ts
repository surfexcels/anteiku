import type {
  BusinessProduct,
  ProductUnit,
} from "@/src/modules/catalog/domain/catalog-product";

export interface SearchCatalogInput {
  query: string;
  countryCode?: string;
  limit?: number;
}

export interface AddBusinessProductInput {
  businessId: string;
  userId: string;
  catalogSourceId: string;
  name: string;
  imageUrl: string;
  unit: ProductUnit;
  unitCostMinor: number;
  currencyCode: string;
  unitCo2eG?: number;
  co2eSource?: string;
  co2eMethodology?: string;
}

export interface AddCustomBusinessProductInput {
  businessId: string;
  userId: string;
  name: string;
  unit: ProductUnit;
  unitCostMinor: number;
  currencyCode: string;
  unitCo2eG?: number;
  co2eSource?: string;
  co2eMethodology?: string;
}

export interface UpdateBusinessProductInput {
  businessId: string;
  productId: string;
  name?: string;
  unit?: ProductUnit;
  unitCostMinor?: number;
  isActive?: boolean;
  unitCo2eG?: number | null;
  co2eSource?: string;
  co2eMethodology?: string | null;
}

export interface CatalogRepository {
  listBusinessProducts(businessId: string): Promise<BusinessProduct[]>;
  addBusinessProduct(input: AddBusinessProductInput): Promise<BusinessProduct>;
  addCustomBusinessProduct(
    input: AddCustomBusinessProductInput,
  ): Promise<BusinessProduct>;
  updateBusinessProduct(
    input: UpdateBusinessProductInput,
  ): Promise<BusinessProduct>;
}
