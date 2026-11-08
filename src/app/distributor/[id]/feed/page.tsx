import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { eq } from "drizzle-orm";

import { FeedLogForm } from "@/components/distributor/FeedLogForm";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { requireRole } from "@/lib/auth/guards";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function FeedLogPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <Shell>
          <p className="text-[15px] text-slate">Loading feed form…</p>
        </Shell>
      }
    >
      <FeedLogContent params={params} />
    </Suspense>
  );
}

async function FeedLogContent({ params }: PageProps) {
  const user = await requireRole("distributor");
  const { id } = await params;

  const [listing] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1);

  if (!listing) {
    notFound();
  }

  if (
    listing.status !== "claimed_by_distributor" ||
    listing.distributorUserId !== user.id
  ) {
    redirect("/distributor");
  }

  return (
    <Shell>
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold tracking-[0.14em] text-brand uppercase">
          FeedSheru
        </p>
        <h1 className="font-display text-[28px] leading-tight font-bold tracking-tight text-ink">
          Log feed
        </h1>
        <p className="text-[15px] leading-relaxed text-slate">
          {listing.title} · {listing.cityArea}
        </p>
      </div>

      <Link
        href="/distributor"
        className="text-[13px] font-semibold text-brand hover:underline"
      >
        ← Back to jobs
      </Link>

      <FeedLogForm
        listingId={listing.id}
        defaultQuantity={listing.quantityLabel}
      />
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
