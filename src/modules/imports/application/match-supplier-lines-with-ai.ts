import { z } from "zod";
import { createJsonCompletion } from "@/src/lib/openai/chat";
import type { BusinessProduct } from "@/src/modules/catalog/domain/catalog-product";
import type { ImportLineItem } from "@/src/modules/imports/domain/import-result";

const aiResponseSchema = z.object({
  lineItems: z.array(
    z.object({
      description: z.string(),
      quantity: z.number().optional(),
      unitPrice: z.number().optional(),
      matchedMenuProductId: z.string().nullable().optional(),
      confidence: z.number().min(0).max(1).optional(),
    }),
  ),
  summary: z.string(),
});

export async function matchSupplierLinesWithAi(input: {
  extractedText: string;
  lineItems: ImportLineItem[];
  menuProducts: BusinessProduct[];
  currencyCode: string;
}): Promise<{ lineItems: ImportLineItem[]; summary: string }> {
  const menu = input.menuProducts.map((product) => ({
    id: product.id,
    name: product.name,
    unit: product.unit,
  }));
  const menuById = new Map(menu.map((product) => [product.id, product]));

  const parsed = await createJsonCompletion(
    [
      {
        role: "system",
        content:
          "You match supplier invoice lines to a cafe menu. Return JSON with lineItems and summary. Use matchedMenuProductId from the menu or null.",
      },
      {
        role: "user",
        content: `Currency: ${input.currencyCode}
Menu: ${JSON.stringify(menu)}
OCR lines: ${JSON.stringify(input.lineItems)}
Invoice text:
${input.extractedText.slice(0, 12000)}`,
      },
    ],
    (value) => aiResponseSchema.parse(value),
  );

  const lineItems = parsed.lineItems.map((line) => {
    const matched = line.matchedMenuProductId
      ? menuById.get(line.matchedMenuProductId)
      : undefined;

    return {
      description: line.description,
      quantity: line.quantity,
      unitPriceMinor:
        line.unitPrice !== undefined
          ? Math.round(line.unitPrice * 100)
          : undefined,
      matchedProductId: matched?.id,
      matchedProductName: matched?.name,
      confidence: line.confidence,
    };
  });

  return { lineItems, summary: parsed.summary };
}
