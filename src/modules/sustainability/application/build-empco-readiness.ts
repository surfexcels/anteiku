import type { BusinessProduct } from "@/src/modules/catalog/domain/catalog-product";
import {
  EMPCO_APPLIES_FROM,
  EMPCO_TRANSPOSITION_DEADLINE,
} from "@/src/modules/sustainability/data/eu-category-co2e-benchmarks";
import type { EmpCoReadiness } from "@/src/modules/sustainability/domain/carbon";

export function buildEmpCoReadiness(
  products: BusinessProduct[],
  disclosureEnabled: boolean,
): EmpCoReadiness {
  const active = products.filter((product) => product.isActive);
  const withFactors = active.filter((product) => product.unitCo2eG != null);
  const verified = active.filter((product) => product.co2eSource === "verified");
  const missing = active.length - withFactors.length;

  const checklist = [
    {
      id: "track-waste-co2",
      label: "Track CO2e from wasted food",
      done: true,
      detail: "Anteiku snapshots grams CO2e on every waste log.",
    },
    {
      id: "product-factors",
      label: "Assign a CO2e factor to every menu item",
      done: missing === 0 && active.length > 0,
      detail:
        missing > 0
          ? `${missing} active item${missing === 1 ? "" : "s"} still use defaults only.`
          : "All active menu items have a stored factor.",
    },
    {
      id: "methodology",
      label: "Document your calculation methodology",
      done: withFactors.some((product) => Boolean(product.co2eMethodology)),
      detail:
        "EmpCo requires specific, verifiable claims — not vague terms like eco-friendly.",
    },
    {
      id: "verified-labels",
      label: "Use verified data before public carbon labels",
      done: verified.length > 0 || !disclosureEnabled,
      detail:
        "From 27 Sep 2026, consumer-facing carbon labels need third-party certification or exceptional proof.",
    },
    {
      id: "disclosure-toggle",
      label: "Control public carbon disclosure",
      done: true,
      detail: disclosureEnabled
        ? "Disclosure is on — only share numbers you can substantiate."
        : "Public disclosure is off until you are EmpCo-ready.",
    },
  ];

  return {
    appliesFrom: EMPCO_APPLIES_FROM,
    transpositionDeadline: EMPCO_TRANSPOSITION_DEADLINE,
    disclosureEnabled,
    productsWithFactors: withFactors.length,
    productsMissingFactors: missing,
    productsVerified: verified.length,
    canMakePublicClaims:
      disclosureEnabled &&
      missing === 0 &&
      verified.length > 0 &&
      checklist.find((item) => item.id === "methodology")?.done === true,
    checklist,
  };
}
