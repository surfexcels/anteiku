const DEFAULT_FALLBACK = "/dashboard";

export function safeRedirectPath(
  next: string | null | undefined,
  fallback = DEFAULT_FALLBACK,
) {
  if (!next) return fallback;

  const trimmed = next.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    trimmed.includes(":")
  ) {
    return fallback;
  }

  return trimmed;
}

export function resolveSafeRedirectUrl(
  next: string | null | undefined,
  origin: string,
  fallback = DEFAULT_FALLBACK,
) {
  const path = safeRedirectPath(next, fallback);
  const url = new URL(path, origin);

  if (url.origin !== origin) {
    return new URL(fallback, origin);
  }

  return url;
}

export function safeClientRedirect(
  next: string | null | undefined,
  fallback = DEFAULT_FALLBACK,
) {
  if (typeof window === "undefined") return;

  const path = safeRedirectPath(next, fallback);
  const url = new URL(path, window.location.origin);

  if (url.origin !== window.location.origin) {
    window.location.assign(fallback);
    return;
  }

  window.location.assign(`${url.pathname}${url.search}${url.hash}`);
}
