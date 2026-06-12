import { NextResponse } from "next/server";
import { requireTenantAdmin } from "@/src/lib/auth/require-tenant-admin";
import { verifyMutationRequest } from "@/src/lib/auth/verify-api-request";
import { updateLocationSchema } from "@/src/modules/business/application/settings-schemas";
import { SupabaseBusinessRepository } from "@/src/modules/business/infrastructure/supabase-business-repository";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const blocked = verifyMutationRequest(request);
  if (blocked) return blocked;

  const context = await requireTenantAdmin("locations");
  if ("error" in context) return context.error;

  const { id } = await params;
  const parsed = updateLocationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid location update", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.isActive === false) {
    const repository = new SupabaseBusinessRepository(context.supabase);
    const activeCount = await repository.countActiveLocations(context.business.id);
    if (activeCount <= 1) {
      return NextResponse.json(
        { error: "You must keep at least one active location." },
        { status: 400 },
      );
    }
  }

  try {
    const repository = new SupabaseBusinessRepository(context.supabase);
    const location = await repository.updateLocation({
      businessId: context.business.id,
      locationId: id,
      name: parsed.data.name,
      isActive: parsed.data.isActive,
    });

    return NextResponse.json({ location });
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("unique")
        ? "A location with that name already exists."
        : "Could not update location";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
