"use client";

import { useState } from "react";
import { formatMoney } from "@/src/lib/format-money";
import type { Recommendation } from "@/src/modules/recommendations/domain/recommendation";

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

  async function generateInsight() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/recommendations", { method: "POST" });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error || "Could not generate insight.");
      setLoading(false);
      return;
    }

    setRecommendations((current) => [payload.recommendation, ...current]);
    setLoading(false);
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
      current.map((item) =>
        item.id === id ? payload.recommendation : item,
      ),
    );
  }

  return (
    <div className="feature-workspace">
      <section className="panel-app">
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
            {loading ? "Generating..." : "Generate from waste"}
          </button>
        </div>

        <div className="insight-list">
          {recommendations.map((item) => (
            <article className="insight-card" key={item.id}>
              <span className={`status-pill ${item.status}`}>{item.status}</span>
              <h3>{item.title}</h3>
              <p>{item.explanation}</p>
              <div className="impact-box-app">
                <span>Estimated annual saving</span>
                <strong>
                  {formatMoney(item.estimatedAnnualImpactMinor, currencyCode)}
                </strong>
              </div>
              {item.status === "new" && (
                <div className="inline-actions">
                  <button
                    className="text-button-app"
                    onClick={() => updateStatus(item.id, "reviewed")}
                    type="button"
                  >
                    Mark reviewed
                  </button>
                  <button
                    className="text-button-app"
                    onClick={() => updateStatus(item.id, "accepted")}
                    type="button"
                  >
                    Accept
                  </button>
                  <button
                    className="text-button-app"
                    onClick={() => updateStatus(item.id, "dismissed")}
                    type="button"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </article>
          ))}
          {recommendations.length === 0 && (
            <div className="empty-state-app">
              <strong>No insights yet</strong>
              <p>Log waste for a few days, then generate your first insight.</p>
            </div>
          )}
        </div>
      </section>
      {message && <div className="app-toast">{message}</div>}
    </div>
  );
}
