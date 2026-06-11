import type { ReactNode } from "react";

export type PageHeaderStatTone =
  | "default"
  | "positive"
  | "active"
  | "muted"
  | "negative";

export type PageHeaderStat = {
  label: string;
  value: ReactNode;
  tone?: PageHeaderStatTone;
  compact?: boolean;
};

export function PageHeaderStats({ items }: { items: PageHeaderStat[] }) {
  return (
    <div className="page-header-stats">
      {items.map((item) => (
        <div className="page-header-stat" key={item.label}>
          <span>{item.label}</span>
          <strong
            className={[
              item.tone ? `tone-${item.tone}` : undefined,
              item.compact ? "is-compact" : undefined,
            ]
              .filter(Boolean)
              .join(" ") || undefined}
          >
            {item.tone === "positive" || item.tone === "active" ? (
              <em className={`page-header-stat-dot tone-${item.tone}`} aria-hidden />
            ) : null}
            {item.value}
          </strong>
        </div>
      ))}
    </div>
  );
}

export function formatHeaderDate(stockDate: string) {
  return new Date(`${stockDate}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
