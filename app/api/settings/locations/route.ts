import { NextResponse } from "next/server";
import { requireTenantAdmin } from "@/src/lib/auth/require-tenant-admin";
import { verifyMutationRequest } from "@/src/lib/auth/verify-api-request";
import { createLocationSchema } from "@/src/modules/business/application/settings-schemas";
import { SupabaseBusinessRepository } from "@/src/modules/business/infrastructure/supabase-business-repository";

export async function POST(request: Request) {
  const blocked = verifyMutationRequest(request);
  if (blocked) return blocked;

  const context = await requireTenantAdmin("locations");
  if ("error" in context) return context.error;

  const parsed = createLocationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid location", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const repository = new SupabaseBusinessRepository(context.supabase);
    const location = await repository.createLocation({
      businessId: context.business.id,
      name: parsed.data.name,
      countryCode: context.business.countryCode,
      timezone: context.business.timezone,
    });

    return NextResponse.json({ location }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("unique")
        ? "A location with that name already exists."
        : "Could not create location";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
