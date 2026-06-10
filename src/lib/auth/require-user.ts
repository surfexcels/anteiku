import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/src/lib/env";
import { createClient } from "@/src/lib/supabase/server";

export async function requireUser() {
  if (!isSupabaseConfigured()) {
    redirect("/login?error=configuration");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || !userId) {
    redirect("/login");
  }

  return { supabase, userId };
}
