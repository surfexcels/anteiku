"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import {
  DASHBOARD_BOOTSTRAP_URL,
  DASHBOARD_CACHE,
} from "@/src/lib/client/dashboard-cache-keys";
import { invalidateWasteCaches } from "@/src/lib/client/invalidate-dashboard-caches";
import { notifyWorkspaceChanged } from "@/src/lib/client/workspace-events";
import { formatMoney } from "@/src/lib/format-money";
import { useDashboardBootstrap } from "@/src/lib/client/use-dashboard-bootstrap";
import { WorkspaceLocationSwitcher } from "../workspace-location-switcher";

interface FloorProduct {
  id: string;
  name: string;
  unit: string;
  wastedToday: number;
}

interface FloorRecentLog {
  id: string;
  productName: string;
  quantity: number;
  totalCostMinor: number;
  occurredAt: string;
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
    productCount: number;
  } | null;
  wasteToday: {
    count: number;
    totalQuantity: number;
    totalCostMinor: number;
    byProduct: Record<string, number>;
  };
  recentLogs: FloorRecentLog[];
  products: FloorProduct[];
  permissions: {
    canLogWaste: boolean;
    canCloseStock: boolean;
  };
}

interface ToastState {
  message: string;
  undoLogId?: string;
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

function formatLogTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FloorPageClient({
  signOutAction,
}: {
  signOutAction: () => Promise<void>;
}) {
  const router = useRouter();
  const { data, error, isLoading, refresh } = useDashboardBootstrap<FloorBootstrap>(
    DASHBOARD_CACHE.floor,
    DASHBOARD_BOOTSTRAP_URL.floor,
  );
  const [loggingProductId, setLoggingProductId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [search, setSearch] = useState("");
  const [undoingLogId, setUndoingLogId] = useState<string | null>(null);

  const showToast = useCallback((next: ToastState) => {
    setToast(next);
    window.setTimeout(() => setToast(null), 5000);
  }, []);

  const filteredProducts = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLowerCase();
    if (!query) return data.products;
    return data.products.filter((product) =>
      product.name.toLowerCase().includes(query),
    );
  }, [data, search]);

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

      const payload = (await response.json()) as {
        logs?: Array<{ id: string }>;
      };
      const logId = payload.logs?.[0]?.id;

      showToast({
        message: `Logged 1 ${product.unit} · ${product.name}`,
        undoLogId: logId,
      });
      invalidateWasteCaches();
      await refresh();
      router.refresh();
    } catch {
      showToast({ message: "Could not save — try again" });
    } finally {
      setLoggingProductId(null);
    }
  }

  async function undoLog(logId: string) {
    if (undoingLogId) return;

    setUndoingLogId(logId);
    setToast(null);

    try {
      const response = await fetch(`/api/waste-logs/${logId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Could not undo");
      }

      showToast({ message: "Undone" });
      invalidateWasteCaches();
      await refresh();
      router.refresh();
    } catch {
      showToast({ message: "Could not undo — ask a manager" });
    } finally {
      setUndoingLogId(null);
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
  const stockProgress =
    data.inventoryDay && data.inventoryDay.productCount > 0
      ? Math.min(
          100,
          Math.round(
            (data.inventoryDay.lineCount / data.inventoryDay.productCount) * 100,
          ),
        )
      : 0;

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
          <div className="floor-header-actions">
            <Link className="floor-full-app" href="/dashboard">
              Full app
            </Link>
            <form action={signOutAction}>
              <button className="floor-signout" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>

        <WorkspaceLocationSwitcher
          activeLocationId={data.location.id}
          canManageLocations={
            data.role === "owner" || data.role === "admin"
          }
          locations={data.locations}
          onChanged={async () => {
            await refresh();
            notifyWorkspaceChanged();
          }}
          variant="floor"
        />

        <div className="floor-status-row">
          <div className={`floor-status-pill tone-${status.tone}`}>
            <span>Today&apos;s stock</span>
            <strong>{status.label}</strong>
            {data.inventoryDay && data.inventoryDay.status !== "closed" ? (
              <small>
                {data.inventoryDay.lineCount}/{data.inventoryDay.productCount}{" "}
                lines · {stockProgress}%
              </small>
            ) : null}
          </div>
          <div className="floor-status-pill tone-waste">
            <span>Waste here today</span>
            <strong>
              {data.wasteToday.totalQuantity} units ·{" "}
              {formatMoney(data.wasteToday.totalCostMinor, data.currencyCode)}
            </strong>
            <small>{data.wasteToday.count} entries at this site</small>
          </div>
        </div>

        {data.inventoryDay?.status !== "closed" ? (
          <Link className="floor-stock-link" href="/dashboard/inventory">
            {data.inventoryDay ? "Continue daily stock" : "Start daily stock"}
          </Link>
        ) : null}
      </header>

      {data.recentLogs.length > 0 ? (
        <section className="floor-section floor-recent">
          <div className="floor-section-head">
            <h2>Recent today</h2>
            <p>Last entries at this location.</p>
          </div>
          <ul className="floor-recent-list">
            {data.recentLogs.map((log) => (
              <li key={log.id}>
                <div>
                  <strong>{log.productName}</strong>
                  <span>
                    {log.quantity} · {formatLogTime(log.occurredAt)}
                  </span>
                </div>
                <em>
                  {formatMoney(log.totalCostMinor, data.currencyCode)}
                </em>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="floor-section">
        <div className="floor-section-head">
          <h2>Quick waste</h2>
          <p>Tap a product to log 1 unit instantly.</p>
        </div>

        {data.products.length > 6 ? (
          <label className="floor-search">
            <span className="sr-only">Search products</span>
            <input
              autoCapitalize="off"
              autoComplete="off"
              enterKeyHint="search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search menu…"
              type="search"
              value={search}
            />
          </label>
        ) : null}

        {data.products.length === 0 ? (
          <div className="floor-empty">
            <p>No active products yet.</p>
            <Link className="floor-link-btn" href="/dashboard/products">
              Add products
            </Link>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="floor-empty">
            <p>No products match &ldquo;{search.trim()}&rdquo;.</p>
          </div>
        ) : (
          <div className="floor-product-grid">
            {filteredProducts.map((product) => {
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
                    Tap · 1 {product.unit}
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

      {toast ? (
        <div className="floor-toast">
          <span>{toast.message}</span>
          {toast.undoLogId ? (
            <button
              disabled={undoingLogId === toast.undoLogId}
              onClick={() => void undoLog(toast.undoLogId!)}
              type="button"
            >
              Undo
            </button>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
