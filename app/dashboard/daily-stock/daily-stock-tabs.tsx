"use client";

import Link from "next/link";

export type DailyStockTab = "opening" | "waste" | "closing" | "summary";

const TAB_META: Array<{
  id: DailyStockTab;
  label: string;
  hint: string;
  step: string;
}> = [
  {
    id: "opening",
    label: "Opening",
    hint: "Start of day",
    step: "1",
  },
  {
    id: "waste",
    label: "Log waste",
    hint: "Today's counts",
    step: "2",
  },
  {
    id: "closing",
    label: "Closing",
    hint: "End of day",
    step: "3",
  },
  {
    id: "summary",
    label: "Summary",
    hint: "Reconcile & handoff",
    step: "4",
  },
];

function inventoryHref(stockDate: string, tab: DailyStockTab) {
  return `/dashboard/inventory?date=${stockDate}&tab=${tab}`;
}

export function DailyStockTabs({
  activeTab,
  stockDate,
  dayStatus,
  onTabChange,
}: {
  activeTab: DailyStockTab;
  stockDate: string;
  dayStatus: "open" | "closed" | null;
  onTabChange?: (tab: DailyStockTab) => void;
}) {
  const isInteractive = Boolean(onTabChange);

  return (
    <div className="daily-stock-tabs-row">
      <div className="daily-stock-tabs" role="tablist">
        {TAB_META.map((tab) => {
          const disabled =
            isInteractive &&
            (tab.id === "closing" || tab.id === "summary") &&
            !dayStatus;
          const href = inventoryHref(stockDate, tab.id);

          const className = [
            activeTab === tab.id ? "active" : "",
            disabled ? "disabled" : "",
          ]
            .filter(Boolean)
            .join(" ") || undefined;

          const content = (
            <>
              <span className="daily-stock-tab-step">{tab.step}</span>
              <span>
                <strong>{tab.label}</strong>
                <small>{tab.hint}</small>
              </span>
            </>
          );

          if (isInteractive) {
            return (
              <button
                aria-selected={activeTab === tab.id}
                className={className}
                disabled={disabled}
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                role="tab"
                type="button"
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={className}
              href={disabled ? inventoryHref(stockDate, "opening") : href}
              key={tab.id}
              prefetch
              role="tab"
            >
              {content}
            </Link>
          );
        })}
      </div>
      <p className="daily-stock-flow-hint">
        Closing stock becomes the next day&apos;s opening when you carry forward.
      </p>
    </div>
  );
}

export function parseDailyStockTab(value: string | null): DailyStockTab | null {
  if (
    value === "opening" ||
    value === "waste" ||
    value === "closing" ||
    value === "summary"
  ) {
    return value;
  }
  return null;
}

export function defaultDailyStockTab(
  dayStatus: "open" | "closed" | null,
): DailyStockTab {
  if (!dayStatus) return "opening";
  if (dayStatus === "closed") return "summary";
  return "waste";
}
