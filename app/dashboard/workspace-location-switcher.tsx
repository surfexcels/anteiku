"use client";

import Link from "next/link";
import { useState } from "react";
interface WorkspaceLocation {
  id: string;
  name: string;
}

function LocationPinIcon() {
  return (
    <svg
      aria-hidden
      fill="none"
      height="13"
      viewBox="0 0 24 24"
      width="13"
    >
      <path
        d="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <circle cx="12" cy="11" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      aria-hidden
      className="workspace-location-chevron"
      fill="none"
      height="11"
      viewBox="0 0 24 24"
      width="11"
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  );
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
  variant?: "sidebar" | "floor" | "bar" | "compact";
  canManageLocations?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  if (locations.length === 0) return null;

  const hasMultiple = locations.length > 1;
  const activeLocation =
    locations.find((location) => location.id === activeLocationId) ?? locations[0];
  const isPill = variant === "compact" || variant === "floor";

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

      await onChanged?.();
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

  const className = [
    "workspace-location-switcher",
    variant === "floor"
      ? "floor"
      : variant === "bar"
        ? "bar"
        : variant === "compact"
          ? "compact"
          : "",
  ]
    .filter(Boolean)
    .join(" ");

  const locationValue = hasMultiple ? (
  <>
    <select
      aria-label="Switch location"
      className="workspace-location-select"
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
    {isPill ? <ChevronDownIcon /> : null}
  </>
) : (
  <span className="workspace-location-value">{activeLocation.name}</span>
);

  return (
    <div className={className}>
      {isPill ? (
        <div
          className="workspace-location-control"
          data-pending={pending ? "" : undefined}
        >
          <span aria-hidden className="workspace-location-pin-wrap">
            <LocationPinIcon />
          </span>
          {locationValue}
        </div>
      ) : (
        <label className="workspace-location-field">
          <span className="workspace-location-field-label">Active location</span>
          {locationValue}
        </label>
      )}
      {pending ? <small className="workspace-location-status">Switching…</small> : null}
      {error ? (
        <small className="workspace-location-error">{error}</small>
      ) : null}
      {!hasMultiple && canManageLocations ? (
        <Link className="workspace-location-manage" href="/dashboard/settings">
          {variant === "compact" ? "Add site" : "Add another site"}
        </Link>
      ) : null}
    </div>
  );
}
