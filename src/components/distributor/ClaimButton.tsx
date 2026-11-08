"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ClaimButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClaim() {
    setError(null);
    setPending(true);
    try {
      const response = await fetch(
        `/api/listings/${listingId}/claim-distributor`,
        { method: "POST" },
      );
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Could not claim this job.");
        return;
      }

      router.push(`/distributor/${listingId}/feed`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? (
        <p className="text-[13px] leading-snug text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={handleClaim}
        disabled={pending}
        className="flex h-[44px] w-full items-center justify-center rounded-[12px] bg-brand text-[15px] font-semibold text-on-brand transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60"
      >
        {pending ? "Claiming…" : "Claim job"}
      </button>
    </div>
  );
}
