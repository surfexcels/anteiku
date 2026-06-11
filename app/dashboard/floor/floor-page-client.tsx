"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  DASHBOARD_BOOTSTRAP_URL,
  DASHBOARD_CACHE,
} from "@/src/lib/client/dashboard-cache-keys";
import { invalidateWasteCaches } from "@/src/lib/client/invalidate-dashboard-caches";
import { formatMoney } from "@/src/lib/format-money";
import { useDashboardBootstrap } from "@/src/lib/client/use-dashboard-bootstrap";
import { WorkspaceLocationSwitcher } from "../workspace-location-switcher";

interface FloorProduct {
  id: string;
  name: string;
  unit: string;
  wastedToday: number;
}

interface FloorBootstrap {
  stockDate: string;
  businessName: string;
  currencyCode: string;
  role: string;
  location: { id: string; name: string };
  locations: Array<{ id: string; name: string }>;
  inventoryDay: {
    id: string;
    status: "open" | "closed";
    lineCount: number;
  } | null;
  wasteToday: {
    count: number;
    totalCostMinor: number;
    byProduct: Record<string, number>;
  };
  products: FloorProduct[];
  permissions: {
    canLogWaste: boolean;
    canCloseStock: boolean;
  };
}

function stockStatusLabel(day: FloorBootstrap["inventoryDay"]) {
  if (!day) return { label: "Not started", tone: "pending" as const };
  if (day.status === "closed") return { label: "Closed", tone: "closed" as const };
  return { label: "In progress", tone: "open" as const };
}

function formatStockDate(stockDate: string) {
  const date = new Date(`${stockDate}T12:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function FloorPageClient() {
  const router = useRouter();
  const { data, error, isLoading, refresh } = useDashboardBootstrap<FloorBootstrap>(
    DASHBOARD_CACHE.floor,
    DASHBOARD_BOOTSTRAP_URL.floor,
  );
  const [loggingProductId, setLoggingProductId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  async function logWaste(product: FloorProduct) {
    if (!data?.permissions.canLogWaste || loggingProductId) return;

    setLoggingProductId(product.id);

    try {
      const response = await fetch("/api/waste-logs/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: [{ businessProductId: product.id, quantity: 1 }],
        }),
      });

      if (!response.ok) {
        throw new Error("Could not log waste");
      }

      showToast(`Logged 1 ${product.unit} · ${product.name}`);
      invalidateWasteCaches();
      await refresh();
      router.refresh();
    } catch {
      showToast("Could not save — try again");
    } finally {
      setLoggingProductId(null);
    }
  }

  if (error) {
    return (
      <main className="floor-page">
        <div className="floor-empty">
          <strong>{error}</strong>
          <button
            className="floor-link-btn"
            onClick={() => {
              void refresh();
            }}
            type="button"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  if (isLoading || !data) {
    return (
      <main className="floor-page">
        <div className="floor-skeleton" aria-hidden />
      </main>
    );
  }

  const status = stockStatusLabel(data.inventoryDay);

  return (
    <main className="floor-page">
      <header className="floor-header">
        <div className="floor-header-top">
          <div>
            <p className="floor-kicker">Floor mode</p>
            <h1>{data.location?.name ?? "Your site"}</h1>
            <p className="floor-subtitle">
              {formatStockDate(data.stockDate)} · {data.businessName}
            </p>
          </div>
          <Link className="floor-full-app" href="/dashboard">
            Full app
          </Link>
        </div>

        {data.locations.length > 1 ? (
          <WorkspaceLocationSwitcher
            activeLocationId={data.location.id}
            locations={data.locations}
            onChanged={async () => {
              await refresh();
              router.refresh();
            }}
            variant="floor"
          />
        ) : null}

        <div className="floor-status-row">
          <div className={`floor-status-pill tone-${status.tone}`}>
            <span>Today&apos;s stock</span>
            <strong>{status.label}</strong>
          </div>
          <div className="floor-status-pill tone-waste">
            <span>Waste today</span>
            <strong>
              {data.wasteToday.count} ·{" "}
              {formatMoney(data.wasteToday.totalCostMinor, data.currencyCode)}
            </strong>
          </div>
        </div>

        {data.inventoryDay?.status !== "closed" ? (
          <Link className="floor-stock-link" href="/dashboard/inventory">
            {data.inventoryDay ? "Continue daily stock" : "Start daily stock"}
          </Link>
        ) : null}
      </header>

      <section className="floor-section">
        <div className="floor-section-head">
          <h2>Quick waste</h2>
          <p>Tap a product to log 1 unit instantly.</p>
        </div>

        {data.products.length === 0 ? (
          <div className="floor-empty">
            <p>No active products yet.</p>
            <Link className="floor-link-btn" href="/dashboard/products">
              Add products
            </Link>
          </div>
        ) : (
          <div className="floor-product-grid">
            {data.products.map((product) => {
              const isLogging = loggingProductId === product.id;
              const wastedToday =
                data.wasteToday.byProduct[product.id] ?? product.wastedToday;

              return (
                <button
                  className="floor-product-btn"
                  disabled={!data.permissions.canLogWaste || isLogging}
                  key={product.id}
                  onClick={() => logWaste(product)}
                  type="button"
                >
                  <span className="floor-product-name">{product.name}</span>
                  <span className="floor-product-meta">
                    1 {product.unit}
                    {wastedToday > 0 ? (
                      <em className="floor-product-count">{wastedToday} today</em>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {toast ? <div className="floor-toast">{toast}</div> : null}
    </main>
  );
}
