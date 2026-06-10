export function CarbonCalculationCopy() {
  return (
    <>
      <p>
        <strong>Waste emissions</strong> are the estimated greenhouse gases already
        tied to food you threw away — not CO₂ you saved. Less waste over time is
        what reduces this number.
      </p>
      <ul>
        <li>
          <strong>Formula:</strong> quantity wasted × CO₂e per menu unit (grams).
        </li>
        <li>
          <strong>Per-product factor:</strong> your edit on Products, or EU
          category benchmarks (Agribalyse / PEF-style averages) for croissants,
          coffee, bread, etc.
        </li>
        <li>
          <strong>Snapshot:</strong> the factor is stored on each waste log when you
          save it, so reports stay consistent even if you change the menu later.
        </li>
        <li>
          <strong>Equivalencies:</strong> driving km (~120 g CO₂e/km) and phone
          charges (~8 g CO₂e/charge) are illustrative only — for staff briefings,
          not regulatory filings.
        </li>
        <li>
          <strong>EmpCo (EU 2024/825):</strong> public carbon labels from Sep 2026
          need verified methodology. Use <em>verified</em> or supplier factors in
          Products before customer-facing claims.
        </li>
      </ul>
    </>
  );
}
