"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Presentation } from "lucide-react";
import { cn } from "./ui";
import { usePresenter } from "./Presenter";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
        <rect x="1" y="1" width="18" height="18" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
        <rect x="4.5" y="4.5" width="5" height="5" rx="1" fill="var(--accent)" />
      </svg>
      <span className="text-[15px] font-semibold tracking-tight">WhiteSpace</span>
    </span>
  );
}

export function Nav() {
  const path = usePathname();
  const { active, start, stop } = usePresenter();
  const link = (href: string, label: string) => (
    <Link
      href={href}
      className={cn("rounded-md px-2.5 py-1.5 text-sm transition-colors", path === href || (href !== "/" && path.startsWith(href)) ? "text-fg" : "text-muted hover:text-fg")}
    >
      {label}
    </Link>
  );
  return (
    <header className="sticky top-0 z-30 border-b border-line-soft bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" aria-label="WhiteSpace home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {link("/", "Discover")}
            {link("/vault", "Evidence Vault")}
          </nav>
        </div>
        <button
          onClick={active ? stop : start}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
            active ? "border-accent/40 bg-accent/10 text-accent" : "border-line text-muted hover:text-fg",
          )}
        >
          <Presentation size={15} />
          {active ? "Exit presentation" : "Present"}
        </button>
      </div>
    </header>
  );
}
