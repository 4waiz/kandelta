"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

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
  { title: "The problem", say: "A running brand launching in the UAE asks: what should we make? Everyone copies what's already trending, so they arrive when it's crowded.", href: `/?q=${q}`, target: "search" },
  { title: "WhiteSpace Map", say: "Oriane watched every running video from the last 3 months. Each bubble is a creative angle. Left = few creators make it. Up = audiences respond more than average.", href: `/discover?q=${q}`, target: "map" },
  { title: "Open the white space", say: "Top-left is white space. The strongest signal wasn't found in captions: Oriane's vision found it in the frames.", href: `/discover?q=${q}`, target: "top-opportunities" },
  { title: "Desert heat", say: "Only 119 of 48,197 running videos show running under hot desert sun, 0.25% of supply, yet they earn about 2× the engagement per view.", href: opp, target: "overview" },
  { title: "Real evidence", say: "These are the actual videos. Notice the most-watched ones are brand ads. Brands pay to distribute this look; organic creators barely make it.", href: opp, target: "evidence" },
  { title: "Crowd Gap", say: "Most creators default to first-person POV. Desert heat is a small slice of style-matched videos and earns double the engagement.", href: opp, target: "crowd-gap" },
  { title: "Creative DNA", say: "What the winners have in common, measured from transcripts and audio: talk in the first second, creator's own voice, a real challenge.", href: opp, target: "dna" },
  { title: "Test with Audience", say: "Before spending a dirham, pressure-test the brief with a simulated panel grounded in this evidence. Directional, not market research.", href: opp, target: "audience-lab", action: "run-audience" },
  { title: "One improvement", say: "The panel converges on one fix, and each recommendation cites the evidence it comes from.", href: opp, target: "audience-lab-recs" },
  { title: "Creators who can make it", say: "Ranked by proven execution against their own median, not follower count.", href: opp, target: "creators" },
  { title: "Build the campaign", say: "A brief a creator can shoot tomorrow, built from the evidence.", href: opp, target: "activate", action: "open-brief" },
  { title: "TikTok · Reels · Shorts", say: "One opportunity, adapted per platform. Oriane understands the video. WhiteSpace understands what to do about it.", href: opp, target: "activate-platforms" },
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
