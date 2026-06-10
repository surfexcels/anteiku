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
}

export interface CatalogRepository {
  listBusinessProducts(businessId: string): Promise<BusinessProduct[]>;
  addBusinessProduct(input: AddBusinessProductInput): Promise<BusinessProduct>;
}
