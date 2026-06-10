import type { ReactNode } from "react";
import { signOut } from "./actions";
import { DashboardShell } from "./dashboard-shell";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <DashboardShell signOutAction={signOut}>{children}</DashboardShell>;
}
