import { and, desc, eq, ilike } from "drizzle-orm";
import { Suspense } from "react";

import { MakerShell } from "@/components/maker/MakerShell";
import { OpenListingCard } from "@/components/maker/OpenListingCard";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { requireRole } from "@/lib/auth/guards";

export default function MakerBrowsePage() {
  return (
    <Suspense
      fallback={
        <MakerShell activeTab="browse">
          <p className="text-[15px] text-slate">Loading open jobs…</p>
        </MakerShell>
      }
    >
      <MakerBrowseContent />
    </Suspense>
  );
}

async function MakerBrowseContent() {
  const user = await requireRole("maker");

  const filters = [
    eq(listings.status, "open"),
    eq(listings.path, "needs_kitchen"),
  ];

  const cityArea = user.cityArea?.trim();
  if (cityArea) {
    filters.push(ilike(listings.cityArea, cityArea));
  }

  const openListings = await db
    .select()
    .from(listings)
    .where(and(...filters))
    .orderBy(desc(listings.createdAt));

  return (
    <MakerShell activeTab="browse">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[28px] leading-tight font-bold tracking-tight text-ink">
          Open kitchen jobs
        </h1>
        <p className="text-[15px] leading-relaxed text-slate">
          {cityArea
            ? `Surplus near ${cityArea} that needs cooking.`
            : "Surplus that needs cooking. Add a city area in onboarding next time to filter closer jobs."}
        </p>
      </div>

      {openListings.length === 0 ? (
        <div className="rounded-[16px] bg-mist px-4 py-6">
          <p className="text-[15px] font-medium text-ink">No open jobs right now</p>
          <p className="mt-1 text-[13px] leading-relaxed text-slate">
            When a provider posts leftovers that need a kitchen, they will show up
            here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {openListings.map((listing) => (
            <OpenListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </MakerShell>
  );
}
