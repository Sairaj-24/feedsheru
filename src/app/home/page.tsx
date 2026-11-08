import Link from "next/link";
import { Suspense } from "react";
import { desc, eq, or } from "drizzle-orm";

import { EmptyState } from "@/components/EmptyState";
import { LogoutButton } from "@/components/LogoutButton";
import { db } from "@/db";
import { listings, type Listing, type ListingStatus } from "@/db/schema";
import { requireOnboardedUser } from "@/lib/auth/guards";
import type { PrimaryRole } from "@/lib/auth/roles";

const ROLE_LABEL: Record<PrimaryRole, string> = {
  provider: "Provider",
  maker: "Maker",
  distributor: "Distributor",
};

const ROLE_HREF: Record<PrimaryRole, string> = {
  provider: "/provider",
  maker: "/maker",
  distributor: "/distributor",
};

const ROLE_TOOL_COPY: Record<PrimaryRole, string> = {
  provider: "Create and track surplus listings",
  maker: "Claim kitchen jobs and mark meals ready",
  distributor: "Claim ready meals and log feeds",
};

const STATUS_LABEL: Record<ListingStatus, string> = {
  open: "Open",
  claimed_by_maker: "With maker",
  ready: "Ready",
  claimed_by_distributor: "With distributor",
  fed: "Fed",
  cancelled: "Cancelled",
  expired: "Expired",
};

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <p className="text-[15px] text-slate">Loading your home…</p>
        </Shell>
      }
    >
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const user = await requireOnboardedUser();
  const role = user.primaryRole;
  const display =
    user.displayName?.trim() || user.email.split("@")[0] || user.email;

  const recentListings = await db
    .select()
    .from(listings)
    .where(
      or(
        eq(listings.providerUserId, user.id),
        eq(listings.makerUserId, user.id),
        eq(listings.distributorUserId, user.id),
      ),
    )
    .orderBy(desc(listings.updatedAt))
    .limit(10);

  return (
    <Shell>
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold tracking-[0.14em] text-brand uppercase">
          FeedSheru
        </p>
        <h1 className="font-display text-[28px] leading-tight font-bold tracking-tight text-ink">
          Hi, {display}
        </h1>
        <p className="text-[15px] leading-relaxed text-slate">
          Signed in as {user.email}
        </p>
      </div>

      <div className="rounded-[16px] bg-brand-soft p-4">
        <p className="text-xs font-semibold tracking-[0.08em] text-brand uppercase">
          Your role
        </p>
        <p className="mt-1 text-[17px] font-semibold text-ink">
          {ROLE_LABEL[role]}
        </p>
        {user.cityArea ? (
          <p className="mt-1 text-[13px] text-slate">{user.cityArea}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-[13px] font-semibold text-slate">Your tools</p>
        <Link
          href={ROLE_HREF[role]}
          className="flex flex-col gap-1 rounded-[16px] border border-line px-4 py-3.5 transition-colors hover:border-brand/40"
        >
          <span className="text-[15px] font-semibold text-ink">
            {ROLE_LABEL[role]} home
          </span>
          <span className="text-[13px] text-slate">{ROLE_TOOL_COPY[role]}</span>
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-semibold text-slate">Recent activity</h2>
        {recentListings.length === 0 ? (
          <EmptyState
            title="No jobs yet"
            description="Listings you create or claim will show up here."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {recentListings.map((listing) => (
              <li key={listing.id}>
                <Link
                  href={`/listings/${listing.id}`}
                  className="flex flex-col gap-1.5 rounded-[16px] border border-line px-4 py-3.5 transition-colors hover:border-brand/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[15px] leading-snug font-semibold text-ink">
                      {listing.title}
                    </span>
                    <span className="shrink-0 rounded-md bg-brand-soft px-2 py-0.5 text-[11px] font-semibold tracking-wide text-brand uppercase">
                      {STATUS_LABEL[listing.status]}
                    </span>
                  </div>
                  <p className="text-[13px] text-slate">
                    {involvementLabel(listing, user.id)} · {listing.cityArea}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <LogoutButton />
    </Shell>
  );
}

function involvementLabel(listing: Listing, userId: string) {
  if (listing.providerUserId === userId) return "You provided";
  if (listing.makerUserId === userId) return "You claimed as maker";
  if (listing.distributorUserId === userId) {
    return "You claimed as distributor";
  }
  return "Involved";
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
