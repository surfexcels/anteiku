"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type {
  BusinessProduct,
  CatalogProduct,
} from "@/src/modules/catalog/domain/catalog-product";

function formatMoney(minor: number, currencyCode: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
  }).format(minor / 100);
}

export function ProductCatalog({
  countryCode,
  currencyCode,
  initialProducts,
}: {
  countryCode: string;
  currencyCode: string;
  initialProducts: BusinessProduct[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogProduct[]>([]);
  const [products, setProducts] = useState(initialProducts);
  const [selected, setSelected] = useState<CatalogProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: query,
          country: countryCode,
          limit: "12",
        });
        const response = await fetch(`/api/catalog/search?${params}`, {
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Search failed");
        setResults(payload.products);
        setMessage("");
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setMessage("The catalog could not be loaded.");
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [countryCode, query]);

  const existingCatalogIds = useMemo(
    () =>
      new Set(
        products
          .map((product) => product.catalogSourceId ?? product.catalogProductId)
          .filter(Boolean),
      ),
    [products],
  );

  async function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/business-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        catalogSourceId: selected.id,
        name: form.get("name"),
        imageUrl: selected.imageUrl,
        unit: form.get("unit"),
        unitCost: form.get("unitCost"),
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error || "Could not add product.");
      setSaving(false);
      return;
    }

    setProducts((current) =>
      [...current, payload.product].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setSelected(null);
    setSaving(false);
    setMessage(`${payload.product.name} was added to your menu.`);
  }

  return (
    <div className="product-workspace">
      <section className="catalog-panel">
        <div className="catalog-search">
          <span aria-hidden="true">S</span>
          <input
            aria-label="Search European food catalog"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try croissant, pastel de nata, focaccia..."
            type="search"
            value={query}
          />
          {loading && <i>Searching</i>}
        </div>
        <div className="catalog-heading">
          <div>
            <h2>{query ? "Search results" : "Popular cafe products"}</h2>
            <p>Localized for {countryCode}</p>
          </div>
          <span>{results.length} products</span>
        </div>

        <div className="catalog-grid">
          {results.map((product) => {
            const alreadyAdded = existingCatalogIds.has(product.id);
            return (
              <article className="catalog-card" key={product.id}>
                <img alt="" height="150" src={product.imageUrl} width="200" />
                <div>
                  <span>{product.category || "Cafe product"}</span>
                  <h3>{product.name}</h3>
                  <p>{product.description || `Sold by ${product.unit}`}</p>
                  <button
                    disabled={alreadyAdded}
                    onClick={() => setSelected(product)}
                    type="button"
                  >
                    {alreadyAdded ? "In your menu" : "Add and set price"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {!loading && results.length === 0 && (
          <div className="catalog-empty">
            <strong>No exact match yet.</strong>
            <p>
              Try a local name or a broader term. Custom products are part of
              the next product-management slice.
            </p>
          </div>
        )}
      </section>

      <aside className="menu-panel">
        <div className="catalog-heading">
          <div>
            <h2>Your menu</h2>
            <p>Current unit costs</p>
          </div>
          <span>{products.length}</span>
        </div>
        <div className="menu-list">
          {products.map((product) => (
            <article key={product.id}>
              <img alt="" height="52" src={product.imageUrl} width="64" />
              <div>
                <strong>{product.name}</strong>
                <span>per {product.unit}</span>
              </div>
              <b>{formatMoney(product.unitCostMinor, product.currencyCode)}</b>
            </article>
          ))}
          {products.length === 0 && (
            <div className="menu-empty">
              <span>+</span>
              <strong>Your menu is empty</strong>
              <p>Add a few daily products to get started.</p>
            </div>
          )}
        </div>
      </aside>

      {selected && (
        <div className="product-modal-backdrop" role="presentation">
          <section
            aria-labelledby="price-product-title"
            aria-modal="true"
            className="product-modal"
            role="dialog"
          >
            <button
              aria-label="Close"
              className="modal-close"
              onClick={() => setSelected(null)}
              type="button"
            >
              x
            </button>
            <div className="modal-product">
              <img alt="" height="76" src={selected.imageUrl} width="96" />
              <div>
                <span>{selected.category}</span>
                <h2 id="price-product-title">{selected.name}</h2>
              </div>
            </div>
            <form className="price-form" onSubmit={addProduct}>
              <label>
                Menu name
                <input defaultValue={selected.name} name="name" required />
              </label>
              <div className="price-fields">
                <label>
                  Unit
                  <select defaultValue={selected.unit} name="unit">
                    <option value="item">Item</option>
                    <option value="portion">Portion</option>
                    <option value="pack">Pack</option>
                    <option value="kg">Kilogram</option>
                    <option value="g">Gram</option>
                    <option value="l">Litre</option>
                    <option value="ml">Millilitre</option>
                  </select>
                </label>
                <label>
                  Cost per unit ({currencyCode})
                  <input
                    inputMode="decimal"
                    min="0"
                    name="unitCost"
                    placeholder="1.25"
                    required
                    step="0.01"
                    type="number"
                  />
                </label>
              </div>
              <p>
                Use your ingredient or supplier cost, not the selling price.
                This is how Anteiku calculates true waste loss.
              </p>
              <button
                className="button primary large full"
                disabled={saving}
                type="submit"
              >
                {saving ? "Adding..." : "Add to my menu"}
              </button>
            </form>
          </section>
        </div>
      )}

      {message && <div className="app-toast">{message}</div>}
    </div>
  );
}
