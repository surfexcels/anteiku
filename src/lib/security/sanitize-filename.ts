export function sanitizeFilename(filename: string) {
  const trimmed = filename.trim();
  const base = trimmed.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
  const withoutLeadingDots = base.replace(/^\.+/, "");
  return (withoutLeadingDots || "upload").slice(0, 120);
}
