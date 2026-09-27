import { clsx } from "clsx";
import type { ReactNode } from "react";

export function cn(...xs: Parameters<typeof clsx>) {
  return clsx(...xs);
}

export function Chip({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "accent" | "warn" | "bad" | "blue"; className?: string }) {
  const tones = {
    neutral: "border-line text-muted",
    accent: "border-accent/30 bg-accent/10 text-accent",
    warn: "border-warn/30 bg-warn/10 text-warn",
    bad: "border-bad/30 bg-bad/10 text-bad",
    blue: "border-blue/30 bg-blue/10 text-blue",
  } as const;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-none tracking-wide", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "accent" | "warn" }) {
  return (
    <div className="rounded-lg border border-line bg-panel px-4 py-3">
      <div className="text-[11px] font-medium uppercase tracking-wider text-faint">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold tabular", tone === "accent" && "text-accent", tone === "warn" && "text-warn")}>{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-muted">{sub}</div> : null}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, children, id }: { eyebrow: string; title: ReactNode; children?: ReactNode; id?: string }) {
  return (
    <div id={id} className="scroll-mt-24">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">{eyebrow}</div>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  className,
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "outline";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const v = {
    primary: "bg-fg text-bg hover:bg-white",
    outline: "border border-line text-fg hover:border-faint hover:bg-panel-2",
    ghost: "text-muted hover:text-fg hover:bg-panel-2",
  } as const;
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        v[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function StageBadge({ stage }: { stage: "EARLY" | "EMERGING" | "CROWDED" | "SATURATED" }) {
  const tone = stage === "EARLY" ? "accent" : stage === "EMERGING" ? "blue" : stage === "CROWDED" ? "warn" : "bad";
  return <Chip tone={tone}>{stage}</Chip>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}
