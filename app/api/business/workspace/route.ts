import { NextResponse } from "next/server";
import { z } from "zod";
import { getBusinessContext } from "@/src/lib/auth/get-business-context";
import {
  WORKSPACE_COOKIE_MAX_AGE,
  WORKSPACE_LOCATION_COOKIE,
} from "@/src/lib/auth/workspace-cookies";
import { SupabaseBusinessRepository } from "@/src/modules/business/infrastructure/supabase-business-repository";

const patchSchema = z.object({
  locationId: z.string().uuid(),
});

export async function PATCH(request: Request) {
  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid workspace update", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const activeLocation = context.locations.find(
    (location) => location.id === parsed.data.locationId,
  );

  if (!activeLocation) {
    return NextResponse.json({ error: "Location not found" }, { status: 400 });
  }

  try {
    const repository = new SupabaseBusinessRepository(context.supabase);
    await repository.setActiveLocationPreference(
      context.userId,
      context.business.id,
      activeLocation.id,
    );
  } catch {
    return NextResponse.json(
      { error: "Could not save workspace preference" },
      { status: 500 },
    );
  }

  const response = NextResponse.json({ location: activeLocation });
  response.cookies.set(WORKSPACE_LOCATION_COOKIE, activeLocation.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: WORKSPACE_COOKIE_MAX_AGE,
  });

  return response;
}
