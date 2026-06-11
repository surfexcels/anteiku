/** User-facing labels for supplier import processing — no internal tooling names. */
export function formatImportSourceLabel(method: string): string {
  const labels: Record<string, string> = {
    csv: "CSV file",
    excel: "Spreadsheet",
    pdfplumber: "PDF invoice",
    tesseract: "Scanned PDF",
  };
  return labels[method] ?? "Invoice";
}
