import {
  invalidateServerCache,
  invalidateServerCachePrefix,
} from "@/src/lib/cache/server-cache";

export async function invalidateBusinessDashboardCache(businessId: string) {
  await invalidateServerCachePrefix(`overview:${businessId}:`);
  await invalidateServerCachePrefix(`sustainability:${businessId}:`);
}
