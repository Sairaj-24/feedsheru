import Link from "next/link";
import { Suspense } from "react";
import { and, desc, eq, isNull, or } from "drizzle-orm";

import { ActiveJobCard } from "@/components/distributor/ActiveJobCard";
import { ClaimableJobCard } from "@/components/distributor/ClaimableJobCard";
import { DistributorEmptyState } from "@/components/distributor/DistributorEmptyState";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { requireRole } from "@/lib/auth/guards";

export default function DistributorPage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <p className="text-[15px] text-slate">Loading jobs…</p>
        </Shell>
      }
    >
      <DistributorContent />
    </Suspense>
  );
}

async function DistributorContent() {
  const user = await requireRole("distributor");

  const [available, active] = await Promise.all([
    db
      .select()
      .from(listings)
      .where(
        and(
          isNull(listings.distributorUserId),
          or(
            eq(listings.status, "ready"),
            and(
              eq(listings.status, "open"),
              eq(listings.path, "ready_to_feed"),
            ),
          ),
        ),
      )
      .orderBy(desc(listings.createdAt)),
    db
      .select()
      .from(listings)
      .where(
        and(
          eq(listings.status, "claimed_by_distributor"),
          eq(listings.distributorUserId, user.id),
        ),
      )
      .orderBy(desc(listings.updatedAt)),
  ]);

  return (
    <Shell>
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold tracking-[0.14em] text-brand uppercase">
          FeedSheru
        </p>
        <h1 className="font-display text-[28px] leading-tight font-bold tracking-tight text-ink">
          Distributor
        </h1>
        <p className="text-[15px] leading-relaxed text-slate">
          Claim ready meals and log when street dogs are fed.
        </p>
      </div>

      <Link
        href="/home"
        className="text-[13px] font-semibold text-brand hover:underline"
      >
        ← Home
      </Link>

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-semibold tracking-[0.06em] text-slate uppercase">
          Your active runs
        </h2>
        {active.length === 0 ? (
          <DistributorEmptyState
            title="No active runs"
            description="Claim a job below, then log the feed when you're done."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {active.map((listing) => (
              <ActiveJobCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-semibold tracking-[0.06em] text-slate uppercase">
          Available jobs
        </h2>
        {available.length === 0 ? (
          <DistributorEmptyState
            title="No jobs right now"
            description="Check back when makers mark meals ready, or when providers post ready-to-feed surplus."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {available.map((listing) => (
              <ClaimableJobCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>
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
