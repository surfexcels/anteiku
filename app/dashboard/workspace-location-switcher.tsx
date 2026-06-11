"use client";

import { useState } from "react";
import { invalidateWorkspaceCaches } from "@/src/lib/client/invalidate-dashboard-caches";

interface WorkspaceLocation {
  id: string;
  name: string;
}

export function WorkspaceLocationSwitcher({
  activeLocationId,
  locations,
  onChanged,
  variant = "sidebar",
}: {
  activeLocationId: string;
  locations: WorkspaceLocation[];
  onChanged?: () => void;
  variant?: "sidebar" | "floor" | "bar";
}) {
  const [pending, setPending] = useState(false);

  if (locations.length <= 1) return null;

  async function handleChange(nextLocationId: string) {
    if (nextLocationId === activeLocationId || pending) return;

    setPending(true);
    try {
      const response = await fetch("/api/business/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId: nextLocationId }),
      });

      if (!response.ok) {
        throw new Error("Could not switch location");
      }

      invalidateWorkspaceCaches();
      onChanged?.();
    } catch {
      // Keep current selection on failure.
    } finally {
      setPending(false);
    }
  }

  return (
    <label
      className={
        variant === "floor"
          ? "workspace-location-switcher floor"
          : variant === "bar"
            ? "workspace-location-switcher bar"
            : "workspace-location-switcher"
      }
    >
      <span>Location</span>
      <select
        disabled={pending}
        onChange={(event) => handleChange(event.target.value)}
        value={activeLocationId}
      >
        {locations.map((location) => (
          <option key={location.id} value={location.id}>
            {location.name}
          </option>
        ))}
      </select>
    </label>
  );
}
