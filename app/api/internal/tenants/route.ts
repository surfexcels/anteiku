import { NextResponse } from "next/server";
import { checkPlatformAdminAccess } from "@/src/lib/auth/platform-admin";
import { isServiceRoleConfigured } from "@/src/lib/env";
import { createServiceRoleClient } from "@/src/lib/supabase/admin";
import { SupabasePlatformRepository } from "@/src/modules/platform/infrastructure/supabase-platform-repository";

export async function GET() {
  const admin = await checkPlatformAdminAccess();
  if ("error" in admin) return admin.error;

  if (!isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: "Platform admin backend is not configured" },
      { status: 503 },
    );
  }

  try {
    const repository = new SupabasePlatformRepository(createServiceRoleClient());
    const tenants = await repository.listTenants();
    return NextResponse.json({ tenants });
  } catch {
    return NextResponse.json(
      { error: "Could not load tenants" },
      { status: 500 },
    );
  }
}
