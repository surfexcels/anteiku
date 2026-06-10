import { getOcrServiceUrl, isOcrServiceConfigured } from "@/src/lib/env";

export interface OcrLineItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
}

export interface OcrExtractionResult {
  method: string;
  text: string;
  lineItems: OcrLineItem[];
}

export { isOcrServiceConfigured };

export async function extractDocumentWithOcr(
  filename: string,
  fileBytes: ArrayBuffer,
): Promise<OcrExtractionResult> {
  if (!isOcrServiceConfigured()) {
    throw new Error("OCR_NOT_CONFIGURED");
  }

  const form = new FormData();
  form.append("file", new Blob([fileBytes]), filename);

  const response = await fetch(`${getOcrServiceUrl()}/extract`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OCR service failed: ${detail.slice(0, 240)}`);
  }

  const payload = (await response.json()) as OcrExtractionResult;
  return {
    method: payload.method,
    text: payload.text,
    lineItems: payload.lineItems ?? [],
  };
}
