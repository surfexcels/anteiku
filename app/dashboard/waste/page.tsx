import { Suspense } from "react";
import { WastePageClient } from "./waste-page-client";
import { PageSkeleton } from "../page-skeleton";

export default function WastePage() {
  return (
    <Suspense
      fallback={
        <main className="dashboard-overview">
          <PageSkeleton tall />
        </main>
      }
    >
      <WastePageClient />
    </Suspense>
  );
}
