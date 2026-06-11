export const DASHBOARD_CACHE = {
  business: "dashboard-business",
  overview: "dashboard-overview",
  products: "dashboard-products",
  waste: "dashboard-waste",
  insights: "dashboard-insights",
  reports: "dashboard-reports",
  imports: "dashboard-imports",
  inventory: "dashboard-inventory",
  sustainability: "dashboard-sustainability",
} as const;

export function overviewCacheKey(days = 7) {
  return `${DASHBOARD_CACHE.overview}:${days}`;
}

export function overviewBootstrapUrl(days = 7) {
  return `/api/dashboard/overview?days=${days}`;
}

export function sustainabilityCacheKey(days = 7) {
  return `${DASHBOARD_CACHE.sustainability}:${days}`;
}

export function sustainabilityBootstrapUrl(days = 7) {
  return `/api/dashboard/sustainability?days=${days}`;
}

export const DASHBOARD_BOOTSTRAP_URL = {
  business: "/api/business/context",
  overview: overviewBootstrapUrl(7),
  products: "/api/dashboard/products",
  waste: "/api/waste/bootstrap",
  insights: "/api/dashboard/insights",
  reports: "/api/dashboard/reports",
  imports: "/api/dashboard/imports",
  inventory: "/api/dashboard/inventory",
  sustainability: sustainabilityBootstrapUrl(7),
} as const;

export function inventoryCacheKey(date?: string) {
  return date
    ? `${DASHBOARD_CACHE.inventory}:${date}`
    : DASHBOARD_CACHE.inventory;
}

export function inventoryBootstrapUrl(date?: string) {
  return date
    ? `/api/dashboard/inventory?date=${date}`
    : DASHBOARD_BOOTSTRAP_URL.inventory;
}

export function bootstrapUrlForPath(pathname: string) {
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return overviewBootstrapUrl(7);
  }
  if (pathname.startsWith("/dashboard/products")) {
    return DASHBOARD_BOOTSTRAP_URL.products;
  }
  if (pathname.startsWith("/dashboard/waste")) {
    return DASHBOARD_BOOTSTRAP_URL.waste;
  }
  if (pathname.startsWith("/dashboard/insights")) {
    return DASHBOARD_BOOTSTRAP_URL.insights;
  }
  if (pathname.startsWith("/dashboard/reports")) {
    return DASHBOARD_BOOTSTRAP_URL.reports;
  }
  if (pathname.startsWith("/dashboard/imports")) {
    return DASHBOARD_BOOTSTRAP_URL.imports;
  }
  if (pathname.startsWith("/dashboard/inventory")) {
    return DASHBOARD_BOOTSTRAP_URL.inventory;
  }
  if (pathname.startsWith("/dashboard/sustainability")) {
    return sustainabilityBootstrapUrl(7);
  }
  return null;
}
