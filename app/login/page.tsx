import { AnteikuLogo } from "@/app/components/anteiku-logo";
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
        <AnteikuLogo
          href="/"
          size="lg"
          tagline="Cafe operations & profit"
          variant="auth"
        />
        <div className="auth-copy">
          <h1>Run your café with clearer numbers.</h1>
          <p>
            Sign in to manage your menu, daily stock counts, waste, supplier
            imports, and margin insights — in one workspace.
          </p>
        </div>
        <div className="auth-proof">
          <strong>Built for daily use</strong>
          <span>Fast enough for the closing shift.</span>
        </div>
      </section>

      <section className="auth-form-wrap">
        <div className="auth-form-card">
          <span className="app-kicker">Sign in</span>
          <h2>Access your workspace</h2>
          <p>Use your work email to continue to your dashboard.</p>
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
