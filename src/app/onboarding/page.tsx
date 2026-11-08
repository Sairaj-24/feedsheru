import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { LogoutButton } from "@/components/LogoutButton";
import { getCurrentUser } from "@/lib/auth/session";

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <p className="text-[15px] text-slate">Checking your session…</p>
        </Shell>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}

async function OnboardingContent() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  return (
    <Shell>
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold tracking-[0.14em] text-brand uppercase">
          FeedSheru
        </p>
        <h1 className="font-display text-[28px] leading-tight font-bold tracking-tight text-ink">
          You&apos;re signed in
        </h1>
        <p className="text-[15px] leading-relaxed text-slate">
          Signed in as {user.email}. Next you&apos;ll choose how you help —
          Provider, Maker, or Distributor.
        </p>
      </div>

      <LogoutButton />

      <Link
        href="/"
        className="text-center text-[13px] font-medium text-brand underline-offset-2 hover:underline"
      >
        Back to login
      </Link>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full justify-center bg-mist sm:py-8">
      <main className="flex w-full max-w-[390px] flex-col justify-center gap-6 bg-surface px-6 py-10 sm:min-h-[844px] sm:rounded-2xl sm:shadow-sm">
        {children}
      </main>
    </div>
  );
}
