export function DistributorEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[16px] border border-dashed border-line px-4 py-8 text-center">
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-slate">{description}</p>
    </div>
  );
}
