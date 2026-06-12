import { NextResponse } from "next/server";

function allowedHosts(request: Request) {
  const hosts = new Set<string>();
  const host = request.headers.get("host");

  if (host) {
    hosts.add(host.toLowerCase());
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) {
    try {
      hosts.add(new URL(siteUrl).host.toLowerCase());
    } catch {
      // Ignore invalid site URL configuration.
    }
  }

  return hosts;
}

function hostMatches(urlValue: string, hosts: Set<string>) {
  try {
    return hosts.has(new URL(urlValue).host.toLowerCase());
  } catch {
    return false;
  }
}

export function verifyMutationRequest(request: Request) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    return null;
  }

  const hosts = allowedHosts(request);
  if (hosts.size === 0) {
    return null;
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (origin && !hostMatches(origin, hosts)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!origin && referer && !hostMatches(referer, hosts)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}
