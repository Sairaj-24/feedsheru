import Link from "next/link";

import { EmptyState } from "@/components/EmptyState";

export default function ListingNotFound() {
  return (
    <div className="flex min-h-dvh w-full justify-center bg-mist sm:py-8">
      <main className="flex w-full max-w-[390px] flex-col justify-center gap-6 bg-surface px-6 py-10 sm:min-h-[844px] sm:rounded-2xl sm:shadow-sm">
        <p className="text-[13px] font-semibold tracking-[0.14em] text-brand uppercase">
          FeedSheru
        </p>
        <EmptyState
          title="Listing not found"
          description="This job may have been removed, or the link is wrong."
          action={
            <Link
              href="/home"
              className="text-[14px] font-semibold text-brand hover:underline"
            >
              Back to home
            </Link>
          }
        />
      </main>
    </div>
  );
}
