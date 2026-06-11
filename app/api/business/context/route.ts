import { NextResponse } from "next/server";
import { getBusinessContext } from "@/src/lib/auth/get-business-context";
import {
  canCloseInventoryDay,
  canExportData,
  canLogWaste,
  canManageCatalog,
} from "@/src/modules/business/domain/permissions";

export async function GET() {
  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  const role = context.business.role;

  return NextResponse.json({
    business: {
      id: context.business.id,
      name: context.business.name,
      countryCode: context.business.countryCode,
      currencyCode: context.business.currencyCode,
      role,
    },
    location: context.location,
    locations: context.locations,
    permissions: {
      canLogWaste: canLogWaste(role),
      canCloseStock: canCloseInventoryDay(role),
      canEditPrices: canManageCatalog(role),
      canExport: canExportData(role),
    },
  });
}
