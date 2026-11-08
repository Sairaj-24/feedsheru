import type { Listing } from "@/db/schema";

import { formatPickupWindow } from "./format";
import { MarkReadyForm } from "./MarkReadyForm";

export function ActiveListingCard({ listing }: { listing: Listing }) {
  const isClaimed = listing.status === "claimed_by_maker";
  const isReady = listing.status === "ready";

  return (
    <article className="flex flex-col gap-3 border-b border-line pb-5 last:border-b-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-[17px] font-semibold text-ink">{listing.title}</h2>
          <p className="text-[13px] text-slate">
            {listing.quantityLabel} · {listing.cityArea}
          </p>
        </div>
        <StatusPill status={listing.status} />
      </div>
      {listing.description ? (
        <p className="text-[14px] leading-relaxed text-slate">
          {listing.description}
        </p>
      ) : null}
      <div className="flex flex-col gap-0.5 text-[13px] text-slate">
        <p>
          <span className="font-medium text-ink">Pickup:</span>{" "}
          {listing.pickupAddress}
        </p>
        <p>{formatPickupWindow(listing.pickupWindowStart, listing.pickupWindowEnd)}</p>
      </div>
      {isClaimed ? <MarkReadyForm listingId={listing.id} /> : null}
      {isReady ? (
        <p className="text-[13px] text-brand">
          Ready for a distributor to claim.
        </p>
      ) : null}
    </article>
  );
}

function StatusPill({ status }: { status: Listing["status"] }) {
  const label =
    status === "claimed_by_maker"
      ? "In kitchen"
      : status === "ready"
        ? "Ready"
        : status;

  return (
    <span className="shrink-0 rounded-[10px] bg-brand-soft px-2.5 py-1 text-[11px] font-semibold tracking-wide text-brand uppercase">
      {label}
    </span>
  );
}
