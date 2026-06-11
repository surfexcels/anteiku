import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cache } from "react";
import { createClient } from "@/src/lib/supabase/server";
import { WORKSPACE_LOCATION_COOKIE } from "@/src/lib/auth/workspace-cookies";
import { resolveWorkspaceContext } from "@/src/modules/business/application/resolve-workspace-context";
import { SupabaseBusinessRepository } from "@/src/modules/business/infrastructure/supabase-business-repository";

export const getBusinessContext = cache(async function getBusinessContext() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const cookieStore = await cookies();
  const requestedLocationId =
    cookieStore.get(WORKSPACE_LOCATION_COOKIE)?.value ?? null;

  const businessRepository = new SupabaseBusinessRepository(supabase);
  const workspace = await resolveWorkspaceContext(
    businessRepository,
    userId,
    requestedLocationId,
  );

  if (!workspace) {
    return {
      error: NextResponse.json({ error: "Business not found" }, { status: 404 }),
    };
  }

  return {
    supabase,
    userId,
    business: workspace.business,
    location: workspace.location,
    locations: workspace.locations,
  };
});
