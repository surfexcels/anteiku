import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AddBusinessProductInput,
  AddCustomBusinessProductInput,
  CatalogRepository,
  UpdateBusinessProductInput,
} from "@/src/modules/catalog/application/catalog-repository";
import type {
  BusinessProduct,
  Co2eSource,
  ProductUnit,
} from "@/src/modules/catalog/domain/catalog-product";
import { benchmarkCo2eForCatalogSource } from "@/src/modules/sustainability/application/resolve-product-co2e";

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
  unit_co2e_g: number | null;
  co2e_source: Co2eSource;
  co2e_methodology: string | null;
}

const PRODUCT_SELECT =
  "id, catalog_product_id, sku, name, image_url, unit, unit_cost_minor, currency_code, is_active, unit_co2e_g, co2e_source, co2e_methodology";

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
    unitCo2eG: row.unit_co2e_g,
    co2eSource: row.co2e_source ?? "benchmark",
    co2eMethodology: row.co2e_methodology,
  };
}

export class SupabaseCatalogRepository implements CatalogRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listBusinessProducts(businessId: string): Promise<BusinessProduct[]> {
    const { data, error } = await this.client
      .from("business_products")
      .select(PRODUCT_SELECT)
      .eq("business_id", businessId)
      .order("name");

    if (error) throw error;
    return ((data ?? []) as BusinessProductRow[]).map(mapBusinessProduct);
  }

  async listBusinessProductsForLocation(
    businessId: string,
    locationId: string,
  ): Promise<BusinessProduct[]> {
    const { data, error } = await this.client
      .from("location_products")
      .select(`business_products!inner(${PRODUCT_SELECT})`)
      .eq("business_id", businessId)
      .eq("location_id", locationId)
      .order("business_product_id");

    if (error) throw error;

    return ((data ?? []) as Array<{
      business_products: BusinessProductRow | BusinessProductRow[] | null;
    }>)
      .map((row) => {
        const related = row.business_products;
        const product = Array.isArray(related) ? related[0] ?? null : related;
        return product ? mapBusinessProduct(product) : null;
      })
      .filter((product): product is BusinessProduct => Boolean(product?.isActive))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  async assignProductToLocation(
    businessId: string,
    locationId: string,
    productId: string,
  ): Promise<void> {
    const { error } = await this.client.from("location_products").upsert(
      {
        business_id: businessId,
        location_id: locationId,
        business_product_id: productId,
      },
      { onConflict: "location_id,business_product_id" },
    );

    if (error) throw error;
  }

  async isProductAtLocation(
    businessId: string,
    locationId: string,
    productId: string,
  ): Promise<boolean> {
    const { data, error } = await this.client
      .from("location_products")
      .select("business_product_id")
      .eq("business_id", businessId)
      .eq("location_id", locationId)
      .eq("business_product_id", productId)
      .maybeSingle();

    if (error) throw error;
    return Boolean(data);
  }

  private async getBusinessProductBySource(
    businessId: string,
    catalogSourceId: string,
  ): Promise<BusinessProduct | null> {
    const { data, error } = await this.client
      .from("business_products")
      .select(PRODUCT_SELECT)
      .eq("business_id", businessId)
      .eq("sku", catalogSourceId)
      .maybeSingle();

    if (error) throw error;
    return data ? mapBusinessProduct(data as BusinessProductRow) : null;
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
    const existing = await this.getBusinessProductBySource(
      input.businessId,
      input.catalogSourceId,
    );
    if (existing) {
      await this.assignProductToLocation(
        input.businessId,
        input.locationId,
        existing.id,
      );
      return existing;
    }

    const benchmark = benchmarkCo2eForCatalogSource(
      input.catalogSourceId,
      input.unit,
    );

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
        unit_co2e_g: input.unitCo2eG ?? benchmark.unitCo2eG,
        co2e_source: input.co2eSource ?? benchmark.source,
        co2e_methodology: input.co2eMethodology ?? benchmark.methodology,
        co2e_updated_at: new Date().toISOString(),
        created_by: input.userId,
      })
      .select(PRODUCT_SELECT)
      .single();

    if (error) throw error;
    const product = mapBusinessProduct(data as BusinessProductRow);
    await this.assignProductToLocation(
      input.businessId,
      input.locationId,
      product.id,
    );
    return product;
  }

  async addCustomBusinessProduct(
    input: AddCustomBusinessProductInput,
  ): Promise<BusinessProduct> {
    const benchmark = benchmarkCo2eForCatalogSource(null, input.unit);

    const { data, error } = await this.client
      .from("business_products")
      .insert({
        business_id: input.businessId,
        catalog_product_id: null,
        sku: null,
        name: input.name,
        image_url: null,
        unit: input.unit,
        unit_cost_minor: input.unitCostMinor,
        currency_code: input.currencyCode,
        unit_co2e_g: input.unitCo2eG ?? benchmark.unitCo2eG,
        co2e_source: input.co2eSource ?? benchmark.source,
        co2e_methodology: input.co2eMethodology ?? benchmark.methodology,
        co2e_updated_at: new Date().toISOString(),
        created_by: input.userId,
      })
      .select(PRODUCT_SELECT)
      .single();

    if (error) throw error;
    const product = mapBusinessProduct(data as BusinessProductRow);
    await this.assignProductToLocation(
      input.businessId,
      input.locationId,
      product.id,
    );
    return product;
  }

  async updateBusinessProduct(
    input: UpdateBusinessProductInput,
  ): Promise<BusinessProduct> {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.unit !== undefined) patch.unit = input.unit;
    if (input.unitCostMinor !== undefined) {
      patch.unit_cost_minor = input.unitCostMinor;
    }
    if (input.isActive !== undefined) patch.is_active = input.isActive;
    if (input.unitCo2eG !== undefined) {
      patch.unit_co2e_g = input.unitCo2eG;
      patch.co2e_updated_at = new Date().toISOString();
    }
    if (input.co2eSource !== undefined) patch.co2e_source = input.co2eSource;
    if (input.co2eMethodology !== undefined) {
      patch.co2e_methodology = input.co2eMethodology;
    }

    const { data, error } = await this.client
      .from("business_products")
      .update(patch)
      .eq("business_id", input.businessId)
      .eq("id", input.productId)
      .select(PRODUCT_SELECT)
      .single();

    if (error) throw error;
    return mapBusinessProduct(data as BusinessProductRow);
  }
}
