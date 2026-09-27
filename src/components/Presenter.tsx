"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { BrandMark } from "./BrandMark";

export const DEMO_QUERY = "Running shoes UAE";
export const DEMO_OPPORTUNITY = "visual-outdoor-sun";

const q = encodeURIComponent(DEMO_QUERY);
const opp = `/opportunity?q=${q}&id=${DEMO_OPPORTUNITY}`;

export interface Step {
  title: string;
  say: string;
  href: string;
  target?: string;
  action?: "run-audience" | "open-brief";
}

export const STEPS: Step[] = [
  { title: "Everyone sees the trend", say: "Everyone can see what's trending. KanDelta finds where the market hasn't caught up yet. A running brand launching in the UAE asks: what should we make?", href: `/?q=${q}`, target: "search" },
  { title: "Delta Map", say: "Across 48,197 running videos Oriane indexed in the last three months, the map compares creative angles. Left means few creators make it. Up means audiences respond more than average. The upper-left is the delta.", href: `/discover?q=${q}`, target: "map" },
  { title: "Open the delta", say: "Top-left is the opportunity delta. The strongest signal wasn't found in captions: Oriane's vision found it in the frames.", href: `/discover?q=${q}`, target: "top-opportunities" },
  { title: "Desert heat", say: "Across 48,197 running videos Oriane indexed, only 119 (0.25%) match the desert-heat visual. Those videos earn 2.1× the engagement per view. Of the visual matches, only 12 also mention heat, hot weather or humidity.", href: opp, target: "overview" },
  { title: "Real evidence", say: "Real videos from Oriane, ranked by visual match. Two of the three most-watched qualified examples are ads or boosted brand posts. This sample does not measure organic supply across the full market.", href: opp, target: "evidence" },
  { title: "Crowd Gap", say: "Compare what creators make with what audiences reward. The visual style and supporting dimensions use the measured market response, not a preset example.", href: opp, target: "crowd-gap" },
  { title: "Hidden conversation", say: "Six major running brands collect 2,068 mentions, only 33 in desert-heat videos. No single brand owns this space. Nike is discussed in 115 running videos that never tag or caption it.", href: opp, target: "hidden-conversation" },
  { title: "Creative DNA", say: "In the 12 qualified organic evidence videos, all start speech within one second and 10 use original audio. These are measured traits of the sample, not a rule for every creator.", href: opp, target: "dna" },
  { title: "Test with Audience", say: "We found the opportunity with real video evidence. Now an AI-simulated audience panel acts only as a creative pre-flight check. Directional, not consumer research.", href: opp, target: "audience-lab", action: "run-audience" },
  { title: "One improvement", say: "The simulated panel suggests stating the challenge in the first two seconds. This is a directional creative test, not a finding that the source videos used a challenge. Apply it and re-test.", href: opp, target: "audience-lab-recs" },
  { title: "Creators who can make it", say: "Ranked by proven execution against their own median, not follower count.", href: opp, target: "creators" },
  { title: "Build the campaign", say: "A brief a creator can shoot tomorrow, built from the evidence.", href: opp, target: "activate", action: "open-brief" },
  { title: "TikTok · Reels · Shorts", say: "One opportunity, adapted per platform. Oriane understands the video internet. KanDelta identifies the opportunity hidden inside it.", href: opp, target: "activate-platforms" },
];

interface Ctx {
  active: boolean;
  step: number;
  start: () => void;
  stop: () => void;
  go: (i: number) => void;
  lastAction: { action: Step["action"]; at: number } | null;
}

const PresenterContext = createContext<Ctx>({ active: false, step: 0, start: () => {}, stop: () => {}, go: () => {}, lastAction: null });
export const usePresenter = () => useContext(PresenterContext);

function scrollToTarget(id?: string) {
  if (!id) return window.scrollTo({ top: 0, behavior: "smooth" });
  let tries = 0;
  const tick = () => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 76;
      window.scrollTo({ top: y, behavior: "smooth" });
      el.animate?.([{ outlineColor: "rgba(110,231,183,0.55)" }, { outlineColor: "rgba(110,231,183,0)" }], { duration: 1400 });
    } else if (tries++ < 40) setTimeout(tick, 150);
  };
  tick();
}

export function PresenterProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [lastAction, setLastAction] = useState<Ctx["lastAction"]>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("ws-present") ?? "null");
      if (saved?.active) {
        // Restoring presenter state from browser storage after hydration (server has no storage).
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActive(true);
        setStep(saved.step ?? 0);
      }
    } catch {
      /* storage unavailable */
    }
  }, []);

  const persist = (a: boolean, s: number) => {
    try {
      localStorage.setItem("ws-present", JSON.stringify({ active: a, step: s }));
    } catch {
      /* ignore */
    }
  };

  const go = useCallback(
    (i: number) => {
      const idx = Math.max(0, Math.min(STEPS.length - 1, i));
      const s = STEPS[idx];
      setStep(idx);
      persist(true, idx);
      const current = window.location.pathname + window.location.search;
      if (current !== s.href) router.push(s.href, { scroll: false });
      setTimeout(() => scrollToTarget(s.target), current !== s.href ? 350 : 0);
      if (s.action) setTimeout(() => setLastAction({ action: s.action, at: Date.now() }), current !== s.href ? 900 : 250);
    },
    [router],
  );

  const start = useCallback(() => {
    setActive(true);
    go(0);
  }, [go]);
  const stop = useCallback(() => {
    setActive(false);
    persist(false, 0);
  }, []);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") go(step + 1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") go(step - 1);
      if (e.key === "Escape") stop();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, step, go, stop]);

  const value = useMemo(() => ({ active, step, start, stop, go, lastAction }), [active, step, start, stop, go, lastAction]);
  void pathname;

  return (
    <PresenterContext.Provider value={value}>
      {children}
      {active ? <PresenterBar /> : null}
    </PresenterContext.Provider>
  );
}

function PresenterBar() {
  const { step, go, stop } = usePresenter();
  const s = STEPS[step];
  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="fade-in flex w-full max-w-3xl items-center gap-4 rounded-xl border border-line bg-panel/95 px-4 py-3 shadow-2xl shadow-black/60 backdrop-blur">
        <BrandMark className="hidden h-6 w-6 shrink-0 sm:block" />
        <div className="shrink-0 text-xs tabular text-faint">
          {step + 1}/{STEPS.length}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{s.title}</div>
          <div className="truncate text-xs text-muted" title={s.say}>
            {s.say}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button aria-label="Previous step" onClick={() => go(step - 1)} disabled={step === 0} className="rounded-md p-1.5 text-muted hover:bg-panel-2 hover:text-fg disabled:opacity-30">
            <ChevronLeft size={18} />
          </button>
          <button aria-label="Next step" onClick={() => go(step + 1)} disabled={step === STEPS.length - 1} className="rounded-md bg-fg p-1.5 text-bg hover:bg-white disabled:opacity-30">
            <ChevronRight size={18} />
          </button>
          <button aria-label="Exit presentation" onClick={stop} className="ml-1 rounded-md p-1.5 text-faint hover:text-fg">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
