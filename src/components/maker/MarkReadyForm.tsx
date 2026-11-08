"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function MarkReadyForm({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const response = await fetch(`/api/listings/${listingId}/ready`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim() || undefined }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Could not mark ready.");
        return;
      }

      setNote("");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-slate">
          Note for distributors (optional)
        </span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={2}
          maxLength={500}
          placeholder="e.g. About 8 portions, mild spices"
          className="resize-none rounded-[12px] border border-line bg-surface px-3 py-2.5 text-[14px] text-ink outline-none focus:border-brand"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-[12px] bg-brand px-4 py-2.5 text-[14px] font-semibold text-on-brand transition-opacity disabled:opacity-60"
      >
        {pending ? "Saving…" : "Mark ready to feed"}
      </button>
      {error ? (
        <p className="text-[13px] leading-snug text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
