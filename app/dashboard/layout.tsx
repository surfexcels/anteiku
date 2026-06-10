import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { requireUser } from "@/src/lib/auth/require-user";
import { SupabaseBusinessRepository } from "@/src/modules/business/infrastructure/supabase-business-repository";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { supabase, userId } = await requireUser();
  const repository = new SupabaseBusinessRepository(supabase);
  const business = await repository.getCurrentForUser(userId);

  if (!business) redirect("/onboarding");

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link className="app-brand" href="/dashboard/products">
          <span>an</span>
          anteiku
        </Link>
        <nav>
          <Link href="/dashboard">Overview</Link>
          <Link href="/dashboard/products">Products</Link>
          <Link href="/dashboard/waste">Waste log</Link>
          <Link href="/dashboard/insights">Insights</Link>
          <Link href="/dashboard/reports">Reports</Link>
          <Link href="/dashboard/imports">Imports</Link>
        </nav>
        <div className="app-business">
          <span>{business.name.slice(0, 2).toUpperCase()}</span>
          <div>
            <strong>{business.name}</strong>
            <small>{business.role}</small>
          </div>
        </div>
        <form action={signOut}>
          <button className="app-signout" type="submit">
            Sign out
          </button>
        </form>
      </aside>
      <div className="app-content">{children}</div>
    </div>
  );
}
