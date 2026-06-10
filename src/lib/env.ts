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
