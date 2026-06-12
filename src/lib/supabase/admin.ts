import { createClient } from "@supabase/supabase-js";
import { getServiceRoleEnv } from "@/src/lib/env";

export function createServiceRoleClient() {
  const { url, secretKey } = getServiceRoleEnv();

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
