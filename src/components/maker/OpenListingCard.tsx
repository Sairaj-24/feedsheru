import type { Listing } from "@/db/schema";

import { ClaimButton } from "./ClaimButton";
import { formatPickupWindow } from "./format";

export function OpenListingCard({ listing }: { listing: Listing }) {
  return (
    <article className="flex flex-col gap-3 border-b border-line pb-5 last:border-b-0 last:pb-0">
      <div className="flex flex-col gap-1">
        <h2 className="text-[17px] font-semibold text-ink">{listing.title}</h2>
        <p className="text-[13px] text-slate">
          {listing.quantityLabel} · {listing.cityArea}
        </p>
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
      <ClaimButton listingId={listing.id} />
    </article>
  );
}
