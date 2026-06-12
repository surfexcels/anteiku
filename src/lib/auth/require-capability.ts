import { NextResponse } from "next/server";
import { getBusinessContext } from "@/src/lib/auth/get-business-context";
import type { MembershipRole } from "@/src/modules/business/domain/business";
import {
  canCloseInventoryDay,
  canEditOpeningStock,
  canExportData,
  canManageBusinessProfile,
  canManageCatalog,
} from "@/src/modules/business/domain/permissions";

export type AppCapability =
  | "manageCatalog"
  | "closeInventory"
  | "editOpeningStock"
  | "exportData"
  | "manageBusinessProfile";

function hasCapability(role: MembershipRole, capability: AppCapability) {
  switch (capability) {
    case "manageCatalog":
      return canManageCatalog(role);
    case "closeInventory":
      return canCloseInventoryDay(role);
    case "editOpeningStock":
      return canEditOpeningStock(role);
    case "exportData":
      return canExportData(role);
    case "manageBusinessProfile":
      return canManageBusinessProfile(role);
  }
}

export async function requireCapability(capability: AppCapability) {
  const context = await getBusinessContext();
  if ("error" in context) return context;

  if (!hasCapability(context.business.role, capability)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return context;
}

export async function requireAnyCapability(capabilities: AppCapability[]) {
  const context = await getBusinessContext();
  if ("error" in context) return context;

  const allowed = capabilities.some((capability) =>
    hasCapability(context.business.role, capability),
  );

  if (!allowed) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return context;
}
