"use client";

import { useState } from "react";
import {
  DASHBOARD_BOOTSTRAP_URL,
  DASHBOARD_CACHE,
} from "@/src/lib/client/dashboard-cache-keys";
import { invalidateWorkspaceCaches } from "@/src/lib/client/invalidate-dashboard-caches";
import { useDashboardBootstrap } from "@/src/lib/client/use-dashboard-bootstrap";
import { PageSkeleton } from "../page-skeleton";

interface SettingsLocation {
  id: string;
  name: string;
  countryCode: string;
  timezone: string;
  isActive: boolean;
  createdAt: string;
}

interface SettingsMember {
  id: string;
  userId: string;
  fullName: string | null;
  role: string;
  isActive: boolean;
}

interface SettingsBootstrap {
  business: {
    id: string;
    name: string;
    countryCode: string;
    currencyCode: string;
    timezone: string;
    role: string;
  };
  activeLocationId: string;
  locations: SettingsLocation[];
  members: SettingsMember[];
  permissions: {
    canManageLocations: boolean;
    canManageTeam: boolean;
    canManageBusinessProfile: boolean;
  };
}

type SettingsTab = "locations" | "team" | "business";

export function SettingsPageClient() {
  const { data, error, isLoading, refresh } = useDashboardBootstrap<SettingsBootstrap>(
    DASHBOARD_CACHE.settings,
    DASHBOARD_BOOTSTRAP_URL.settings,
  );
  const [tab, setTab] = useState<SettingsTab>("locations");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [newLocationName, setNewLocationName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [pending, setPending] = useState(false);

  function notify(text: string, tone: "success" | "error" = "success") {
    setMessage(text);
    setMessageTone(tone);
  }

  if (error) {
    return (
      <main className="settings-page">
        <div className="empty-state-app">
          <strong>{error}</strong>
        </div>
      </main>
    );
  }

  if (isLoading || !data) {
    return (
      <main className="settings-page">
        <PageSkeleton tall />
      </main>
    );
  }

  const canAccess =
    data.permissions.canManageLocations ||
    data.permissions.canManageTeam ||
    data.permissions.canManageBusinessProfile;

  if (!canAccess) {
    return (
      <main className="settings-page">
        <div className="empty-state-app">
          <strong>Workspace settings are limited to owners and admins.</strong>
          <p>Ask your workspace owner if you need a new location or team changes.</p>
        </div>
      </main>
    );
  }

  const displayBusinessName = businessName || data.business.name;

  async function createLocation() {
    if (!newLocationName.trim() || pending) return;
    setPending(true);
    try {
      const response = await fetch("/api/settings/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newLocationName.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not create location");
      setNewLocationName("");
      notify("Location added.");
      invalidateWorkspaceCaches();
      await refresh();
    } catch (createError) {
      notify(
        createError instanceof Error ? createError.message : "Could not create location",
        "error",
      );
    } finally {
      setPending(false);
    }
  }

  async function updateLocation(
    locationId: string,
    patch: { name?: string; isActive?: boolean },
  ) {
    if (pending) return;
    setPending(true);
    try {
      const response = await fetch(`/api/settings/locations/${locationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not update location");
      notify(patch.isActive === false ? "Location archived." : "Location updated.");
      invalidateWorkspaceCaches();
      await refresh();
    } catch (updateError) {
      notify(
        updateError instanceof Error ? updateError.message : "Could not update location",
        "error",
      );
    } finally {
      setPending(false);
    }
  }

  async function saveBusinessName() {
    if (!displayBusinessName.trim() || pending) return;
    setPending(true);
    try {
      const response = await fetch("/api/settings/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayBusinessName.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not update business");
      notify("Business profile updated.");
      invalidateWorkspaceCaches();
      await refresh();
    } catch (saveError) {
      notify(
        saveError instanceof Error ? saveError.message : "Could not update business",
        "error",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="settings-page">
      <header className="app-page-header">
        <div>
          <span className="app-kicker">WORKSPACE</span>
          <h1>Settings</h1>
          <p>Manage locations, team access, and your business profile.</p>
        </div>
        <div className="menu-count">
          <strong>{data.locations.filter((item) => item.isActive).length}</strong>
          <span>active sites</span>
        </div>
      </header>

      <div className="settings-tabs">
        {data.permissions.canManageLocations ? (
          <button
            className={tab === "locations" ? "active" : undefined}
            onClick={() => setTab("locations")}
            type="button"
          >
            Locations
          </button>
        ) : null}
        {data.permissions.canManageTeam ? (
          <button
            className={tab === "team" ? "active" : undefined}
            onClick={() => setTab("team")}
            type="button"
          >
            Team
          </button>
        ) : null}
        {data.permissions.canManageBusinessProfile ? (
          <button
            className={tab === "business" ? "active" : undefined}
            onClick={() => setTab("business")}
            type="button"
          >
            Business
          </button>
        ) : null}
      </div>

      {message ? (
        <p className={`settings-message tone-${messageTone}`}>{message}</p>
      ) : null}

      {tab === "locations" && data.permissions.canManageLocations ? (
        <section className="settings-panel">
          <div className="settings-panel-head">
            <h2>Locations</h2>
            <p>Each site has its own daily stock and waste context. Staff switch sites from the sidebar or floor mode.</p>
          </div>

          <div className="settings-inline-form">
            <input
              onChange={(event) => setNewLocationName(event.target.value)}
              placeholder="e.g. City centre, Airport kiosk"
              value={newLocationName}
            />
            <button
              className="button primary"
              disabled={pending || !newLocationName.trim()}
              onClick={() => void createLocation()}
              type="button"
            >
              Add location
            </button>
          </div>

          <div className="settings-list">
            {data.locations.map((location) => (
              <article
                className={location.isActive ? "settings-row" : "settings-row archived"}
                key={location.id}
              >
                <div>
                  <strong>{location.name}</strong>
                  <small>
                    {location.timezone}
                    {location.id === data.activeLocationId ? " · your active site" : ""}
                    {!location.isActive ? " · archived" : ""}
                  </small>
                </div>
                <div className="settings-row-actions">
                  {location.isActive ? (
                    <>
                      <button
                        className="button ghost small"
                        disabled={pending}
                        onClick={() => {
                          const nextName = window.prompt("Rename location", location.name);
                          if (nextName && nextName.trim() !== location.name) {
                            void updateLocation(location.id, { name: nextName.trim() });
                          }
                        }}
                        type="button"
                      >
                        Rename
                      </button>
                      <button
                        className="button ghost small"
                        disabled={pending}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Archive "${location.name}"? Historical data is kept.`,
                            )
                          ) {
                            void updateLocation(location.id, { isActive: false });
                          }
                        }}
                        type="button"
                      >
                        Archive
                      </button>
                    </>
                  ) : (
                    <button
                      className="button ghost small"
                      disabled={pending}
                      onClick={() => void updateLocation(location.id, { isActive: true })}
                      type="button"
                    >
                      Restore
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "team" && data.permissions.canManageTeam ? (
        <section className="settings-panel">
          <div className="settings-panel-head">
            <h2>Team</h2>
            <p>Everyone with access to this business. Email invites are coming next.</p>
          </div>
          <div className="settings-list">
            {data.members.map((member) => (
              <article className="settings-row" key={member.id}>
                <div>
                  <strong>{member.fullName ?? "Team member"}</strong>
                  <small>
                    {member.role}
                    {!member.isActive ? " · inactive" : ""}
                  </small>
                </div>
              </article>
            ))}
          </div>
          <p className="settings-note">
            Invite-by-email and role management are on the roadmap. Your team list updates automatically as members join.
          </p>
        </section>
      ) : null}

      {tab === "business" && data.permissions.canManageBusinessProfile ? (
        <section className="settings-panel">
          <div className="settings-panel-head">
            <h2>Business profile</h2>
            <p>Legal entity name shown across the workspace. Currency and country are fixed at onboarding for now.</p>
          </div>
          <label className="settings-field">
            Business name
            <input
              onChange={(event) => setBusinessName(event.target.value)}
              placeholder={data.business.name}
              value={displayBusinessName}
            />
          </label>
          <div className="settings-readonly-grid">
            <div>
              <span>Country</span>
              <strong>{data.business.countryCode}</strong>
            </div>
            <div>
              <span>Currency</span>
              <strong>{data.business.currencyCode}</strong>
            </div>
            <div>
              <span>Timezone</span>
              <strong>{data.business.timezone}</strong>
            </div>
          </div>
          <button
            className="button primary"
            disabled={pending || displayBusinessName.trim() === data.business.name}
            onClick={() => void saveBusinessName()}
            type="button"
          >
            Save profile
          </button>
        </section>
      ) : null}
    </main>
  );
}
