import { Suspense } from "react";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/LogoutButton";
import { OnboardingForm } from "@/components/OnboardingForm";
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
  if (user.primaryRole) {
    redirect("/home");
  }

  return (
    <Shell>
      <OnboardingForm email={user.email} />
      <LogoutButton variant="secondary" />
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
