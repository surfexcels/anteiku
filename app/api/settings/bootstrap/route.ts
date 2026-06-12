import { NextResponse } from "next/server";
import { requireWorkspaceSettings } from "@/src/lib/auth/require-tenant-admin";
import {
  canManageBusinessProfile,
  canManageLocations,
  canManageTeam,
} from "@/src/modules/business/domain/permissions";
import { SupabaseBusinessRepository } from "@/src/modules/business/infrastructure/supabase-business-repository";

export async function GET() {
  const context = await requireWorkspaceSettings();
  if ("error" in context) return context.error;

  const role = context.business.role;

  try {
    const repository = new SupabaseBusinessRepository(context.supabase);
    const [locations, members] = await Promise.all([
      repository.listLocationDetails(context.business.id),
      repository.listMembers(context.business.id),
    ]);

    return NextResponse.json({
      business: {
        id: context.business.id,
        name: context.business.name,
        countryCode: context.business.countryCode,
        currencyCode: context.business.currencyCode,
        timezone: context.business.timezone,
        role,
      },
      activeLocationId: context.location.id,
      locations,
      members,
      permissions: {
        canManageLocations: canManageLocations(role),
        canManageTeam: canManageTeam(role),
        canManageBusinessProfile: canManageBusinessProfile(role),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not load workspace settings" },
      { status: 500 },
    );
  }
}
