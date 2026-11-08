import Link from "next/link";

import type { Listing } from "@/db/schema";

export function ActiveJobCard({ listing }: { listing: Listing }) {
  return (
    <article className="flex flex-col gap-3 rounded-[16px] border border-brand/30 bg-brand-soft/40 px-4 py-3.5">
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-[15px] font-semibold text-ink">{listing.title}</h2>
          <span className="shrink-0 rounded-md bg-brand px-2 py-0.5 text-[11px] font-semibold tracking-wide text-on-brand uppercase">
            Yours
          </span>
        </div>
        <p className="text-[13px] text-slate">
          {listing.quantityLabel} · {listing.cityArea}
        </p>
        <p className="text-[13px] leading-snug text-ink">{listing.pickupAddress}</p>
      </div>
      <Link
        href={`/distributor/${listing.id}/feed`}
        className="flex h-[44px] w-full items-center justify-center rounded-[12px] bg-brand text-[15px] font-semibold text-on-brand transition-opacity hover:opacity-90 active:opacity-80"
      >
        Log feed
      </Link>
    </article>
  );
}
