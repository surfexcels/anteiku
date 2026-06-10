import { NextResponse } from "next/server";
import { getBusinessContext } from "@/src/lib/auth/get-business-context";

export async function GET() {
  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  return NextResponse.json({
    business: {
      id: context.business.id,
      name: context.business.name,
      countryCode: context.business.countryCode,
      currencyCode: context.business.currencyCode,
      role: context.business.role,
    },
  });
}
