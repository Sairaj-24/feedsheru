import { and, desc, eq, inArray } from "drizzle-orm";
import { Suspense } from "react";

import { ActiveListingCard } from "@/components/maker/ActiveListingCard";
import { MakerShell } from "@/components/maker/MakerShell";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { requireRole } from "@/lib/auth/guards";

export default function MakerActivePage() {
  return (
    <Suspense
      fallback={
        <MakerShell activeTab="active">
          <p className="text-[15px] text-slate">Loading your kitchen…</p>
        </MakerShell>
      }
    >
      <MakerActiveContent />
    </Suspense>
  );
}

async function MakerActiveContent() {
  const user = await requireRole("maker");

  const mine = await db
    .select()
    .from(listings)
    .where(
      and(
        eq(listings.makerUserId, user.id),
        eq(listings.path, "needs_kitchen"),
        inArray(listings.status, ["claimed_by_maker", "ready"]),
      ),
    )
    .orderBy(desc(listings.updatedAt));

  const inKitchen = mine.filter((row) => row.status === "claimed_by_maker");
  const markedReady = mine.filter((row) => row.status === "ready");

  return (
    <MakerShell activeTab="active">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[28px] leading-tight font-bold tracking-tight text-ink">
          My kitchen
        </h1>
        <p className="text-[15px] leading-relaxed text-slate">
          Claimed jobs wait here until you mark them ready for distributors.
        </p>
      </div>

      {mine.length === 0 ? (
        <div className="rounded-[16px] bg-mist px-4 py-6">
          <p className="text-[15px] font-medium text-ink">Nothing in the kitchen</p>
          <p className="mt-1 text-[13px] leading-relaxed text-slate">
            Claim an open job to start cooking animal-safe meals.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-4">
            <h2 className="text-[13px] font-semibold tracking-[0.08em] text-slate uppercase">
              In progress ({inKitchen.length})
            </h2>
            {inKitchen.length === 0 ? (
              <p className="text-[14px] text-slate">No active claims.</p>
            ) : (
              <div className="flex flex-col gap-5">
                {inKitchen.map((listing) => (
                  <ActiveListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </section>

          {markedReady.length > 0 ? (
            <section className="flex flex-col gap-4">
              <h2 className="text-[13px] font-semibold tracking-[0.08em] text-slate uppercase">
                Ready ({markedReady.length})
              </h2>
              <div className="flex flex-col gap-5">
                {markedReady.map((listing) => (
                  <ActiveListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </MakerShell>
  );
}
