import { NextResponse } from "next/server";
import { checkPlatformAdminAccess } from "@/src/lib/auth/platform-admin";
import { isServiceRoleConfigured } from "@/src/lib/env";
import { createServiceRoleClient } from "@/src/lib/supabase/admin";
import { SupabasePlatformRepository } from "@/src/modules/platform/infrastructure/supabase-platform-repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await checkPlatformAdminAccess();
  if ("error" in admin) return admin.error;

  if (!isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: "Platform admin backend is not configured" },
      { status: 503 },
    );
  }

  const { id } = await params;

  try {
    const repository = new SupabasePlatformRepository(createServiceRoleClient());
    const tenant = await repository.getTenant(id);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json({ tenant });
  } catch {
    return NextResponse.json(
      { error: "Could not load tenant" },
      { status: 500 },
    );
  }
}
