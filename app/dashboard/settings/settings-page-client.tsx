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

interface SettingsInvitation {
  id: string;
  email: string;
  role: string;
  fullName: string | null;
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
  invitations: SettingsInvitation[];
  permissions: {
    canManageLocations: boolean;
    canManageTeam: boolean;
    canManageBusinessProfile: boolean;
  };
}

type SettingsTab = "locations" | "team" | "business";

const ROLE_OPTIONS = [
  { value: "staff", label: "Staff — floor logging" },
  { value: "manager", label: "Manager — stock & exports" },
  { value: "admin", label: "Admin — settings access" },
] as const;

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
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] =
    useState<(typeof ROLE_OPTIONS)[number]["value"]>("staff");
  const [pending, setPending] = useState(false);

  function notify(text: string, tone: "success" | "error" = "success") {
    setMessage(text);
    setMessageTone(tone);
  }

  if (error) {
    return (
      <main className="settings-page dashboard-page">
        <div className="empty-state-app">
          <strong>{error}</strong>
        </div>
      </main>
    );
  }

  if (isLoading || !data) {
    return (
      <main className="settings-page dashboard-page">
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
      <main className="settings-page dashboard-page">
        <div className="empty-state-app">
          <strong>Workspace settings are limited to owners and admins.</strong>
          <p>Ask your workspace owner if you need a new location or team changes.</p>
        </div>
      </main>
    );
  }

  const displayBusinessName = businessName || data.business.name;
  const activeSites = data.locations.filter((item) => item.isActive).length;
  const activeMembers = data.members.filter((member) => member.isActive).length;

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

  async function inviteMember() {
    if (!inviteEmail.trim() || pending) return;
    setPending(true);
    try {
      const response = await fetch("/api/settings/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
          fullName: inviteName.trim() || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not add team member");

      if (payload.status === "added") {
        notify(`${inviteEmail.trim()} was added to your team.`);
      } else {
        notify(
          `Invite saved. ${inviteEmail.trim()} will join when they sign up with that email.`,
        );
      }

      setInviteEmail("");
      setInviteName("");
      setInviteRole("staff");
      invalidateWorkspaceCaches();
      await refresh();
    } catch (inviteError) {
      notify(
        inviteError instanceof Error ? inviteError.message : "Could not add team member",
        "error",
      );
    } finally {
      setPending(false);
    }
  }

  async function updateMemberRole(memberId: string, role: string) {
    if (pending) return;
    setPending(true);
    try {
      const response = await fetch(`/api/settings/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not update member");
      notify("Team member updated.");
      await refresh();
    } catch (updateError) {
      notify(
        updateError instanceof Error ? updateError.message : "Could not update member",
        "error",
      );
    } finally {
      setPending(false);
    }
  }

  async function deactivateMember(memberId: string, memberName: string) {
    if (
      !window.confirm(
        `Remove ${memberName} from this workspace? They will lose access immediately.`,
      )
    ) {
      return;
    }

    if (pending) return;
    setPending(true);
    try {
      const response = await fetch(`/api/settings/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not update member");
      notify("Team member removed.");
      await refresh();
    } catch (updateError) {
      notify(
        updateError instanceof Error ? updateError.message : "Could not update member",
        "error",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="settings-page dashboard-page">
      <header className="app-page-header settings-page-header">
        <div>
          <span className="app-kicker">Workspace</span>
          <h1>Settings</h1>
          <p>Manage your business, sites, and who can access Anteiku.</p>
        </div>
        <div className="settings-summary-cards">
          <div className="settings-summary-card">
            <span>Sites</span>
            <strong>{activeSites}</strong>
          </div>
          <div className="settings-summary-card">
            <span>Team</span>
            <strong>{activeMembers}</strong>
          </div>
          <div className="settings-summary-card">
            <span>Pending</span>
            <strong>{data.invitations.length}</strong>
          </div>
        </div>
      </header>

      <div className="settings-tabs" role="tablist">
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
            <h2>Locations &amp; sites</h2>
            <p>
              Add a new site when you open another café or kiosk. Each location
              keeps its own daily stock and waste totals.
            </p>
          </div>

          <div className="settings-form-card">
            <label className="settings-field">
              New location name
              <input
                onChange={(event) => setNewLocationName(event.target.value)}
                placeholder="e.g. City centre, Airport kiosk"
                value={newLocationName}
              />
            </label>
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
            <h2>Team access</h2>
            <p>
              Add staff by email. If they already have an Anteiku account they join
              immediately; otherwise they are added when they sign up.
            </p>
          </div>

          <div className="settings-form-card settings-team-form">
            <label className="settings-field">
              Work email
              <input
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="barista@yourcafe.com"
                type="email"
                value={inviteEmail}
              />
            </label>
            <label className="settings-field">
              Display name (optional)
              <input
                onChange={(event) => setInviteName(event.target.value)}
                placeholder="e.g. Alex"
                value={inviteName}
              />
            </label>
            <label className="settings-field">
              Role
              <select
                onChange={(event) =>
                  setInviteRole(
                    event.target.value as (typeof ROLE_OPTIONS)[number]["value"],
                  )
                }
                value={inviteRole}
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="button primary"
              disabled={pending || !inviteEmail.trim()}
              onClick={() => void inviteMember()}
              type="button"
            >
              Add team member
            </button>
          </div>

          {data.invitations.length > 0 ? (
            <>
              <h3 className="settings-subheading">Pending invites</h3>
              <div className="settings-list compact">
                {data.invitations.map((invite) => (
                  <article className="settings-row settings-row-pending" key={invite.id}>
                    <div>
                      <strong>{invite.email}</strong>
                      <small>
                        {invite.role}
                        {invite.fullName ? ` · ${invite.fullName}` : ""} · waiting for
                        sign-up
                      </small>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : null}

          <h3 className="settings-subheading">Active members</h3>
          <div className="settings-list">
            {data.members
              .filter((member) => member.isActive)
              .map((member) => (
                <article className="settings-row" key={member.id}>
                  <div>
                    <strong>{member.fullName ?? "Team member"}</strong>
                    <small>{member.role}</small>
                  </div>
                  {member.role !== "owner" ? (
                    <div className="settings-row-actions">
                      <select
                        className="settings-role-select"
                        disabled={pending}
                        onChange={(event) =>
                          void updateMemberRole(member.id, event.target.value)
                        }
                        value={member.role}
                      >
                        {ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        className="button ghost small"
                        disabled={pending}
                        onClick={() =>
                          void deactivateMember(
                            member.id,
                            member.fullName ?? "this member",
                          )
                        }
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <span className="settings-owner-badge">Owner</span>
                  )}
                </article>
              ))}
          </div>
        </section>
      ) : null}

      {tab === "business" && data.permissions.canManageBusinessProfile ? (
        <section className="settings-panel">
          <div className="settings-panel-head">
            <h2>Business profile</h2>
            <p>
              Your Anteiku workspace represents one business. Use{" "}
              <strong>Locations</strong> to add more sites — you do not need a
              separate business for each café.
            </p>
          </div>

          <div className="settings-form-card">
            <label className="settings-field">
              Business name
              <input
                onChange={(event) => setBusinessName(event.target.value)}
                placeholder={data.business.name}
                value={displayBusinessName}
              />
            </label>
            <button
              className="button primary"
              disabled={pending || displayBusinessName.trim() === data.business.name}
              onClick={() => void saveBusinessName()}
              type="button"
            >
              Save business name
            </button>
          </div>

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
          <p className="settings-note">
            Country and currency are set during onboarding. Contact support if you need
            to change them after going live.
          </p>
        </section>
      ) : null}
    </main>
  );
}
