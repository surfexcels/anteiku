import { NextResponse } from "next/server";
import { requireCapability } from "@/src/lib/auth/require-capability";
import { verifyMutationRequest } from "@/src/lib/auth/verify-api-request";
import { updateRecommendationSchema } from "@/src/modules/recommendations/application/recommendation-schemas";
import { SupabaseRecommendationRepository } from "@/src/modules/recommendations/infrastructure/supabase-recommendation-repository";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const blocked = verifyMutationRequest(request);
  if (blocked) return blocked;

  const context = await requireCapability("manageCatalog");
  if ("error" in context) return context.error;

  const { id } = await params;
  const parsed = updateRecommendationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const repository = new SupabaseRecommendationRepository(context.supabase);
    const recommendation = await repository.updateStatus(
      context.business.id,
      id,
      parsed.data.status,
    );
    return NextResponse.json({ recommendation });
  } catch {
    return NextResponse.json(
      { error: "Could not update recommendation" },
      { status: 500 },
    );
  }
}
