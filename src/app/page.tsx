import { Suspense } from "react";
import { Eye, Flame, Sparkles } from "lucide-react";
import { SearchBox } from "@/components/SearchBox";

const STORY = [
  {
    icon: Flame,
    title: "The problem",
    body: "By the time a format is trending, it's already crowded. Brands and creators end up chasing the same videos everyone else is copying.",
  },
  {
    icon: Eye,
    title: "What Oriane sees",
    body: "Oriane watches millions of TikTok and Instagram videos like a person would: what's on screen, what's said, and how people respond.",
  },
  {
    icon: Sparkles,
    title: "What KanDelta finds",
    body: "Creative angles audiences reward that few creators make yet, with the proof, the recipe, the right creators, and a brief ready to shoot.",
  },
];

const JOURNEY = ["Discover", "Evidence", "Crowd Gap", "Creative DNA", "Audience Lab", "Creators", "Activate"];

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl pt-20 sm:pt-28">
      <div className="fade-in">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">KanDelta · Opportunity intelligence for the video internet</div>
        <h1 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-[56px]">
          Find the delta
          <br />
          <span className="text-muted">before the market does.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          KanDelta analyzes the video internet to uncover places where audience response and creator supply diverge before the opportunity becomes crowded.
        </p>
      </div>

      <div className="mt-9">
        <Suspense fallback={<div className="h-14 rounded-xl border border-line bg-panel" />}>
          <SearchBox />
        </Suspense>
      </div>

      <div className="mt-20 grid gap-3 sm:grid-cols-3">
        {STORY.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-xl border border-line-soft bg-panel/60 p-5">
            <Icon size={18} className="text-faint" />
            <div className="mt-3 text-sm font-semibold">{title}</div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-faint">
        {JOURNEY.map((j, i) => (
          <span key={j} className="inline-flex items-center gap-2">
            <span className={i === 0 ? "text-accent" : "text-muted"}>{j}</span>
            {i < JOURNEY.length - 1 ? <span>→</span> : null}
          </span>
        ))}
      </div>
    </div>
  );
}
