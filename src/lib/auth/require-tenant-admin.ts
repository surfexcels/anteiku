import { NextResponse } from "next/server";
import { getBusinessContext } from "@/src/lib/auth/get-business-context";
import type { MembershipRole } from "@/src/modules/business/domain/business";
import {
  canManageBusinessProfile,
  canManageLocations,
  canManageTeam,
} from "@/src/modules/business/domain/permissions";

type TenantAdminCapability = "locations" | "team" | "business";

function hasCapability(role: MembershipRole, capability: TenantAdminCapability) {
  if (capability === "business") return canManageBusinessProfile(role);
  if (capability === "locations") return canManageLocations(role);
  return canManageTeam(role);
}

export async function requireTenantAdmin(capability: TenantAdminCapability) {
  const context = await getBusinessContext();
  if ("error" in context) return context;

  if (!hasCapability(context.business.role, capability)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return context;
}

export async function requireWorkspaceSettings() {
  const context = await getBusinessContext();
  if ("error" in context) return context;

  const role = context.business.role;
  const allowed =
    canManageLocations(role) || canManageTeam(role) || canManageBusinessProfile(role);

  if (!allowed) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return context;
}
