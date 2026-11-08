"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2m0 14H4V8l8 5 8-5zm-8-7L4 6h16z" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2m-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2m3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1z" />
    </svg>
  );
}

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);

    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const payload =
        mode === "signup"
          ? { email, password, confirmPassword }
          : { email, password };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      router.push("/onboarding");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-dvh w-full justify-center bg-mist sm:py-8">
      <main className="flex w-full max-w-[390px] flex-col overflow-hidden bg-surface shadow-none sm:min-h-[844px] sm:rounded-2xl sm:shadow-sm">
        <div className="relative h-[280px] w-full shrink-0 overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=900&q=80"
            alt="A friendly dog outdoors"
            fill
            priority
            className="object-cover object-[center_20%]"
            sizes="390px"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[72px] bg-gradient-to-t from-surface to-transparent" />
        </div>

        <div className="flex flex-1 flex-col gap-[18px] px-6 pt-2 pb-7">
          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-semibold tracking-[0.14em] text-brand uppercase">
              FeedSheru
            </p>
            <h1 className="font-display text-[32px] leading-[1.12] font-bold tracking-tight text-ink">
              Sheru needs your help
            </h1>
            <p className="text-[15px] leading-relaxed text-slate">
              {mode === "login"
                ? "Sign in to move leftover food from kitchens to street dogs near you."
                : "Create an account to start helping street dogs near you."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
            <label className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-slate">Email</span>
              <span className="flex h-[52px] items-center gap-2.5 rounded-[12px] border border-line bg-surface px-3.5 focus-within:border-brand">
                <MailIcon className="size-5 shrink-0 text-slate" />
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-slate"
                />
              </span>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-slate">
                Password
              </span>
              <span className="flex h-[52px] items-center gap-2.5 rounded-[12px] border border-line bg-surface px-3.5 focus-within:border-brand">
                <LockIcon className="size-5 shrink-0 text-slate" />
                <input
                  type="password"
                  name="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-slate"
                />
              </span>
            </label>

            {mode === "signup" ? (
              <label className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold text-slate">
                  Confirm password
                </span>
                <span className="flex h-[52px] items-center gap-2.5 rounded-[12px] border border-line bg-surface px-3.5 focus-within:border-brand">
                  <LockIcon className="size-5 shrink-0 text-slate" />
                  <input
                    type="password"
                    name="confirmPassword"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-slate"
                  />
                </span>
              </label>
            ) : null}

            {error ? (
              <p className="text-[13px] leading-snug text-red-700" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={pending}
              className="flex h-[52px] w-full items-center justify-center rounded-[12px] bg-brand text-base font-semibold text-on-brand transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60"
            >
              {pending
                ? mode === "login"
                  ? "Signing in…"
                  : "Creating account…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          <p className="text-center text-[13px] text-slate">
            {mode === "login" ? (
              <>
                New here?{" "}
                <button
                  type="button"
                  className="font-semibold text-brand"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setConfirmPassword("");
                  }}
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="font-semibold text-brand"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setConfirmPassword("");
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </p>

          <div className="mt-auto flex flex-col gap-1.5 rounded-[16px] bg-brand-soft p-4">
            <p className="text-xs font-semibold tracking-[0.08em] text-brand uppercase">
              After you sign in
            </p>
            <p className="text-sm leading-snug text-ink">
              Choose how you help — Provider, Maker, or Distributor
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
