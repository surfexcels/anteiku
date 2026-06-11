"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/src/lib/format-money";
import type {
  Recommendation,
  RecommendationStatus,
} from "@/src/modules/recommendations/domain/recommendation";

type Filter = "all" | RecommendationStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "reviewed", label: "Reviewed" },
  { id: "accepted", label: "Accepted" },
  { id: "dismissed", label: "Dismissed" },
];

export function InsightsPanel({
  currencyCode,
  initialRecommendations,
}: {
  currencyCode: string;
  initialRecommendations: Recommendation[];
}) {
  const [recommendations, setRecommendations] = useState(
    initialRecommendations,
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return recommendations;
    return recommendations.filter((item) => item.status === filter);
  }, [filter, recommendations]);

  const newCount = recommendations.filter((r) => r.status === "new").length;
  const acceptedCount = recommendations.filter((r) => r.status === "accepted").length;
  const potentialSavings = recommendations
    .filter((r) => r.status !== "dismissed")
    .reduce((sum, r) => sum + r.estimatedAnnualImpactMinor, 0);

  const featured = useMemo(() => {
    const candidates = recommendations.filter((r) => r.status === "new");
    if (candidates.length === 0) return null;
    return candidates.reduce((best, item) =>
      item.estimatedAnnualImpactMinor > best.estimatedAnnualImpactMinor ? item : best,
    );
  }, [recommendations]);

  async function generateInsight() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/recommendations", { method: "POST" });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error || "Could not generate insight.");
      setMessageTone("error");
      setLoading(false);
      return;
    }

    setRecommendations((current) => [payload.recommendation, ...current]);
    setLoading(false);
    setMessageTone("success");
    setMessage("New insight generated from your waste data.");
  }

  async function updateStatus(id: string, status: "reviewed" | "accepted" | "dismissed") {
    const response = await fetch(`/api/recommendations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const payload = await response.json();
    if (!response.ok) return;

    setRecommendations((current) =>
      current.map((item) => (item.id === id ? payload.recommendation : item)),
    );
  }

  return (
    <div className="insights-workspace">
      {featured && (
        <section className="insight-featured">
          <div className="insight-featured-copy">
            <span className="insight-featured-label">Top opportunity</span>
            <h2>{featured.title}</h2>
            <p>{featured.explanation}</p>
          </div>
          <div className="insight-featured-impact">
            <span>Est. annual saving</span>
            <strong>
              {formatMoney(featured.estimatedAnnualImpactMinor, currencyCode)}
            </strong>
            <div className="insight-featured-actions">
              <button
                className="button primary small"
                onClick={() => updateStatus(featured.id, "accepted")}
                type="button"
              >
                Accept
              </button>
              <button
                className="button ghost small"
                onClick={() => updateStatus(featured.id, "reviewed")}
                type="button"
              >
                Review later
              </button>
            </div>
          </div>
        </section>
      )}

      <div className="insights-main-grid">
        <section className="panel-app insights-list-panel">
          <div className="panel-head-app">
            <div>
              <h2>Smart insights</h2>
              <p>Recommendations based on your recent waste patterns.</p>
            </div>
            <button
              className="button primary small"
              disabled={loading}
              onClick={generateInsight}
              type="button"
            >
              {loading ? "Generating…" : "Generate from waste"}
            </button>
          </div>

          <div className="insight-filters" role="tablist">
            {FILTERS.map((item) => {
              const count =
                item.id === "all"
                  ? recommendations.length
                  : recommendations.filter((r) => r.status === item.id).length;
              return (
                <button
                  aria-selected={filter === item.id}
                  className={filter === item.id ? "active" : undefined}
                  key={item.id}
                  onClick={() => setFilter(item.id)}
                  role="tab"
                  type="button"
                >
                  {item.label}
                  {count > 0 && <em>{count}</em>}
                </button>
              );
            })}
          </div>

          <div className="insight-list">
            {filtered.map((item) => (
              <article
                className={`insight-card-v2 status-${item.status}`}
                key={item.id}
              >
                <div className="insight-card-head">
                  <span className={`status-pill ${item.status}`}>{item.status}</span>
                  <small>{new Date(item.generatedAt).toLocaleDateString()}</small>
                </div>
                <h3>{item.title}</h3>
                <p>{item.explanation}</p>
                <div className="insight-impact-strip">
                  <div>
                    <span>Est. annual saving</span>
                    <strong>
                      {formatMoney(item.estimatedAnnualImpactMinor, currencyCode)}
                    </strong>
                  </div>
                </div>
                {item.status === "new" && (
                  <div className="insight-card-actions">
                    <button
                      className="insight-action accept"
                      onClick={() => updateStatus(item.id, "accepted")}
                      type="button"
                    >
                      Accept
                    </button>
                    <button
                      className="insight-action"
                      onClick={() => updateStatus(item.id, "reviewed")}
                      type="button"
                    >
                      Reviewed
                    </button>
                    <button
                      className="insight-action muted"
                      onClick={() => updateStatus(item.id, "dismissed")}
                      type="button"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </article>
            ))}
            {filtered.length === 0 && (
              <div className="empty-state-app">
                <span className="empty-state-icon" aria-hidden>
                  💡
                </span>
                <strong>
                  {recommendations.length === 0
                    ? "No insights yet"
                    : "No insights in this filter"}
                </strong>
                <p>
                  {recommendations.length === 0
                    ? "Log waste for a few days, then generate your first recommendation."
                    : "Try another filter or generate a new insight from your waste data."}
                </p>
              </div>
            )}
          </div>
        </section>

        <aside className="panel-app insight-guide-panel">
          <span className="import-guide-label">How insights work</span>
          <ol className="import-steps">
            <li>
              <span>1</span>
              <div>
                <strong>Log waste daily</strong>
                <p>Quick close builds the pattern data insights need.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Generate</strong>
                <p>We analyse top products, reasons, and cost trends.</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Act on savings</strong>
                <p>Accept ideas you&apos;ll implement — dismiss the rest.</p>
              </div>
            </li>
          </ol>
          <div className="import-guide-stats">
            <div>
              <strong>{newCount}</strong>
              <span>new</span>
            </div>
            <div>
              <strong>{acceptedCount}</strong>
              <span>accepted</span>
            </div>
            <div>
              <strong>{formatMoney(potentialSavings, currencyCode)}</strong>
              <span>potential / yr</span>
            </div>
          </div>
        </aside>
      </div>

      {message && (
        <div className={`app-toast import-toast ${messageTone}`}>{message}</div>
      )}
    </div>
  );
}
