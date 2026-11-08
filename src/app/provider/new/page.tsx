import Link from "next/link";
import { Suspense } from "react";

import { CreateListingForm } from "@/components/provider/CreateListingForm";
import { requireRole } from "@/lib/auth/guards";

export default function NewListingPage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <p className="text-[15px] text-slate">Loading form…</p>
        </Shell>
      }
    >
      <NewListingContent />
    </Suspense>
  );
}

async function NewListingContent() {
  const user = await requireRole("provider");

  return (
    <Shell>
      <div className="flex justify-end">
        <Link
          href="/provider"
          className="text-[13px] font-semibold text-brand"
        >
          Back to listings
        </Link>
      </div>
      <CreateListingForm defaultCityArea={user.cityArea ?? ""} />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full justify-center bg-mist sm:py-8">
      <main className="flex w-full max-w-[390px] flex-col gap-6 bg-surface px-6 py-10 sm:min-h-[844px] sm:rounded-2xl sm:shadow-sm">
        {children}
      </main>
    </div>
  );
}
