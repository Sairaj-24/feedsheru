"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type LogoutButtonProps = {
  variant?: "primary" | "secondary";
  className?: string;
};

export function LogoutButton({
  variant = "primary",
  className = "",
}: LogoutButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const baseStyles =
    "flex h-[52px] w-full items-center justify-center rounded-[12px] text-base font-semibold disabled:opacity-60";

  const variantStyles =
    variant === "secondary"
      ? "border border-line bg-surface text-slate transition-colors hover:bg-mist hover:text-ink active:bg-mist"
      : "bg-brand text-on-brand transition-opacity hover:opacity-90 active:opacity-80";

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className={`${baseStyles} ${variantStyles} ${className}`.trim()}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
