"use client";

import {
  formatQuantityDisplay,
  normalizeQuantity,
  quantityStep,
} from "@/src/lib/inventory/quantity-step";
import type { ProductUnit } from "@/src/modules/catalog/domain/catalog-product";

export function InventoryQuantityStepper({
  ariaLabel,
  disabled,
  onChange,
  unit,
  value,
}: {
  ariaLabel: string;
  disabled?: boolean;
  onChange: (value: number) => void;
  unit: ProductUnit;
  value: number;
}) {
  const step = quantityStep(unit);
  const display = formatQuantityDisplay(value, unit);

  function adjust(delta: number) {
    onChange(normalizeQuantity(value + delta, unit));
  }

  return (
    <div className="qty-stepper inventory-stepper">
      <button
        aria-label={`Decrease ${ariaLabel}`}
        disabled={disabled || value <= 0}
        onClick={() => adjust(-step)}
        type="button"
      >
        -
      </button>
      <input
        aria-label={ariaLabel}
        disabled={disabled}
        inputMode={step >= 1 ? "numeric" : "decimal"}
        min="0"
        onChange={(event) =>
          onChange(normalizeQuantity(Number(event.target.value) || 0, unit))
        }
        onBlur={(event) =>
          onChange(normalizeQuantity(Number(event.target.value) || 0, unit))
        }
        step={step}
        type="number"
        value={display}
      />
      <button
        aria-label={`Increase ${ariaLabel}`}
        disabled={disabled}
        onClick={() => adjust(step)}
        type="button"
      >
        +
      </button>
    </div>
  );
}
