import { invalidateServerCache } from "@/src/lib/cache/server-cache";

export async function invalidateBusinessDashboardCache(businessId: string) {
  await invalidateServerCache(`overview:${businessId}:7`);
  await invalidateServerCache(`overview:${businessId}:30`);
  await invalidateServerCache(`sustainability:${businessId}:7`);
  await invalidateServerCache(`sustainability:${businessId}:30`);
}
