import { Suspense } from "react";
import { InventoryPageClient } from "./inventory-page-client";
import { PageSkeleton } from "../page-skeleton";

export default function InventoryPage() {
  return (
    <Suspense
      fallback={
        <main className="dashboard-overview">
          <PageSkeleton tall />
        </main>
      }
    >
      <InventoryPageClient />
    </Suspense>
  );
}
