export function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text) || /^\s|\s$/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function formatCsvMoney(minor: number): string {
  return (minor / 100).toFixed(2);
}

export function formatCsvNumber(value: number, decimals = 3): string {
  return value.toFixed(decimals);
}

export function buildCsvRow(
  cells: Array<string | number | null | undefined>,
): string {
  return cells.map((cell) => escapeCsvCell(cell)).join(",");
}

export function withCsvBom(content: string): string {
  return `\uFEFF${content}`;
}
