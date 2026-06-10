import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseEnv } from "@/src/lib/env";

export function createClient() {
  const { url, publishableKey } = getPublicSupabaseEnv();
  return createBrowserClient(url, publishableKey);
}
