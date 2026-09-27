"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FlaskConical, RotateCcw, Sparkles, Wand2 } from "lucide-react";
import { runPanel, type LabContext, type LabResult, type Recommendation } from "@/lib/whitespace/audience";
import { Button, Chip, cn } from "./ui";
import { usePresenter } from "./Presenter";

function applyRecommendation(script: string, rec: Recommendation): string {
  const lines = script.split("\n");
  const hookIdx = lines.findIndex((l) => /^hook/i.test(l.trim()));
  if (rec.id === "stakes-first" && hookIdx >= 0) {
    const [label, ...rest] = lines[hookIdx].split(":");
    const text = rest.join(":").trim();
    const sentences = text.split(/(?<=[.?!])\s+/);
    const i = sentences.findIndex((s) => /\?|survive|test|challenge/i.test(s));
    if (i > 0) {
      const reordered = [sentences[i], ...sentences.slice(0, i), ...sentences.slice(i + 1)];
      lines[hookIdx] = `${label}: ${reordered.join(" ")}`;
    }
  }
  const ctaIdx = lines.findIndex((l) => /^cta/i.test(l.trim()));
  const insertAt = ctaIdx >= 0 ? ctaIdx : lines.length;
  if (rec.id === "price") lines.splice(insertAt, 0, "BEAT: Lower-third on the close-up: model name + price (AED)");
  if (rec.id === "arabic") lines.splice(insertAt, 0, "BEAT: Bilingual EN/AR on-screen text for the temperature and the verdict: ٤٢ درجة");
  if (rec.id === "soft-cta" && ctaIdx >= 0) lines[ctaIdx] = "CTA: What temperature would you tap out at? Comment below.";
  return lines.join("\n");
}

export function AudienceLab({ initialScript, ctx }: { initialScript: string; ctx: LabContext }) {
  const [script, setScript] = useState(initialScript);
  const [result, setResult] = useState<LabResult | null>(null);
  const [previous, setPrevious] = useState<LabResult | null>(null);
  const [running, setRunning] = useState(false);
  const { lastAction } = usePresenter();
  const handled = useRef(0);

  const run = (text = script, keepPrev = false) => {
    setRunning(true);
    if (!keepPrev) setPrevious(null);
    setTimeout(() => {
      setResult(runPanel(text, ctx));
      setRunning(false);
    }, 650);
  };

  useEffect(() => {
    if (lastAction?.action === "run-audience" && lastAction.at !== handled.current) {
      handled.current = lastAction.at;
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAction]);

  const top = result?.recommendations[0];
  const keep = useMemo(() => (r: LabResult | null) => (r ? r.reactions.filter((x) => x.verdict === "Keeps watching").length : 0), []);

  return (
    <div className="rounded-xl border border-line bg-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-3">
        <div className="flex items-center gap-2 text-xs">
          <FlaskConical size={14} className="text-warn" />
          <span className="font-semibold uppercase tracking-wider text-warn">AI-simulated audience panel</span>
          <span className="text-muted">Directional feedback, not real consumer research.</span>
        </div>
        <Chip>6 rule-based personas · grounded in {ctx.evidenceCount} Oriane evidence videos</Chip>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-faint" htmlFor="lab-script">
            Draft to test (from the brief; edit freely)
          </label>
          <textarea
            id="lab-script"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            rows={10}
            className="mt-2 w-full resize-y rounded-lg border border-line bg-bg p-3 font-mono text-[12px] leading-relaxed text-fg outline-none focus:border-faint"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => run()} disabled={running}>
              <Sparkles size={15} /> {result ? "Re-test with audience" : "Test with Audience"}
            </Button>
            {script !== initialScript ? (
              <Button variant="ghost" onClick={() => setScript(initialScript)}>
                <RotateCcw size={14} /> Reset draft
              </Button>
            ) : null}
          </div>
          {result ? (
            <div className="mt-5 rounded-lg border border-line-soft bg-bg/60 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-faint">Audience consensus</div>
              <ul className="mt-2 space-y-1.5 text-sm">
                {result.consensus.map((c) => (
                  <li key={c} className="flex gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-faint" />
                    <span className="text-muted">{c}</span>
                  </li>
                ))}
              </ul>
              {previous ? (
                <div className="mt-3 rounded-md border border-accent/25 bg-accent/5 px-3 py-2 text-xs text-accent">
                  After the change: {keep(previous)}/6 → {keep(result)}/6 simulated personas keep watching.
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div>
          {running ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-36 rounded-lg" />
              ))}
            </div>
          ) : result ? (
            <div className="fade-in grid gap-3 sm:grid-cols-2">
              {result.reactions.map((r) => (
                <div key={r.persona.id} className="rounded-lg border border-line-soft bg-bg/50 p-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-panel-2 text-[11px] font-semibold text-muted">{r.persona.initials}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{r.persona.name}</div>
                      <div className="truncate text-[11px] text-faint">{r.persona.who}</div>
                    </div>
                    <Chip tone={r.verdict === "Keeps watching" ? "accent" : r.verdict === "Might scroll" ? "warn" : "bad"}>{r.verdict}</Chip>
                  </div>
                  <p className="mt-2.5 text-[13px] leading-snug text-fg">“{r.quote}”</p>
                  <div className="mt-2.5 grid grid-cols-4 gap-1.5">
                    {r.scores.map((s) => (
                      <div key={s.label} title={`${s.label}: ${s.value}/5`}>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={cn("h-1 flex-1 rounded-full", i < s.value ? (s.value >= 4 ? "bg-accent" : s.value >= 3 ? "bg-muted" : "bg-bad") : "bg-line")} />
                          ))}
                        </div>
                        <div className="mt-1 truncate text-[9px] uppercase tracking-wide text-faint">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {r.because.length ? (
                    <details className="mt-2 text-[11px] text-faint">
                      <summary className="cursor-pointer select-none hover:text-muted">Why this reaction</summary>
                      <ul className="mt-1 space-y-0.5 pl-3">
                        {r.because.map((b) => (
                          <li key={b} className="list-disc">
                            {b}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-line p-6 text-center">
              <FlaskConical size={20} className="text-faint" />
              <p className="mt-3 max-w-sm text-sm text-muted">
                Pressure-test the concept before spending on production. Six personas react to your hook, structure and CTA, using what worked in the real evidence.
              </p>
            </div>
          )}
        </div>
      </div>

      {result && result.recommendations.length ? (
        <div id="audience-lab-recs" className="scroll-mt-24 border-t border-line-soft p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-faint">Recommended changes</div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {result.recommendations.map((rec, i) => (
              <div key={rec.id} className={cn("rounded-lg border p-4", i === 0 ? "border-accent/35 bg-accent/5" : "border-line-soft")}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {i === 0 ? <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-accent">WhiteSpace recommends</div> : null}
                    <div className="text-sm font-medium">{rec.title}</div>
                  </div>
                  {["stakes-first", "price", "arabic", "soft-cta"].includes(rec.id) ? (
                    <button
                      onClick={() => {
                        const next = applyRecommendation(script, rec);
                        setPrevious(result);
                        setScript(next);
                        run(next, true);
                      }}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-line px-2 py-1 text-[11px] text-muted hover:border-faint hover:text-fg"
                    >
                      <Wand2 size={12} /> Apply
                    </button>
                  ) : null}
                </div>
                <p className="mt-1.5 text-[13px] leading-snug text-muted">{rec.detail}</p>
                <p className="mt-2 text-[11px] text-faint">
                  Raised by {rec.flaggedBy.join(", ")}. {rec.evidence}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {top ? null : null}
    </div>
  );
}
