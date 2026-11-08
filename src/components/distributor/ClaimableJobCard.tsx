import type { Listing } from "@/db/schema";

import { ClaimButton } from "./ClaimButton";

function formatWindow(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  return `${start.toLocaleString(undefined, opts)} – ${end.toLocaleString(undefined, opts)}`;
}

function pathLabel(path: Listing["path"]) {
  return path === "ready_to_feed" ? "Ready to feed" : "Kitchen → ready";
}

export function ClaimableJobCard({ listing }: { listing: Listing }) {
  return (
    <article className="flex flex-col gap-3 rounded-[16px] border border-line px-4 py-3.5">
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-[15px] font-semibold text-ink">{listing.title}</h2>
          <span className="shrink-0 rounded-md bg-brand-soft px-2 py-0.5 text-[11px] font-semibold tracking-wide text-brand uppercase">
            {listing.status === "ready" ? "Ready" : "Open"}
          </span>
        </div>
        <p className="text-[13px] text-slate">
          {listing.quantityLabel} · {listing.cityArea}
        </p>
        <p className="text-[13px] text-slate">{pathLabel(listing.path)}</p>
        <p className="text-[12px] text-slate">
          Pickup: {formatWindow(listing.pickupWindowStart, listing.pickupWindowEnd)}
        </p>
        <p className="text-[13px] leading-snug text-ink">{listing.pickupAddress}</p>
        {listing.description ? (
          <p className="text-[13px] leading-snug text-slate">{listing.description}</p>
        ) : null}
      </div>
      <ClaimButton listingId={listing.id} />
    </article>
  );
}
