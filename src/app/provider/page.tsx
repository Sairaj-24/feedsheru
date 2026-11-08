import Link from "next/link";
import { Suspense } from "react";
import { desc, eq } from "drizzle-orm";

import { ProviderListings } from "@/components/provider/ProviderListings";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { requireRole } from "@/lib/auth/guards";

export default function ProviderPage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <p className="text-[15px] text-slate">Loading listings…</p>
        </Shell>
      }
    >
      <ProviderContent />
    </Suspense>
  );
}

async function ProviderContent() {
  const user = await requireRole("provider");

  const myListings = await db
    .select()
    .from(listings)
    .where(eq(listings.providerUserId, user.id))
    .orderBy(desc(listings.createdAt));

  return (
    <Shell>
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold tracking-[0.14em] text-brand uppercase">
          FeedSheru
        </p>
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display text-[28px] leading-tight font-bold tracking-tight text-ink">
            My listings
          </h1>
          <Link
            href="/home"
            className="shrink-0 pt-1 text-[13px] font-semibold text-brand"
          >
            Home
          </Link>
        </div>
        <p className="text-[15px] leading-relaxed text-slate">
          Surplus you published for makers and distributors.
        </p>
      </div>

      {myListings.length > 0 ? (
        <Link
          href="/provider/new"
          className="flex h-[52px] w-full items-center justify-center rounded-[12px] bg-brand text-base font-semibold text-on-brand transition-opacity hover:opacity-90 active:opacity-80"
        >
          New listing
        </Link>
      ) : null}

      <ProviderListings listings={myListings} />
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
