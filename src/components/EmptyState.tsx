import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

/**
 * Shared empty-state for FeedSheru lists and activity sections.
 * Tone: short and plain — no hype.
 */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-[16px] border border-dashed border-line px-4 py-8 text-center">
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-slate">
        {description}
      </p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
