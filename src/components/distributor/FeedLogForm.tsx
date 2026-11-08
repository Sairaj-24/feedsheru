"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const QUANTITY_OPTIONS = ["Small", "Medium", "Large"] as const;

export function FeedLogForm({
  listingId,
  defaultQuantity,
}: {
  listingId: string;
  defaultQuantity: string;
}) {
  const router = useRouter();
  const initialQuantity = QUANTITY_OPTIONS.includes(
    defaultQuantity as (typeof QUANTITY_OPTIONS)[number],
  )
    ? defaultQuantity
    : defaultQuantity || "Medium";

  const [quantityLabel, setQuantityLabel] = useState(initialQuantity);
  const [animalsApprox, setAnimalsApprox] = useState("");
  const [placeLabel, setPlaceLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const response = await fetch(`/api/listings/${listingId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantityLabel: quantityLabel.trim(),
          animalsApprox: Number.parseInt(animalsApprox, 10),
          placeLabel: placeLabel.trim(),
          notes: notes.trim() || undefined,
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Could not save feed log.");
        return;
      }

      router.push("/distributor");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
      <label className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-slate">Quantity fed</span>
        <span className="flex h-[52px] items-center rounded-[12px] border border-line bg-surface px-3.5 focus-within:border-brand">
          <select
            name="quantityLabel"
            value={quantityLabel}
            onChange={(event) => setQuantityLabel(event.target.value)}
            className="w-full bg-transparent text-[15px] text-ink outline-none"
            required
          >
            {QUANTITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
            {!QUANTITY_OPTIONS.includes(
              initialQuantity as (typeof QUANTITY_OPTIONS)[number],
            ) && initialQuantity ? (
              <option value={initialQuantity}>{initialQuantity}</option>
            ) : null}
          </select>
        </span>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-slate">
          Approx. animals fed
        </span>
        <span className="flex h-[52px] items-center rounded-[12px] border border-line bg-surface px-3.5 focus-within:border-brand">
          <input
            type="number"
            name="animalsApprox"
            min={1}
            step={1}
            inputMode="numeric"
            value={animalsApprox}
            onChange={(event) => setAnimalsApprox(event.target.value)}
            placeholder="e.g. 8"
            className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-slate"
            required
          />
        </span>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-slate">
          Place / area
        </span>
        <span className="flex h-[52px] items-center rounded-[12px] border border-line bg-surface px-3.5 focus-within:border-brand">
          <input
            type="text"
            name="placeLabel"
            value={placeLabel}
            onChange={(event) => setPlaceLabel(event.target.value)}
            placeholder="e.g. Near park gate, MG Road"
            className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-slate"
            required
          />
        </span>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-slate">
          Notes <span className="font-normal text-slate/80">(optional)</span>
        </span>
        <textarea
          name="notes"
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Anything the next volunteer should know"
          className="resize-none rounded-[12px] border border-line bg-surface px-3.5 py-3 text-[15px] text-ink outline-none placeholder:text-slate focus:border-brand"
        />
      </label>

      {error ? (
        <p className="text-[13px] leading-snug text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="flex h-[52px] w-full items-center justify-center rounded-[12px] bg-brand text-base font-semibold text-on-brand transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Mark as fed"}
      </button>
    </form>
  );
}
