"use client";

import type { ReactNode } from "react";
import { useState } from "react";

export function CalculationExplainer({
  title = "How we calculate this",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="calculation-explainer">
      <button
        aria-expanded={open}
        className="calculation-explainer-toggle"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {title}
        <span aria-hidden>{open ? "−" : "+"}</span>
      </button>
      {open ? <div className="calculation-explainer-body">{children}</div> : null}
    </div>
  );
}
