"use client";

import { useEffect, useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { METHOD } from "@/lib/whitespace/scoring";

export function MethodButton({ label = "How is this calculated?" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg">
        <HelpCircle size={15} /> {label}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="fade-in max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-line bg-panel p-6 scrollbar-thin" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">No black box</div>
                <h3 className="mt-1 text-lg font-semibold">How KanDelta scores an opportunity</h3>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-faint hover:text-fg" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <p className="mt-3 rounded-lg border border-accent/25 bg-accent/5 px-3 py-2 text-sm text-fg">{METHOD.summary}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Every input is counted by Oriane across its whole index, not sampled: how many videos use an angle, their total views,
              interactions and creators&apos; followers. No AI model invents a score.
            </p>
            <dl className="mt-4 divide-y divide-line-soft">
              {METHOD.terms.map((t) => (
                <div key={t.name} className="grid gap-1 py-3 sm:grid-cols-[150px_1fr] sm:gap-4">
                  <dt className="text-sm font-medium">{t.name}</dt>
                  <dd>
                    <code className="font-mono text-[12px] text-accent">{t.formula}</code>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{t.detail}</p>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-faint">{METHOD.caveat}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
