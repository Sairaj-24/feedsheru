"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import type { PrimaryRole } from "@/lib/auth/roles";

const ROLES: {
  id: PrimaryRole;
  title: string;
  description: string;
}[] = [
  {
    id: "provider",
    title: "Provider",
    description: "Share surplus food from your kitchen or shop.",
  },
  {
    id: "maker",
    title: "Maker",
    description: "Turn leftovers into animal-safe meals.",
  },
  {
    id: "distributor",
    title: "Distributor",
    description: "Deliver ready meals to street dogs nearby.",
  },
];

export function OnboardingForm({ email }: { email: string }) {
  const router = useRouter();
  const [primaryRole, setPrimaryRole] = useState<PrimaryRole | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [cityArea, setCityArea] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!primaryRole) {
      setError("Choose how you want to help.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryRole,
          displayName: displayName.trim() || undefined,
          cityArea: cityArea.trim() || undefined,
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      router.push("/home");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold tracking-[0.14em] text-brand uppercase">
          FeedSheru
        </p>
        <h1 className="font-display text-[28px] leading-tight font-bold tracking-tight text-ink">
          How will you help?
        </h1>
        <p className="text-[15px] leading-relaxed text-slate">
          Signed in as {email}. Pick one role to start — you can do more later.
        </p>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">Primary role</legend>
        {ROLES.map((role) => {
          const selected = primaryRole === role.id;
          return (
            <button
              key={role.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setPrimaryRole(role.id)}
              className={`flex flex-col gap-1 rounded-[16px] border px-4 py-3.5 text-left transition-colors ${
                selected
                  ? "border-brand bg-brand-soft"
                  : "border-line bg-surface hover:border-brand/40"
              }`}
            >
              <span className="text-[15px] font-semibold text-ink">
                {role.title}
              </span>
              <span className="text-[13px] leading-snug text-slate">
                {role.description}
              </span>
            </button>
          );
        })}
      </fieldset>

      <label className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-slate">
          Display name{" "}
          <span className="font-normal text-slate/80">(optional)</span>
        </span>
        <span className="flex h-[52px] items-center rounded-[12px] border border-line bg-surface px-3.5 focus-within:border-brand">
          <input
            type="text"
            name="displayName"
            autoComplete="nickname"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="What should we call you?"
            className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-slate"
          />
        </span>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-slate">
          City / area{" "}
          <span className="font-normal text-slate/80">(optional)</span>
        </span>
        <span className="flex h-[52px] items-center rounded-[12px] border border-line bg-surface px-3.5 focus-within:border-brand">
          <input
            type="text"
            name="cityArea"
            autoComplete="address-level2"
            value={cityArea}
            onChange={(event) => setCityArea(event.target.value)}
            placeholder="e.g. Indiranagar, Bengaluru"
            className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-slate"
          />
        </span>
      </label>

      {error ? (
        <p className="text-[13px] leading-snug text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || !primaryRole}
        className="flex h-[52px] w-full items-center justify-center rounded-[12px] bg-brand text-base font-semibold text-on-brand transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
