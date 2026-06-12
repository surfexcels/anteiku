import {
  DASHBOARD_BOOTSTRAP_URL,
  DASHBOARD_CACHE,
  overviewBootstrapUrl,
  overviewCacheKey,
  sustainabilityBootstrapUrl,
  sustainabilityCacheKey,
} from "@/src/lib/client/dashboard-cache-keys";
import {
  invalidateCachedData,
  invalidateCachedDataByPrefix,
} from "@/src/lib/client/request-cache";
import { prefetchDashboardBootstrap } from "@/src/lib/client/use-dashboard-bootstrap";

function warmOverview() {
  prefetchDashboardBootstrap(overviewBootstrapUrl(7), overviewCacheKey(7));
  prefetchDashboardBootstrap(overviewBootstrapUrl(30), overviewCacheKey(30));
}

function warmSustainability() {
  prefetchDashboardBootstrap(sustainabilityBootstrapUrl(7), sustainabilityCacheKey(7));
  prefetchDashboardBootstrap(sustainabilityBootstrapUrl(30), sustainabilityCacheKey(30));
}

function invalidateSustainabilityCaches() {
  invalidateCachedData(sustainabilityCacheKey(7));
  invalidateCachedData(sustainabilityCacheKey(30));
}

function warmWaste() {
  prefetchDashboardBootstrap(
    DASHBOARD_BOOTSTRAP_URL.waste,
    DASHBOARD_CACHE.waste,
  );
}

export function invalidateProductCaches() {
  invalidateCachedData(DASHBOARD_CACHE.products);
  invalidateCachedData(DASHBOARD_CACHE.waste);
  invalidateCachedData(overviewCacheKey(7));
  invalidateCachedData(overviewCacheKey(30));
  invalidateSustainabilityCaches();
  warmWaste();
  warmOverview();
  warmSustainability();
}

export function invalidateWasteCaches() {
  invalidateCachedData(DASHBOARD_CACHE.waste);
  invalidateCachedData(DASHBOARD_CACHE.floor);
  invalidateCachedData(DASHBOARD_CACHE.inventory);
  invalidateCachedData(overviewCacheKey(7));
  invalidateCachedData(overviewCacheKey(30));
  invalidateSustainabilityCaches();
  invalidateCachedData(DASHBOARD_CACHE.insights);
  invalidateCachedData(DASHBOARD_CACHE.reports);
  warmWaste();
  warmOverview();
  warmSustainability();
}

export function invalidateInsightsCaches() {
  invalidateCachedData(DASHBOARD_CACHE.insights);
  invalidateCachedData(overviewCacheKey(7));
  invalidateCachedData(overviewCacheKey(30));
  warmOverview();
}

export function invalidateReportsCaches() {
  invalidateCachedData(DASHBOARD_CACHE.reports);
}

export function invalidateImportsCaches() {
  invalidateCachedData(DASHBOARD_CACHE.imports);
}

export function invalidateInventoryCaches(stockDate?: string) {
  invalidateCachedData(DASHBOARD_CACHE.inventory);
  if (stockDate) {
    invalidateCachedData(`${DASHBOARD_CACHE.inventory}:${stockDate}`);
  }
}

export function invalidateWorkspaceCaches() {
  for (const key of Object.values(DASHBOARD_CACHE)) {
    invalidateCachedDataByPrefix(key);
  }
}
