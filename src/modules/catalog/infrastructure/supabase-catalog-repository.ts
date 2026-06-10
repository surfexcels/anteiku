import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AddBusinessProductInput,
  CatalogRepository,
} from "@/src/modules/catalog/application/catalog-repository";
import type {
  BusinessProduct,
  ProductUnit,
} from "@/src/modules/catalog/domain/catalog-product";

interface BusinessProductRow {
  id: string;
  catalog_product_id: string | null;
  sku: string | null;
  name: string;
  image_url: string | null;
  unit: ProductUnit;
  unit_cost_minor: number;
  currency_code: string;
  is_active: boolean;
}

function thumbnailUrl(name: string) {
  const params = new URLSearchParams({ name });
  return `/api/catalog/thumbnail?${params.toString()}`;
}

function mapBusinessProduct(row: BusinessProductRow): BusinessProduct {
  return {
    id: row.id,
    catalogProductId: row.catalog_product_id,
    catalogSourceId: row.sku,
    name: row.name,
    imageUrl: row.image_url || thumbnailUrl(row.name),
    unit: row.unit,
    unitCostMinor: row.unit_cost_minor,
    currencyCode: row.currency_code,
    isActive: row.is_active,
  };
}

export class SupabaseCatalogRepository implements CatalogRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listBusinessProducts(businessId: string): Promise<BusinessProduct[]> {
    const { data, error } = await this.client
      .from("business_products")
      .select(
        "id, catalog_product_id, sku, name, image_url, unit, unit_cost_minor, currency_code, is_active",
      )
      .eq("business_id", businessId)
      .order("name");

    if (error) throw error;
    return ((data ?? []) as BusinessProductRow[]).map(mapBusinessProduct);
  }

  async hasBusinessProductWithSource(
    businessId: string,
    catalogSourceId: string,
  ): Promise<boolean> {
    const { data, error } = await this.client
      .from("business_products")
      .select("id")
      .eq("business_id", businessId)
      .eq("sku", catalogSourceId)
      .maybeSingle();

    if (error) throw error;
    return Boolean(data);
  }

  async addBusinessProduct(
    input: AddBusinessProductInput,
  ): Promise<BusinessProduct> {
    const alreadyAdded = await this.hasBusinessProductWithSource(
      input.businessId,
      input.catalogSourceId,
    );
    if (alreadyAdded) {
      throw new Error("duplicate catalog source");
    }

    const { data, error } = await this.client
      .from("business_products")
      .insert({
        business_id: input.businessId,
        catalog_product_id: null,
        sku: input.catalogSourceId,
        name: input.name,
        image_url: input.imageUrl || null,
        unit: input.unit,
        unit_cost_minor: input.unitCostMinor,
        currency_code: input.currencyCode,
        created_by: input.userId,
      })
      .select(
        "id, catalog_product_id, sku, name, image_url, unit, unit_cost_minor, currency_code, is_active",
      )
      .single();

    if (error) throw error;
    return mapBusinessProduct(data as BusinessProductRow);
  }
}
