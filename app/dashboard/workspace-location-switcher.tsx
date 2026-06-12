"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  canManageLocations = false,
}: {
  activeLocationId: string;
  locations: WorkspaceLocation[];
  onChanged?: () => void | Promise<void>;
  variant?: "sidebar" | "floor" | "bar";
  canManageLocations?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  if (locations.length === 0) return null;

  const hasMultiple = locations.length > 1;
  const activeLocation =
    locations.find((location) => location.id === activeLocationId) ?? locations[0];

  async function handleChange(nextLocationId: string) {
    if (!hasMultiple || nextLocationId === activeLocationId || pending) return;

    setPending(true);
    setError("");

    try {
      const response = await fetch("/api/business/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId: nextLocationId }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "Could not switch location",
        );
      }

      invalidateWorkspaceCaches();
      await onChanged?.();
      router.refresh();
    } catch (switchError) {
      setError(
        switchError instanceof Error
          ? switchError.message
          : "Could not switch location",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className={
        variant === "floor"
          ? "workspace-location-switcher floor"
          : variant === "bar"
            ? "workspace-location-switcher bar"
            : "workspace-location-switcher"
      }
    >
      <label>
        <span>Active location</span>
        {hasMultiple ? (
          <select
            aria-label="Switch location"
            disabled={pending}
            onChange={(event) => void handleChange(event.target.value)}
            value={activeLocation.id}
          >
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="workspace-location-current">{activeLocation.name}</div>
        )}
      </label>
      {pending ? <small className="workspace-location-status">Switching…</small> : null}
      {error ? (
        <small className="workspace-location-error">{error}</small>
      ) : null}
      {!hasMultiple && canManageLocations ? (
        <Link className="workspace-location-manage" href="/dashboard/settings">
          Add another site
        </Link>
      ) : null}
    </div>
  );
}
