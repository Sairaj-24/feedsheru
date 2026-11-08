import Link from "next/link";

export function MakerShell({
  children,
  activeTab = "browse",
}: {
  children: React.ReactNode;
  activeTab?: "browse" | "active";
}) {
  return (
    <div className="flex min-h-dvh w-full justify-center bg-mist sm:py-8">
      <main className="flex w-full max-w-[390px] flex-col gap-6 bg-surface px-6 py-10 sm:min-h-[844px] sm:rounded-2xl sm:shadow-sm">
        <header className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-semibold tracking-[0.14em] text-brand uppercase">
              FeedSheru
            </p>
            <Link
              href="/home"
              className="text-[13px] font-medium text-slate hover:text-ink"
            >
              Home
            </Link>
          </div>
          <nav className="flex gap-2 border-b border-line pb-3">
            <TabLink href="/maker" active={activeTab === "browse"}>
              Open jobs
            </TabLink>
            <TabLink href="/maker/active" active={activeTab === "active"}>
              My kitchen
            </TabLink>
          </nav>
        </header>
        {children}
      </main>
    </div>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-[12px] bg-brand-soft px-3 py-1.5 text-[13px] font-semibold text-brand"
          : "rounded-[12px] px-3 py-1.5 text-[13px] font-medium text-slate hover:text-ink"
      }
    >
      {children}
    </Link>
  );
}
