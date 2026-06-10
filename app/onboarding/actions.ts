"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/src/lib/auth/require-user";

const onboardingSchema = z.object({
  name: z.string().trim().min(2).max(120),
  countryCode: z.string().length(2).toUpperCase(),
  currencyCode: z.string().length(3).toUpperCase(),
  timezone: z.string().min(3).max(80),
});

export async function createBusiness(formData: FormData) {
  const input = onboardingSchema.parse({
    name: formData.get("name"),
    countryCode: formData.get("countryCode"),
    currencyCode: formData.get("currencyCode"),
    timezone: formData.get("timezone"),
  });

  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("create_business_with_owner", {
    business_name: input.name,
    business_country_code: input.countryCode,
    business_currency_code: input.currencyCode,
    business_timezone: input.timezone,
  });

  if (error) {
    throw new Error(`Could not create business: ${error.message}`);
  }

  redirect("/dashboard/products");
}
