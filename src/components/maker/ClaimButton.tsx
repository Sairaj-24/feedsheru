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
      const response = await fetch(`/api/listings/${listingId}/claim-maker`, {
        method: "POST",
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Could not claim this listing.");
        return;
      }

      router.push("/maker/active");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClaim}
        disabled={pending}
        className="rounded-[12px] bg-brand px-4 py-2.5 text-[14px] font-semibold text-on-brand transition-opacity disabled:opacity-60"
      >
        {pending ? "Claiming…" : "Claim for kitchen"}
      </button>
      {error ? (
        <p className="text-[13px] leading-snug text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
