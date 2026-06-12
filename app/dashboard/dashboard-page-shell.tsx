"use client";

import type { ReactNode } from "react";
import { PageSkeleton } from "./page-skeleton";

export function DashboardPageShell({
  children,
  className,
  error,
  isLoading,
  isRefreshing = false,
  skeletonTall = false,
}: {
  children: ReactNode;
  className?: string;
  error?: string;
  isLoading: boolean;
  isRefreshing?: boolean;
  skeletonTall?: boolean;
}) {
  if (error) {
    return (
      <main className={className ?? "dashboard-page"}>
        <div className="empty-state-app">
          <strong>{error}</strong>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className={className ?? "dashboard-page"}>
        <PageSkeleton tall={skeletonTall} />
      </main>
    );
  }

  return (
    <main className={className ?? "dashboard-page"}>
      {isRefreshing ? (
        <div className="dashboard-refresh-indicator" aria-live="polite">
          Updating…
        </div>
      ) : null}
      {children}
    </main>
  );
}
