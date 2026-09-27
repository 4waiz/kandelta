"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { DEMO_QUERY } from "./Presenter";

// Only show markets backed by verified, genuine Oriane snapshots in the shipped app.
const EXAMPLES = [DEMO_QUERY, "UAE skincare", "Dubai restaurants"];

export function SearchBox({ size = "lg" }: { size?: "lg" | "sm" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(() => params.get("q") ?? "");

  const submit = (value: string) => {
    const v = value.trim();
    if (!v) return;
    router.push(`/discover?q=${encodeURIComponent(v)}`);
  };

  return (
    <div id="search" className="scroll-mt-28">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(q);
        }}
        className={`group flex items-center gap-2 rounded-xl border border-line bg-panel pl-4 pr-1.5 transition-colors focus-within:border-faint ${size === "lg" ? "py-1.5" : "py-1"}`}
      >
        <Search size={18} className="shrink-0 text-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Describe a market, brand or audience..."
          className={`min-w-0 flex-1 bg-transparent outline-none placeholder:text-faint ${size === "lg" ? "py-2 text-base" : "py-1 text-sm"}`}
          aria-label="Market, brand or audience"
        />
        <button type="submit" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-fg px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-white">
          Find the Delta <ArrowRight size={15} />
        </button>
      </form>
      {size === "lg" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <button
              key={e}
              onClick={() => {
                setQ(e);
                submit(e);
              }}
              className="rounded-full border border-line px-3 py-1 text-xs text-muted transition-colors hover:border-faint hover:text-fg"
            >
              {e}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
