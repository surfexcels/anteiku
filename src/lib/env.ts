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

const openAiApiKey = process.env.OPENAI_API_KEY;
const openAiModel = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export function isOpenAIConfigured() {
  return Boolean(openAiApiKey?.trim());
}

export function getOpenAIEnv() {
  if (!openAiApiKey?.trim()) {
    throw new Error(
      "OpenAI is not configured. Add OPENAI_API_KEY to your server environment.",
    );
  }

  return {
    apiKey: openAiApiKey.trim(),
    model: openAiModel.trim() || "gpt-4o-mini",
  };
}

const ocrServiceUrl = process.env.OCR_SERVICE_URL ?? "http://127.0.0.1:8000";

export function isOcrServiceConfigured() {
  return Boolean(ocrServiceUrl.trim());
}

export function getOcrServiceUrl() {
  return ocrServiceUrl.replace(/\/$/, "");
}

const superAdminEmails = process.env.ANTEIKU_SUPER_ADMIN_EMAILS ?? "";

export function getSuperAdminEmails() {
  return superAdminEmails
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isSuperAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  const allowlist = getSuperAdminEmails();
  if (allowlist.length === 0) return false;
  return allowlist.includes(email.trim().toLowerCase());
}

const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

export function isServiceRoleConfigured() {
  return Boolean(supabaseSecretKey?.trim());
}

export function getServiceRoleEnv() {
  if (!supabaseSecretKey?.trim()) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not configured. Required for platform admin operations.",
    );
  }

  const { url } = getPublicSupabaseEnv();
  return {
    url,
    secretKey: supabaseSecretKey.trim(),
  };
}
