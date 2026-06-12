import { NextResponse } from "next/server";
import { resolveSafeRedirectUrl } from "@/src/lib/auth/safe-redirect";
import { createClient } from "@/src/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const destination = resolveSafeRedirectUrl(next, url.origin);
      return NextResponse.redirect(destination);
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=auth_callback", url.origin),
  );
}
