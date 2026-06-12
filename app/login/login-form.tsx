"use client";

import { FormEvent, useState } from "react";
import { safeClientRedirect } from "@/src/lib/auth/safe-redirect";
import { createClient } from "@/src/lib/supabase/client";

type AuthMode = "sign-in" | "sign-up";

export function LoginForm() {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("fullName") ?? "").trim();
    const supabase = createClient();

    if (mode === "sign-up") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      setMessage(
        error
          ? error.message
          : "Check your inbox to confirm your email, then return here to sign in.",
      );
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const next = new URLSearchParams(window.location.search).get("next");
    safeClientRedirect(next);
  }

  return (
    <>
      <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
        <button
          className={mode === "sign-in" ? "active" : ""}
          onClick={() => setMode("sign-in")}
          role="tab"
          type="button"
        >
          Sign in
        </button>
        <button
          className={mode === "sign-up" ? "active" : ""}
          onClick={() => setMode("sign-up")}
          role="tab"
          type="button"
        >
          Create account
        </button>
      </div>

      <form className="auth-form" onSubmit={submit}>
        {mode === "sign-up" && (
          <label>
            Your name
            <input
              autoComplete="name"
              name="fullName"
              placeholder="Elise Martin"
              required
            />
          </label>
        )}
        <label>
          Work email
          <input
            autoComplete="email"
            name="email"
            placeholder="you@yourcafe.com"
            required
            type="email"
          />
        </label>
        <label>
          Password
          <input
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            minLength={8}
            name="password"
            placeholder="At least 8 characters"
            required
            type="password"
          />
        </label>
        <button className="button primary large full" disabled={loading} type="submit">
          {loading
            ? "Please wait..."
            : mode === "sign-in"
              ? "Sign in"
              : "Create my account"}
        </button>
        {message && <p className="auth-message">{message}</p>}
      </form>
    </>
  );
}
