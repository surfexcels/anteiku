import type { BusinessProduct } from "@/src/modules/catalog/domain/catalog-product";
import type { WasteReason } from "@/src/modules/waste/domain/waste";
import type { BatchWasteLogEntry } from "@/src/modules/waste/application/waste-repository";

export interface SpreadsheetImportRow {
  rowNumber: number;
  productName: string;
  quantity: number;
  date?: string;
  reasonLabel?: string;
  note?: string;
}

export interface SpreadsheetImportPreview {
  rows: SpreadsheetImportRow[];
  matched: Array<SpreadsheetImportRow & { businessProductId: string }>;
  unmatched: SpreadsheetImportRow[];
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function headerIndex(headers: string[], candidates: string[]) {
  const normalized = headers.map((header) => normalize(header));
  for (const candidate of candidates) {
    const index = normalized.findIndex((header) => header.includes(candidate));
    if (index >= 0) return index;
  }
  return -1;
}

function matchProduct(name: string, products: BusinessProduct[]) {
  const target = normalize(name);
  let best: BusinessProduct | null = null;
  let bestScore = 0;

  for (const product of products) {
    const candidate = normalize(product.name);
    if (!candidate) continue;
    if (candidate === target) return product;
    if (candidate.includes(target) || target.includes(candidate)) {
      return product;
    }

    const targetWords = new Set(target.split(" ").filter((word) => word.length > 2));
    const words = candidate.split(" ").filter((word) => word.length > 2);
    let hits = 0;
    for (const word of words) {
      if (targetWords.has(word)) hits += 1;
    }
    const score = words.length > 0 ? hits / words.length : 0;
    if (score > bestScore) {
      bestScore = score;
      best = product;
    }
  }

  return bestScore >= 0.55 ? best : null;
}

function matchReason(label: string | undefined, reasons: WasteReason[]) {
  if (!label) return undefined;
  const target = normalize(label);
  return reasons.find(
    (reason) =>
      normalize(reason.label) === target || normalize(reason.code) === target,
  );
}

function findHeaderLineIndex(lines: string[]) {
  for (let index = 0; index < lines.length; index += 1) {
    const headers = parseCsvLine(lines[index]);
    const productIdx = headerIndex(headers, ["product", "item", "name", "food"]);
    const quantityIdx = headerIndex(headers, ["quantity", "qty", "amount", "units"]);
    if (productIdx >= 0 && quantityIdx >= 0) {
      return index;
    }
  }
  return -1;
}

export function parseWasteSpreadsheet(content: string): SpreadsheetImportRow[] {
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headerLineIndex = findHeaderLineIndex(lines);
  if (headerLineIndex < 0) return [];

  const headers = parseCsvLine(lines[headerLineIndex]);
  const productIdx = headerIndex(headers, ["product", "item", "name", "food"]);
  const quantityIdx = headerIndex(headers, ["quantity", "qty", "amount", "units"]);
  const dateIdx = headerIndex(headers, ["date", "day", "when"]);
  const reasonIdx = headerIndex(headers, ["reason", "why", "category", "type"]);
  const noteIdx = headerIndex(headers, ["note", "comment", "detail"]);

  if (productIdx < 0 || quantityIdx < 0) return [];

  const rows: SpreadsheetImportRow[] = [];

  for (let index = headerLineIndex + 1; index < lines.length; index += 1) {
    const cells = parseCsvLine(lines[index]);
    const productName = cells[productIdx]?.trim();
    const quantityRaw = cells[quantityIdx];
    const quantity = Number(String(quantityRaw ?? "").replace(",", "."));

    if (!productName || !Number.isFinite(quantity) || quantity <= 0) continue;

    rows.push({
      rowNumber: index + 1,
      productName,
      quantity,
      date: dateIdx >= 0 ? cells[dateIdx]?.trim() : undefined,
      reasonLabel: reasonIdx >= 0 ? cells[reasonIdx]?.trim() : undefined,
      note: noteIdx >= 0 ? cells[noteIdx]?.trim() : undefined,
    });
  }

  return rows;
}

export function previewWasteSpreadsheetImport(
  content: string,
  products: BusinessProduct[],
): SpreadsheetImportPreview {
  const rows = parseWasteSpreadsheet(content);
  const matched: SpreadsheetImportPreview["matched"] = [];
  const unmatched: SpreadsheetImportRow[] = [];

  for (const row of rows) {
    const product = matchProduct(row.productName, products);
    if (product) {
      matched.push({ ...row, businessProductId: product.id });
    } else {
      unmatched.push(row);
    }
  }

  return { rows, matched, unmatched };
}

export function toBatchEntries(
  preview: SpreadsheetImportPreview,
): BatchWasteLogEntry[] {
  return preview.matched.map((row) => ({
    businessProductId: row.businessProductId,
    quantity: row.quantity,
    note: row.note,
    occurredAt: row.date ? `${row.date}T12:00:00.000Z` : undefined,
  }));
}

export function resolveImportReasonId(
  preview: SpreadsheetImportPreview,
  reasons: WasteReason[],
) {
  const labels = preview.matched
    .map((row) => row.reasonLabel)
    .filter(Boolean) as string[];
  if (labels.length === 0) return undefined;

  const counts = new Map<string, number>();
  for (const label of labels) {
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const topLabel = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  return matchReason(topLabel, reasons)?.id;
}
