import Link from "next/link";
import type { OverviewAlert } from "@/src/modules/waste/domain/waste";

export function OverviewAlerts({ alerts }: { alerts: OverviewAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <section className="overview-alerts" aria-label="Action items">
      {alerts.map((alert) => (
        <article className={`overview-alert ${alert.severity}`} key={alert.id}>
          <div>
            <strong>{alert.title}</strong>
            <p>{alert.message}</p>
          </div>
          {alert.href && alert.actionLabel ? (
            <Link className="button ghost small" href={alert.href} prefetch>
              {alert.actionLabel}
            </Link>
          ) : null}
        </article>
      ))}
    </section>
  );
}
