import Link from "next/link";

import type { Listing } from "@/db/schema";

const STATUS_LABEL: Record<Listing["status"], string> = {
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

function formatWindow(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  return `${start.toLocaleString(undefined, opts)} – ${end.toLocaleString(undefined, opts)}`;
}

export function ProviderListings({ listings }: { listings: Listing[] }) {
  if (listings.length === 0) {
    return (
      <div className="flex flex-col gap-4 rounded-[16px] bg-brand-soft p-5">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold tracking-[0.08em] text-brand uppercase">
            My listings
          </p>
          <p className="text-[17px] font-semibold text-ink">
            No surplus listed yet
          </p>
          <p className="text-[13px] leading-snug text-slate">
            Publish leftover food so makers and distributors can move it to
            street dogs.
          </p>
        </div>
        <Link
          href="/provider/new"
          className="flex h-[48px] w-full items-center justify-center rounded-[12px] bg-brand text-[15px] font-semibold text-on-brand transition-opacity hover:opacity-90 active:opacity-80"
        >
          Create listing
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {listings.map((listing) => (
        <li
          key={listing.id}
          className="flex flex-col gap-2 rounded-[16px] border border-line px-4 py-3.5"
        >
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-[15px] leading-snug font-semibold text-ink">
              {listing.title}
            </h2>
            <span className="shrink-0 rounded-md bg-brand-soft px-2 py-0.5 text-[11px] font-semibold tracking-wide text-brand uppercase">
              {STATUS_LABEL[listing.status]}
            </span>
          </div>
          <p className="text-[13px] text-slate">
            {listing.quantityLabel} · {PATH_LABEL[listing.path]}
          </p>
          <p className="text-[13px] text-slate">{listing.cityArea}</p>
          <p className="text-[12px] leading-snug text-slate/90">
            Pickup {formatWindow(listing.pickupWindowStart, listing.pickupWindowEnd)}
          </p>
        </li>
      ))}
    </ul>
  );
}
