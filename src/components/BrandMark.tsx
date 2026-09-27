import type { SVGProps } from "react";

/** A broken delta: two diverging paths and one measured signal. */
export function BrandMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      width="32"
      height="32"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d="M5.5 25.5 15.5 5.5" stroke="var(--fg, #ededef)" strokeWidth="2.8" strokeLinecap="square" />
      <path d="m18.2 10.8 7.9 14.7" stroke="var(--fg, #ededef)" strokeWidth="2.8" strokeLinecap="square" />
      <path d="M10.4 25.5h11.1" stroke="var(--accent, #6ee7b7)" strokeWidth="2.8" strokeLinecap="square" />
      <circle cx="26.1" cy="25.5" r="1.7" fill="var(--accent, #6ee7b7)" />
    </svg>
  );
}