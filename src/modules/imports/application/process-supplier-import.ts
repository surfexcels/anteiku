import { isOpenAIConfigured } from "@/src/lib/env";
import { extractDocumentWithOcr, isOcrServiceConfigured } from "@/src/lib/ocr/client";
import type { BusinessProduct } from "@/src/modules/catalog/domain/catalog-product";
import type { ImportProcessingResult } from "@/src/modules/imports/domain/import-result";
import { matchImportLinesToMenu } from "@/src/modules/imports/application/match-import-lines-to-menu";
import { matchSupplierLinesWithAi } from "@/src/modules/imports/application/match-supplier-lines-with-ai";

export type { ImportProcessingResult } from "@/src/modules/imports/domain/import-result";

function buildResult(input: {
  lineItems?: ImportProcessingResult["lineItems"];
  lineCount?: number;
  message: string;
  ocrUsed: boolean;
  ocrMethod?: string;
  aiUsed?: boolean;
}): ImportProcessingResult {
  const lineItems = input.lineItems ?? [];
  const matchedCount = lineItems.filter((line) => line.matchedProductId).length;

  return {
    lineCount: input.lineCount ?? lineItems.length,
    matchedCount,
    message: input.message,
    lineItems,
    ocrUsed: input.ocrUsed,
    ocrMethod: input.ocrMethod,
    aiUsed: input.aiUsed ?? false,
  };
}

export async function processSupplierImport(input: {
  filename: string;
  fileBytes: ArrayBuffer;
  menuProducts: BusinessProduct[];
  currencyCode: string;
}): Promise<ImportProcessingResult> {
  const lower = input.filename.toLowerCase();

  if (isOcrServiceConfigured()) {
    try {
      const extraction = await extractDocumentWithOcr(
        input.filename,
        input.fileBytes,
      );

      let lineItems = matchImportLinesToMenu(
        extraction.lineItems,
        input.menuProducts,
      );
      let aiUsed = false;
      let message = `Read ${lineItems.length} product line${lineItems.length === 1 ? "" : "s"} from your file.`;

      const matchedCount = lineItems.filter((line) => line.matchedProductId).length;
      const needsAi =
        isOpenAIConfigured() &&
        input.menuProducts.length > 0 &&
        lineItems.length > 0 &&
        matchedCount / lineItems.length < 0.5;

      if (needsAi) {
        try {
          const improved = await matchSupplierLinesWithAi({
            extractedText: extraction.text,
            lineItems,
            menuProducts: input.menuProducts,
            currencyCode: input.currencyCode,
          });
          lineItems = improved.lineItems;
          message = improved.summary;
          aiUsed = true;
        } catch {
          // Keep OCR + fuzzy matches when AI matching fails.
        }
      }

      const finalMatched = lineItems.filter((line) => line.matchedProductId).length;
      if (!aiUsed && finalMatched > 0) {
        message = `Matched ${finalMatched} of ${lineItems.length} supplier lines to your menu.`;
      } else if (!aiUsed && lineItems.length === 0) {
        message =
          "We read the file but couldn't find product lines. Try a clearer PDF or export as CSV.";
      }

      return buildResult({
        lineItems,
        message,
        ocrUsed: true,
        ocrMethod: extraction.method,
        aiUsed,
      });
    } catch {
      // Fall through to basic parsing when OCR is unavailable or fails.
    }
  }

  if (lower.endsWith(".csv")) {
    const textContent = new TextDecoder().decode(input.fileBytes);
    const lines = textContent
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const dataRows = Math.max(lines.length - 1, 0);
    return buildResult({
      lineItems: [],
      lineCount: dataRows,
      ocrUsed: false,
      message:
        dataRows > 0
          ? `Stored ${dataRows} supplier line${dataRows === 1 ? "" : "s"}. Upload a PDF invoice for automatic line reading.`
          : "CSV stored. Add product rows to match against your menu.",
    });
  }

  return buildResult({
    lineItems: [],
    ocrUsed: false,
    message: isOcrServiceConfigured()
      ? "Invoice stored. We couldn't read this file — try CSV or a clearer PDF."
      : "Invoice stored. PDF reading isn't available yet — try CSV or Excel for now.",
  });
}
