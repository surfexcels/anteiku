const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function isSupabaseConfigured() {
  return Boolean(publicSupabaseUrl && publicSupabaseKey);
}

export function getPublicSupabaseEnv() {
  if (!publicSupabaseUrl || !publicSupabaseKey) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return {
    url: publicSupabaseUrl,
    publishableKey: publicSupabaseKey,
  };
}
