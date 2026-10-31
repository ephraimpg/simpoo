"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function AdminLogin({ configured }: { configured: boolean }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Move focus straight to the first field so keyboard/screen-reader users can type immediately.
  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;

    if (!password) {
      setError("Please enter your password.");
      passwordRef.current?.focus();
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: username || "admin", password }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Login failed. Check your username and password.");
        setBusy(false);
        passwordRef.current?.focus();
        passwordRef.current?.select();
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please check your connection and try again.");
      setBusy(false);
      passwordRef.current?.focus();
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-maroon-950 px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-8 shadow-2xl">
        <div className="flex justify-center">
          <img
            src="/images/mainflow-logo.jpg"
            alt="Mainflow School — Unlock Every Potential"
            width={447}
            height={447}
            className="h-44 w-auto rounded-2xl object-contain"
          />
        </div>
        <h1 className="mt-6 text-center font-heading text-2xl font-bold text-ink-900">Staff login</h1>
        <p className="mt-2 text-center text-sm text-ink-500">
          Sign in to manage school information, photographs, FAQs and admissions enquiries.
        </p>

        {!configured ? (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-ink-300 bg-ink-50 px-4 py-3 text-sm text-ink-800"
          >
            Admin login is not configured on this server. Set{" "}
            <code className="rounded bg-ink-100 px-1">ADMIN_PASSWORD</code> and{" "}
            <code className="rounded bg-ink-100 px-1">SESSION_SECRET</code> in{" "}
            <code className="rounded bg-ink-100 px-1">.env.local</code>, then restart the server.
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="admin-username" className="mb-1.5 block text-sm font-semibold text-ink-800">
              Username
            </label>
            <input
              id="admin-username"
              ref={usernameRef}
              type="text"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="field"
              placeholder="Your staff username"
              aria-describedby="admin-username-hint"
            />
            <p id="admin-username-hint" className="mt-1 text-xs text-ink-400">
              Leave blank if you use the shared admin password.
            </p>
          </div>

          <div>
            <label htmlFor="admin-password" className="mb-1.5 block text-sm font-semibold text-ink-800">
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                ref={passwordRef}
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field !pr-24"
                placeholder="Enter your password"
                aria-describedby={error ? "admin-login-error" : undefined}
                aria-invalid={error ? true : undefined}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink-500 transition-colors hover:bg-maroon-50 hover:text-maroon-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-500"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Errors announced politely for screen readers, visibly for everyone. */}
          <div aria-live="polite" role={error ? "alert" : undefined}>
            {error ? (
              <p
                id="admin-login-error"
                className="rounded-lg border border-maroon-300 bg-maroon-50 px-3 py-2 text-sm font-medium text-maroon-700"
              >
                {error}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={busy || !configured}
            aria-busy={busy}
            className="btn-maroon w-full"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
