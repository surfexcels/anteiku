"use client";

import { useEffect, useState } from "react";
import type {
  PlatformTenantDetail,
  PlatformTenantSummary,
} from "@/src/modules/platform/domain/tenant";

export function InternalConsoleClient() {
  const [tenants, setTenants] = useState<PlatformTenantSummary[]>([]);
  const [selected, setSelected] = useState<PlatformTenantDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/internal/tenants");
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Could not load tenants");
        }
        if (!cancelled) {
          setTenants(payload.tenants);
          setError("");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Could not load tenants",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function openTenant(tenantId: string) {
    setLoading(true);
    try {
      const response = await fetch(`/api/internal/tenants/${tenantId}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Could not load tenant");
      }
      setSelected(payload.tenant);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Could not load tenant",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="internal-page">
      <header className="internal-page-header">
        <div>
          <span className="app-kicker">TENANTS</span>
          <h1>All workspaces</h1>
          <p>Read-only view across every business on the platform.</p>
        </div>
        <div className="menu-count">
          <strong>{tenants.length}</strong>
          <span>tenants</span>
        </div>
      </header>

      {error ? <p className="settings-message tone-error">{error}</p> : null}
      {loading && tenants.length === 0 ? (
        <div className="settings-panel">Loading tenants…</div>
      ) : null}

      <div className="internal-grid">
        <section className="settings-panel">
          <div className="settings-panel-head">
            <h2>Businesses</h2>
          </div>
          <div className="settings-list">
            {tenants.map((tenant) => (
              <button
                className={
                  selected?.id === tenant.id
                    ? "settings-row settings-row-button active"
                    : "settings-row settings-row-button"
                }
                key={tenant.id}
                onClick={() => void openTenant(tenant.id)}
                type="button"
              >
                <div>
                  <strong>{tenant.name}</strong>
                  <small>
                    {tenant.locationCount} sites · {tenant.memberCount} members ·{" "}
                    {tenant.planCode ?? "no plan"}
                    {tenant.subscriptionStatus ? ` · ${tenant.subscriptionStatus}` : ""}
                  </small>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="settings-panel">
          {selected ? (
            <>
              <div className="settings-panel-head">
                <h2>{selected.name}</h2>
                <p>
                  {selected.countryCode} · {selected.currencyCode} · {selected.timezone}
                </p>
              </div>
              <div className="settings-readonly-grid">
                <div>
                  <span>Created</span>
                  <strong>{new Date(selected.createdAt).toLocaleDateString()}</strong>
                </div>
                <div>
                  <span>Subscription</span>
                  <strong>{selected.subscriptionStatus ?? "none"}</strong>
                </div>
                <div>
                  <span>Plan</span>
                  <strong>{selected.planCode ?? "—"}</strong>
                </div>
              </div>
              <h3 className="internal-subheading">Locations</h3>
              <div className="settings-list compact">
                {selected.locations.map((location) => (
                  <article className="settings-row" key={location.id}>
                    <div>
                      <strong>{location.name}</strong>
                      <small>{location.isActive ? "active" : "archived"}</small>
                    </div>
                  </article>
                ))}
              </div>
              <h3 className="internal-subheading">Members</h3>
              <div className="settings-list compact">
                {selected.members.map((member) => (
                  <article className="settings-row" key={member.id}>
                    <div>
                      <strong>{member.role}</strong>
                      <small>
                        {member.userId.slice(0, 8)}…
                        {!member.isActive ? " · inactive" : ""}
                      </small>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="settings-panel-head">
              <h2>Tenant detail</h2>
              <p>Select a business to inspect locations and memberships.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
