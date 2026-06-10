import { NextResponse } from "next/server";
import { cache } from "react";
import { createClient } from "@/src/lib/supabase/server";
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

  const businessRepository = new SupabaseBusinessRepository(supabase);
  const business = await businessRepository.getCurrentForUser(userId);

  if (!business) {
    return {
      error: NextResponse.json({ error: "Business not found" }, { status: 404 }),
    };
  }

  const location = await businessRepository.getPrimaryLocation(business.id);
  if (!location) {
    return {
      error: NextResponse.json({ error: "Location not found" }, { status: 404 }),
    };
  }

  return { supabase, userId, business, location };
});
