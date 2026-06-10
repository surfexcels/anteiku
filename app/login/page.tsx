import Link from "next/link";
import { isSupabaseConfigured } from "@/src/lib/env";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Link className="auth-brand" href="/">
          <span>an</span>
          anteiku
        </Link>
        <div className="auth-copy">
          <span className="app-kicker">CAFE PROFIT INTELLIGENCE</span>
          <h1>Turn daily leftovers into better decisions.</h1>
          <p>
            Sign in to build your product menu, log waste, and see where your
            margin is quietly disappearing.
          </p>
        </div>
        <div className="auth-proof">
          <strong>Built for daily use</strong>
          <span>Fast enough for the closing shift.</span>
        </div>
      </section>

      <section className="auth-form-wrap">
        <div className="auth-form-card">
          <span className="app-kicker">WELCOME TO ANTEIKU</span>
          <h2>Access your workspace</h2>
          <p>Use your work email to continue.</p>
          {!configured || params.error === "configuration" ? (
            <div className="config-warning">
              Supabase is not configured yet. Add the values from{" "}
              <code>.env.example</code> to <code>.env.local</code>.
            </div>
          ) : (
            <LoginForm />
          )}
        </div>
      </section>
    </main>
  );
}
