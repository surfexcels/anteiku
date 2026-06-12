import { NextResponse } from "next/server";
import { cache } from "react";
import { isServiceRoleConfigured, isSuperAdminEmail } from "@/src/lib/env";
import { createClient } from "@/src/lib/supabase/server";
import { createServiceRoleClient } from "@/src/lib/supabase/admin";

export interface PlatformAdminContext {
  userId: string;
  email: string;
}

async function readSessionEmail() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  const email =
    typeof data?.claims?.email === "string" ? data.claims.email : undefined;

  if (!userId || !email) {
    return null;
  }

  return { userId, email };
}

async function isRegisteredPlatformAdmin(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01") return false;
    throw error;
  }

  return Boolean(data);
}

async function provisionPlatformAdmin(userId: string, email: string) {
  if (!isServiceRoleConfigured()) return false;

  const admin = createServiceRoleClient();
  const { error } = await admin.from("platform_admins").upsert(
    {
      user_id: userId,
      email: email.trim().toLowerCase(),
    },
    { onConflict: "user_id" },
  );

  if (error) throw error;
  return true;
}

async function ensurePlatformAdmin(session: { userId: string; email: string }) {
  if (!(await isRegisteredPlatformAdmin(session.userId))) {
    await provisionPlatformAdmin(session.userId, session.email);
  }

  return isRegisteredPlatformAdmin(session.userId);
}

export const checkPlatformAdminAccess = cache(async function checkPlatformAdminAccess() {
  const session = await readSessionEmail();
  if (!session) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!isSuperAdminEmail(session.email)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  try {
    const registered = await ensurePlatformAdmin(session);
    if (!registered) {
      return {
        error: NextResponse.json(
          { error: "Platform admin provisioning failed" },
          { status: 503 },
        ),
      };
    }
  } catch {
    return {
      error: NextResponse.json(
        { error: "Platform admin provisioning failed" },
        { status: 500 },
      ),
    };
  }

  return {
    userId: session.userId,
    email: session.email,
  } satisfies PlatformAdminContext;
});

export async function isPlatformAdminUser() {
  const session = await readSessionEmail();
  if (!session || !isSuperAdminEmail(session.email)) {
    return false;
  }

  try {
    return await ensurePlatformAdmin(session);
  } catch {
    return false;
  }
}
