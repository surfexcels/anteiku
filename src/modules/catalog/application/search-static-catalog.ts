import {
  EUROPEAN_FOOD_CATALOG,
  type EuropeanFoodEntry,
} from "@/src/data/european-food-catalog";
import type { CatalogProduct } from "@/src/modules/catalog/domain/catalog-product";
import type { SearchCatalogInput } from "@/src/modules/catalog/application/catalog-repository";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function thumbnailUrl(name: string, category?: string | null) {
  const params = new URLSearchParams({ name });
  if (category) params.set("category", category);
  return `/api/catalog/thumbnail?${params.toString()}`;
}

function isAvailableInCountry(product: EuropeanFoodEntry, countryCode?: string) {
  if (!countryCode) return true;
  if (product.availableCountryCodes.length === 0) return true;
  return product.availableCountryCodes.includes(countryCode.toUpperCase());
}

function scoreProduct(product: EuropeanFoodEntry, term: string) {
  const name = normalizeText(product.name);
  const haystack = normalizeText(
    [product.name, product.description, ...product.aliases].join(" "),
  );

  if (!term) return 1;

  if (name === term) return 100;
  if (name.startsWith(term)) return 80;
  if (product.aliases.some((alias) => normalizeText(alias).startsWith(term))) {
    return 70;
  }
  if (haystack.includes(term)) return 50;
  return 0;
}

function mapProduct(product: EuropeanFoodEntry, rank: number): CatalogProduct {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    unit: product.unit,
    imageUrl: thumbnailUrl(product.name, product.category),
    category: product.category,
    originCountryCodes: product.originCountryCodes,
    rank,
  };
}

export function searchStaticCatalog(input: SearchCatalogInput): CatalogProduct[] {
  const term = normalizeText(input.query);
  const limit = input.limit ?? 12;
  const countryCode = input.countryCode?.toUpperCase();

  const candidates = EUROPEAN_FOOD_CATALOG.filter((product) =>
    isAvailableInCountry(product, countryCode),
  );

  const ranked = candidates
    .map((product) => ({
      product,
      rank: scoreProduct(product, term),
    }))
    .filter((entry) => entry.rank > 0)
    .sort((left, right) => {
      if (right.rank !== left.rank) return right.rank - left.rank;
      return left.product.name.localeCompare(right.product.name);
    })
    .slice(0, limit);

  return ranked.map((entry) => mapProduct(entry.product, entry.rank));
}
