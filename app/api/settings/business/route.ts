import { NextResponse } from "next/server";
import { requireTenantAdmin } from "@/src/lib/auth/require-tenant-admin";
import { verifyMutationRequest } from "@/src/lib/auth/verify-api-request";
import { updateBusinessProfileSchema } from "@/src/modules/business/application/settings-schemas";
import { SupabaseBusinessRepository } from "@/src/modules/business/infrastructure/supabase-business-repository";

export async function PATCH(request: Request) {
  const blocked = verifyMutationRequest(request);
  if (blocked) return blocked;

  const context = await requireTenantAdmin("business");
  if ("error" in context) return context.error;

  const parsed = updateBusinessProfileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid business profile", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const repository = new SupabaseBusinessRepository(context.supabase);
    await repository.updateBusinessName(context.business.id, parsed.data.name);

    return NextResponse.json({
      business: {
        id: context.business.id,
        name: parsed.data.name,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not update business profile" },
      { status: 500 },
    );
  }
}
