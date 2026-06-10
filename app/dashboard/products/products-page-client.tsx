"use client";

import {
  DASHBOARD_BOOTSTRAP_URL,
  DASHBOARD_CACHE,
} from "@/src/lib/client/dashboard-cache-keys";
import { useDashboardBootstrap } from "@/src/lib/client/use-dashboard-bootstrap";
import type { BusinessProduct } from "@/src/modules/catalog/domain/catalog-product";
import { PageSkeleton } from "../page-skeleton";
import { ProductCatalog } from "./product-catalog";

interface ProductsBootstrap {
  countryCode: string;
  currencyCode: string;
  products: BusinessProduct[];
}

export function ProductsPageClient() {
  const { data, error, isLoading } = useDashboardBootstrap<ProductsBootstrap>(
    DASHBOARD_CACHE.products,
    DASHBOARD_BOOTSTRAP_URL.products,
  );

  if (error) {
    return (
      <main className="products-page">
        <div className="empty-state-app">
          <strong>{error}</strong>
        </div>
      </main>
    );
  }

  if (isLoading || !data) {
    return (
      <main className="products-page">
        <PageSkeleton tall />
      </main>
    );
  }

  return (
    <main className="products-page">
      <header className="app-page-header">
        <div>
          <span className="app-kicker">PRODUCT SETUP</span>
          <h1>Build your cafe menu.</h1>
          <p>
            Search the bundled European food catalog, choose an item, and set what
            one unit costs your business.
          </p>
        </div>
        <div className="menu-count">
          <strong>{data.products.length}</strong>
          <span>menu items</span>
        </div>
      </header>

      <ProductCatalog
        countryCode={data.countryCode}
        currencyCode={data.currencyCode}
        initialProducts={data.products}
      />
    </main>
  );
}
