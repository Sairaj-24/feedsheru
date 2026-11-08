import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { asc, eq } from "drizzle-orm";

import { EmptyState } from "@/components/EmptyState";
import { db } from "@/db";
import {
  feedLogs,
  listingEvents,
  listings,
  users,
  type Listing,
  type ListingEvent,
  type ListingStatus,
} from "@/db/schema";
import { requireOnboardedUser } from "@/lib/auth/guards";

type PageProps = {
  params: Promise<{ id: string }>;
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

const PATH_LABEL: Record<Listing["path"], string> = {
  needs_kitchen: "Needs kitchen",
  ready_to_feed: "Ready to feed",
};

export default function ListingDetailPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <Shell>
          <p className="text-[15px] text-slate">Loading listing…</p>
        </Shell>
      }
    >
      <ListingDetailContent params={params} />
    </Suspense>
  );
}

async function ListingDetailContent({ params }: PageProps) {
  const user = await requireOnboardedUser();
  const { id } = await params;

  const [listing] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1);

  if (!listing) {
    notFound();
  }

  const isParticipant =
    listing.providerUserId === user.id ||
    listing.makerUserId === user.id ||
    listing.distributorUserId === user.id;

  const [events, feedLogRows] = await Promise.all([
    db
      .select({
        id: listingEvents.id,
        listingId: listingEvents.listingId,
        actorUserId: listingEvents.actorUserId,
        fromStatus: listingEvents.fromStatus,
        toStatus: listingEvents.toStatus,
        note: listingEvents.note,
        createdAt: listingEvents.createdAt,
        actorDisplayName: users.displayName,
        actorEmail: users.email,
      })
      .from(listingEvents)
      .leftJoin(users, eq(listingEvents.actorUserId, users.id))
      .where(eq(listingEvents.listingId, listing.id))
      .orderBy(asc(listingEvents.createdAt)),
    listing.status === "fed"
      ? db
          .select()
          .from(feedLogs)
          .where(eq(feedLogs.listingId, listing.id))
          .limit(1)
      : Promise.resolve([]),
  ]);

  const feedLog = feedLogRows[0] ?? null;

  return (
    <Shell>
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold tracking-[0.14em] text-brand uppercase">
          FeedSheru
        </p>
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display text-[28px] leading-tight font-bold tracking-tight text-ink">
            {listing.title}
          </h1>
          <Link
            href="/home"
            className="shrink-0 pt-1 text-[13px] font-semibold text-brand"
          >
            Home
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={listing.status} />
          <span className="text-[13px] text-slate">
            {PATH_LABEL[listing.path]}
          </span>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-semibold tracking-[0.06em] text-slate uppercase">
          Details
        </h2>
        <dl className="flex flex-col gap-3 rounded-[16px] border border-line px-4 py-3.5">
          <DetailRow label="Quantity" value={listing.quantityLabel} />
          <DetailRow label="Area" value={listing.cityArea} />
          <DetailRow
            label="Pickup window"
            value={formatWindow(
              listing.pickupWindowStart,
              listing.pickupWindowEnd,
            )}
          />
          {isParticipant ? (
            <DetailRow label="Pickup address" value={listing.pickupAddress} />
          ) : null}
          {listing.description ? (
            <DetailRow label="Description" value={listing.description} />
          ) : null}
        </dl>
      </section>

      {feedLog ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-[13px] font-semibold tracking-[0.06em] text-slate uppercase">
            Feed log
          </h2>
          <dl className="flex flex-col gap-3 rounded-[16px] bg-brand-soft px-4 py-3.5">
            <DetailRow label="Quantity" value={feedLog.quantityLabel} />
            <DetailRow
              label="Animals (approx)"
              value={String(feedLog.animalsApprox)}
            />
            <DetailRow label="Place" value={feedLog.placeLabel} />
            {isParticipant && feedLog.notes ? (
              <DetailRow label="Notes" value={feedLog.notes} />
            ) : null}
          </dl>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-semibold tracking-[0.06em] text-slate uppercase">
          Custody timeline
        </h2>
        {events.length === 0 ? (
          <EmptyState
            title="No events yet"
            description="Status changes for this listing will show up here."
          />
        ) : (
          <ol className="flex flex-col gap-0 border-l-2 border-brand-soft pl-4">
            {events.map((event) => (
              <TimelineItem
                key={event.id}
                event={event}
                showNote={isParticipant}
              />
            ))}
          </ol>
        )}
      </section>
    </Shell>
  );
}

function TimelineItem({
  event,
  showNote,
}: {
  event: Pick<
    ListingEvent,
    "fromStatus" | "toStatus" | "note" | "createdAt"
  > & {
    actorDisplayName: string | null;
    actorEmail: string | null;
  };
  showNote: boolean;
}) {
  const actor =
    event.actorDisplayName?.trim() ||
    event.actorEmail?.split("@")[0] ||
    "Someone";
  const fromLabel = event.fromStatus
    ? STATUS_LABEL[event.fromStatus]
    : "New";
  const toLabel = STATUS_LABEL[event.toStatus];

  return (
    <li className="relative pb-5 last:pb-0">
      <span
        aria-hidden
        className="absolute top-1.5 -left-[1.4rem] size-2.5 rounded-full bg-brand"
      />
      <p className="text-[14px] font-semibold text-ink">
        {fromLabel} → {toLabel}
      </p>
      <p className="mt-0.5 text-[12px] text-slate">
        {actor} · {formatEventTime(event.createdAt)}
      </p>
      {showNote && event.note ? (
        <p className="mt-1.5 text-[13px] leading-snug text-slate">
          {event.note}
        </p>
      ) : null}
    </li>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] font-semibold tracking-[0.06em] text-slate uppercase">
        {label}
      </dt>
      <dd className="text-[14px] leading-snug text-ink">{value}</dd>
    </div>
  );
}

function StatusPill({ status }: { status: ListingStatus }) {
  return (
    <span className="shrink-0 rounded-md bg-brand-soft px-2 py-0.5 text-[11px] font-semibold tracking-wide text-brand uppercase">
      {STATUS_LABEL[status]}
    </span>
  );
}

function formatWindow(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  return `${start.toLocaleString(undefined, opts)} – ${end.toLocaleString(undefined, opts)}`;
}

function formatEventTime(date: Date) {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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
