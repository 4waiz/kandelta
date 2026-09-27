"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ClipboardCopy, FileText, Rocket } from "lucide-react";
import type { Brief } from "@/lib/whitespace/brief";
import type { Video } from "@/lib/oriane/normalize";
import { fmtCompact } from "@/lib/format";
import { Button, Chip, cn } from "./ui";
import { usePresenter } from "./Presenter";

function briefText(b: Brief) {
  return [
    `CONCEPT: ${b.title}`,
    ``,
    `OPPORTUNITY: ${b.opportunity}`,
    `WHY NOW: ${b.whyNow}`,
    `TARGET AUDIENCE: ${b.audience}`,
    `CREATIVE PREMISE: ${b.premise}`,
    `HOOK: ${b.hook}`,
    `OPENING SHOT: ${b.openingShot}`,
    `STRUCTURE:`,
    ...b.structure.map((s, i) => `  ${i + 1}. ${s}`),
    `TONE: ${b.tone}`,
    `CREATORS: ${b.creatorProfile}`,
    `CTA: ${b.cta}`,
    `REFERENCES: ${b.references.map((r) => r.url ?? `@${r.handle}`).join(" · ")}`,
    ``,
    b.disclaimer,
  ].join("\n");
}

export function Activate({ brief, evidence }: { brief: Brief; evidence: Video[] }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const { lastAction } = usePresenter();
  const handled = useRef(0);

  useEffect(() => {
    if (lastAction?.action === "open-brief" && lastAction.at !== handled.current) {
      handled.current = lastAction.at;
      setOpen(true);
    }
  }, [lastAction]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(briefText(brief));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };

  if (!open)
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-line bg-panel p-6">
        <p className="max-w-xl text-sm text-muted">Turn the signal into something a creator can shoot tomorrow: a brief built from the evidence, then adapted for each platform.</p>
        <Button onClick={() => setOpen(true)}>
          <FileText size={15} /> Build Campaign Brief
        </Button>
      </div>
    );

  const p = brief.platforms[tab];
  const row = (label: string, value: React.ReactNode) => (
    <div className="grid gap-1 border-b border-line-soft py-3 last:border-0 sm:grid-cols-[150px_1fr] sm:gap-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-faint">{label}</div>
      <div className="text-sm leading-relaxed text-fg">{value}</div>
    </div>
  );

  return (
    <div className="fade-in space-y-4">
      <div className="rounded-xl border border-line bg-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-faint">Campaign brief</div>
            <div className="text-lg font-semibold tracking-tight">{brief.title}</div>
          </div>
          <Button variant="outline" onClick={copy}>
            {copied ? <Check size={14} /> : <ClipboardCopy size={14} />} {copied ? "Copied" : "Copy brief"}
          </Button>
        </div>
        <div className="px-5">
          {row("Opportunity", brief.opportunity)}
          {row("Why now", brief.whyNow)}
          {row("Target audience", brief.audience)}
          {row("Creative premise", brief.premise)}
          {row(
            "Hook",
            <>
              <span className="font-medium">“{brief.hook}”</span>
              {brief.hookReference ? (
                <span className="mt-1 block text-xs text-faint">
                  Reference hook from the evidence (@{brief.hookReference.handle}): “{brief.hookReference.text.slice(0, 110)}”
                </span>
              ) : null}
            </>,
          )}
          {row("Opening shot", brief.openingShot)}
          {row(
            "Shot structure",
            <ol className="space-y-1">
              {brief.structure.map((s, i) => (
                <li key={s} className="flex gap-2">
                  <span className="tabular text-faint">{i + 1}.</span> {s}
                </li>
              ))}
            </ol>,
          )}
          {row("Tone", brief.tone)}
          {row("Creators", brief.creatorProfile)}
          {row("CTA", brief.cta)}
          {row(
            "References",
            <div className="flex flex-wrap gap-2">
              {brief.references.map((r) => (
                <a key={r.videoId} href={r.url ?? "#"} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-md border border-line px-2 py-1 text-xs text-muted hover:text-fg">
                  {r.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.thumbnail} alt="" className="h-6 w-5 rounded object-cover" />
                  ) : null}
                  @{r.handle} · {fmtCompact(r.views)}
                </a>
              ))}
            </div>,
          )}
        </div>
        <div className="border-t border-line-soft px-5 py-3 text-xs text-faint">{brief.disclaimer}</div>
      </div>

      <div id="activate-platforms" className="scroll-mt-24 rounded-xl border border-line bg-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-3">
          <div className="flex items-center gap-2">
            <Rocket size={15} className="text-faint" />
            <span className="text-sm font-semibold">Activate</span>
            <Chip>Suggested adaptations</Chip>
          </div>
          <div className="flex rounded-lg border border-line p-0.5">
            {brief.platforms.map((pl, i) => (
              <button key={pl.platform} onClick={() => setTab(i)} className={cn("rounded-md px-3 py-1 text-xs transition-colors", tab === i ? "bg-fg text-bg" : "text-muted hover:text-fg")}>
                {pl.platform}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="text-sm">
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Aspect", p.aspect],
                ["Length", p.length],
                ["Pacing", p.pacing.split(".")[0]],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-line-soft px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wider text-faint">{k}</div>
                  <div className="mt-0.5 text-sm font-medium">{v}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-faint">Hook</div>
                <div className="mt-1 font-medium">“{p.hook}”</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-faint">Opening</div>
                <div className="mt-1 text-muted">{p.opening}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-faint">Structure</div>
                <ol className="mt-1 space-y-0.5 text-muted">
                  {p.structure.map((s, i) => (
                    <li key={s}>
                      {i + 1}. {s}
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-faint">Caption</div>
                <div className="mt-1 rounded-md border border-line-soft bg-bg/60 px-3 py-2 font-mono text-[12px] text-muted">{p.caption}</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-faint">CTA</div>
                  <div className="mt-1 text-muted">{p.cta}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-faint">On-screen text</div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {p.onScreenText.map((t) => (
                      <Chip key={t}>{t}</Chip>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-xs text-faint">Basis: {p.basis} {p.pacing}</p>
            </div>
          </div>
          <div className="mx-auto w-full max-w-[220px]">
            <div className="relative aspect-[9/16] overflow-hidden rounded-2xl border border-line bg-bg">
              {evidence[tab]?.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={evidence[tab].thumbnail!} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
              ) : null}
              <div className="absolute inset-x-3 top-8 rounded-md bg-black/70 px-2 py-1.5 text-center text-[11px] font-semibold leading-tight text-fg">{p.onScreenText[0]}</div>
              <div className="absolute inset-x-3 bottom-10 text-[10px] leading-snug text-fg/90">{p.hook}</div>
              <div className="absolute inset-x-0 bottom-2 text-center text-[9px] uppercase tracking-widest text-faint">{p.platform} · {p.aspect}</div>
            </div>
            <p className="mt-2 text-center text-[10px] text-faint">Layout mock with a reference frame</p>
          </div>
        </div>
      </div>
    </div>
  );
}
