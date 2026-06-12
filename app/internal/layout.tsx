import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isPlatformAdminUser } from "@/src/lib/auth/platform-admin";
import { AnteikuLogo } from "@/app/components/anteiku-logo";

export default async function InternalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const allowed = await isPlatformAdminUser();
  if (!allowed) {
    redirect("/dashboard");
  }

  return (
    <div className="internal-shell">
      <header className="internal-header">
        <AnteikuLogo href="/internal" size="sm" variant="sidebar" />
        <div className="internal-header-copy">
          <strong>Platform console</strong>
          <span>Anteiku internal · cross-tenant read-only</span>
        </div>
        <Link className="internal-back-link" href="/dashboard">
          Back to app
        </Link>
      </header>
      {children}
    </div>
  );
}
