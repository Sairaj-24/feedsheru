"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type ListingPath = "needs_kitchen" | "ready_to_feed";
type QuantityLabel = "Small" | "Medium" | "Large";

const QUANTITIES: QuantityLabel[] = ["Small", "Medium", "Large"];

const PATHS: { id: ListingPath; title: string; description: string }[] = [
  {
    id: "needs_kitchen",
    title: "Needs kitchen",
    description: "A maker should cook this into animal-safe meals.",
  },
  {
    id: "ready_to_feed",
    title: "Ready to feed",
    description: "Already safe — a distributor can pick up directly.",
  },
];

const SAFETY_CHECKS = [
  "No chocolate, onion, garlic, grapes, or xylitol",
  "Food is fresh enough for animals today",
  "Packed so it will not spill in transit",
];

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultWindow() {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start);
  end.setHours(end.getHours() + 2);
  return {
    start: toLocalInputValue(start),
    end: toLocalInputValue(end),
  };
}

export function CreateListingForm({
  defaultCityArea = "",
}: {
  defaultCityArea?: string;
}) {
  const router = useRouter();
  const defaults = defaultWindow();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quantityLabel, setQuantityLabel] = useState<QuantityLabel | null>(
    null,
  );
  const [cityArea, setCityArea] = useState(defaultCityArea);
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupWindowStart, setPickupWindowStart] = useState(defaults.start);
  const [pickupWindowEnd, setPickupWindowEnd] = useState(defaults.end);
  const [path, setPath] = useState<ListingPath | null>(null);
  const [safety, setSafety] = useState<boolean[]>(
    () => SAFETY_CHECKS.map(() => false),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const allSafetyChecked = safety.every(Boolean);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!quantityLabel) {
      setError("Choose a quantity.");
      return;
    }
    if (!path) {
      setError("Choose a path for this surplus.");
      return;
    }
    if (!allSafetyChecked) {
      setError("Confirm the safety checklist before publishing.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          quantityLabel,
          cityArea: cityArea.trim(),
          pickupAddress: pickupAddress.trim(),
          pickupWindowStart: new Date(pickupWindowStart).toISOString(),
          pickupWindowEnd: new Date(pickupWindowEnd).toISOString(),
          path,
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      router.push("/provider");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold tracking-[0.14em] text-brand uppercase">
          FeedSheru
        </p>
        <h1 className="font-display text-[28px] leading-tight font-bold tracking-tight text-ink">
          New listing
        </h1>
        <p className="text-[15px] leading-relaxed text-slate">
          Tell helpers what surplus you have and when they can pick it up.
        </p>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-slate">Title</span>
        <span className="flex h-[52px] items-center rounded-[12px] border border-line bg-surface px-3.5 focus-within:border-brand">
          <input
            type="text"
            name="title"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Cooked rice and dal"
            className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-slate"
          />
        </span>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-slate">
          Description{" "}
          <span className="font-normal text-slate/80">(optional)</span>
        </span>
        <span className="rounded-[12px] border border-line bg-surface px-3.5 py-3 focus-within:border-brand">
          <textarea
            name="description"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What’s in the bag, packaging notes…"
            className="w-full resize-none bg-transparent text-[15px] text-ink outline-none placeholder:text-slate"
          />
        </span>
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[13px] font-semibold text-slate">
          Quantity
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {QUANTITIES.map((qty) => {
            const selected = quantityLabel === qty;
            return (
              <button
                key={qty}
                type="button"
                aria-pressed={selected}
                onClick={() => setQuantityLabel(qty)}
                className={`flex h-[44px] items-center justify-center rounded-[12px] border text-[14px] font-semibold transition-colors ${
                  selected
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-line bg-surface text-ink hover:border-brand/40"
                }`}
              >
                {qty}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-slate">City / area</span>
        <span className="flex h-[52px] items-center rounded-[12px] border border-line bg-surface px-3.5 focus-within:border-brand">
          <input
            type="text"
            name="cityArea"
            required
            value={cityArea}
            onChange={(event) => setCityArea(event.target.value)}
            placeholder="e.g. Indiranagar, Bengaluru"
            className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-slate"
          />
        </span>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-slate">
          Pickup address
        </span>
        <span className="flex h-[52px] items-center rounded-[12px] border border-line bg-surface px-3.5 focus-within:border-brand">
          <input
            type="text"
            name="pickupAddress"
            required
            value={pickupAddress}
            onChange={(event) => setPickupAddress(event.target.value)}
            placeholder="Building, street, landmark"
            className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-slate"
          />
        </span>
      </label>

      <div className="grid grid-cols-1 gap-3">
        <label className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-slate">
            Pickup window start
          </span>
          <span className="flex h-[52px] items-center rounded-[12px] border border-line bg-surface px-3.5 focus-within:border-brand">
            <input
              type="datetime-local"
              name="pickupWindowStart"
              required
              value={pickupWindowStart}
              onChange={(event) => setPickupWindowStart(event.target.value)}
              className="w-full bg-transparent text-[15px] text-ink outline-none"
            />
          </span>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-slate">
            Pickup window end
          </span>
          <span className="flex h-[52px] items-center rounded-[12px] border border-line bg-surface px-3.5 focus-within:border-brand">
            <input
              type="datetime-local"
              name="pickupWindowEnd"
              required
              value={pickupWindowEnd}
              onChange={(event) => setPickupWindowEnd(event.target.value)}
              className="w-full bg-transparent text-[15px] text-ink outline-none"
            />
          </span>
        </label>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-[13px] font-semibold text-slate">Path</legend>
        {PATHS.map((option) => {
          const selected = path === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setPath(option.id)}
              className={`flex flex-col gap-1 rounded-[16px] border px-4 py-3.5 text-left transition-colors ${
                selected
                  ? "border-brand bg-brand-soft"
                  : "border-line bg-surface hover:border-brand/40"
              }`}
            >
              <span className="text-[15px] font-semibold text-ink">
                {option.title}
              </span>
              <span className="text-[13px] leading-snug text-slate">
                {option.description}
              </span>
            </button>
          );
        })}
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-[13px] font-semibold text-slate">
          Safety checklist
        </legend>
        {SAFETY_CHECKS.map((label, index) => (
          <label
            key={label}
            className="flex items-start gap-3 rounded-[12px] border border-line px-3.5 py-3"
          >
            <input
              type="checkbox"
              checked={safety[index]}
              onChange={(event) => {
                const next = [...safety];
                next[index] = event.target.checked;
                setSafety(next);
              }}
              className="mt-0.5 size-4 accent-[var(--brand-primary)]"
            />
            <span className="text-[13px] leading-snug text-ink">{label}</span>
          </label>
        ))}
      </fieldset>

      {error ? (
        <p className="text-[13px] leading-snug text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="flex h-[52px] w-full items-center justify-center rounded-[12px] bg-brand text-base font-semibold text-on-brand transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60"
      >
        {pending ? "Publishing…" : "Publish listing"}
      </button>
    </form>
  );
}
