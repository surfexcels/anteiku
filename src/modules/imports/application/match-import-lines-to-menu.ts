import type { BusinessProduct } from "@/src/modules/catalog/domain/catalog-product";
import type { ImportLineItem } from "@/src/modules/imports/domain/import-result";
import type { OcrLineItem } from "@/src/lib/ocr/client";

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreMatch(description: string, productName: string) {
  const left = normalize(description);
  const right = normalize(productName);
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.92;

  const leftWords = new Set(left.split(" ").filter((word) => word.length > 2));
  const rightWords = right.split(" ").filter((word) => word.length > 2);
  if (rightWords.length === 0) return 0;

  let hits = 0;
  for (const word of rightWords) {
    if (leftWords.has(word)) hits += 1;
  }

  return hits / rightWords.length;
}

export function matchImportLinesToMenu(
  lines: OcrLineItem[],
  menuProducts: BusinessProduct[],
): ImportLineItem[] {
  return lines.map((line) => {
    let bestProduct: BusinessProduct | null = null;
    let bestScore = 0;

    for (const product of menuProducts) {
      const score = scoreMatch(line.description, product.name);
      if (score > bestScore) {
        bestScore = score;
        bestProduct = product;
      }
    }

    const matched = bestProduct && bestScore >= 0.55 ? bestProduct : null;

    return {
      description: line.description,
      quantity: line.quantity,
      unitPriceMinor:
        line.unitPrice !== undefined
          ? Math.round(line.unitPrice * 100)
          : undefined,
      matchedProductId: matched?.id,
      matchedProductName: matched?.name,
      confidence: matched ? Number(bestScore.toFixed(2)) : undefined,
    };
  });
}
