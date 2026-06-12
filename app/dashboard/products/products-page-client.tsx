"use client";

import {
  DASHBOARD_BOOTSTRAP_URL,
  DASHBOARD_CACHE,
} from "@/src/lib/client/dashboard-cache-keys";
import { useDashboardBootstrap } from "@/src/lib/client/use-dashboard-bootstrap";
import type { BusinessProduct } from "@/src/modules/catalog/domain/catalog-product";
import { DashboardPageShell } from "../dashboard-page-shell";
import { PageHeaderStats } from "../page-header-stats";
import { ProductCatalog } from "./product-catalog";

interface ProductsBootstrap {
  countryCode: string;
  currencyCode: string;
  products: BusinessProduct[];
}

export function ProductsPageClient() {
  const { data, error, isLoading, isRefreshing } =
    useDashboardBootstrap<ProductsBootstrap>(
      DASHBOARD_CACHE.products,
      DASHBOARD_BOOTSTRAP_URL.products,
    );

  const activeCount = data?.products.filter((product) => product.isActive).length ?? 0;

  return (
    <DashboardPageShell
      className="products-page dashboard-page-wide"
      error={error}
      isLoading={isLoading || !data}
      isRefreshing={isRefreshing}
      skeletonTall
    >
      {data ? (
        <>
          <header className="app-page-header">
            <div>
              <span className="app-kicker">Product setup</span>
              <h1>Build your cafe menu.</h1>
              <p>
                Search the bundled European food catalog, choose an item, and set
                what one unit costs your business.
              </p>
            </div>
            <PageHeaderStats
              items={[
                { label: "Menu items", value: data.products.length },
                { label: "Active", value: activeCount, tone: "positive" },
                { label: "Currency", value: data.currencyCode, compact: true },
              ]}
            />
          </header>

          <ProductCatalog
            countryCode={data.countryCode}
            currencyCode={data.currencyCode}
            initialProducts={data.products}
          />
        </>
      ) : null}
    </DashboardPageShell>
  );
}
