import type { Video } from "../oriane/normalize";
import type { MarketAnalysis, Opportunity } from "./analyze";
import type { Angle } from "./concepts";
import { ANGLES } from "./concepts";
import type { CreativeDNA } from "./dna";

// Campaign brief + platform adaptations. Numbers come from Oriane; creative wording comes from the angle
// templates and is labelled as a recommendation.

export interface PlatformPlan {
  platform: "TikTok" | "Instagram Reels" | "YouTube Shorts";
  aspect: string;
  length: string;
  hook: string;
  opening: string;
  structure: string[];
  caption: string;
  cta: string;
  onScreenText: string[];
  pacing: string;
  basis: string;
}

export interface Brief {
  title: string;
  opportunity: string;
  whyNow: string;
  audience: string;
  premise: string;
  hook: string;
  hookReference: { text: string; handle: string; videoId: string } | null;
  openingShot: string;
  structure: string[];
  tone: string;
  creatorProfile: string;
  cta: string;
  references: { videoId: string; handle: string; url: string | null; thumbnail: string | null; views: number; reach: number | null }[];
  script: string;
  platforms: PlatformPlan[];
  disclaimer: string;
}

interface BriefInput {
  analysis: MarketAnalysis;
  opportunity: Opportunity;
  angle: Angle;
  dna: CreativeDNA;
  evidence: Video[];
  creators: { handle: string; followers: number; fit: number }[];
  compoundOf: string | null;
}

const fill = (s: string, topic: string) => s.replaceAll("{topic}", topic);
const times = (x: number) => `${x >= 10 ? x.toFixed(0) : x.toFixed(1)}×`;
const pct = (x: number) => (x < 0.01 ? `${(x * 100).toFixed(1)}%` : `${Math.round(x * 100)}%`);

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function buildBrief({ analysis, opportunity: o, angle, dna, evidence, creators, compoundOf }: BriefInput): Brief {
  const topic = analysis.market.label;
  const place = analysis.market.location?.label ?? null;
  const heatWords = place ? `${place} heat` : "outdoor heat";
  const format = compoundOf ? ANGLES.find((a) => a.id === compoundOf) : null;

  const title = angle.id === "heat" || compoundOf
    ? `${place ?? "Desert"} Heat Test: ${titleCase(topic)}`
    : `${titleCase(topic)}: ${angle.name}`;

  const hook = compoundOf
    ? compoundOf === "challenge"
      ? `What changes when you take ${topic} into ${heatWords}? Let's test it.`
      : compoundOf === "tested"
        ? `I tested ${topic} outdoors so you don't have to.`
        : `3 things to test about ${topic} in outdoor heat.`
    : fill(angle.hook, topic);

  const structure = compoundOf
    ? [
        "Show the real conditions on screen, if measured",
        `Close-up of the ${topic} before the test`,
        format?.id === "tips" ? "Tip 1 demonstrated outdoors" : "Start the run in full sun",
        format?.id === "tips" ? "Tip 2 and the mistake people make" : "The struggle: sweat, heat shimmer, pace dropping",
        "Result and honest verdict; show a number only if measured",
      ]
    : angle.structure.map((s) => fill(s, topic));

  const premise = compoundOf
    ? `Test ${topic} in ${heatWords} on camera and show what happens. This is a creative recommendation based on a visual-match slice, not evidence that any particular product withstands heat.`
    : fill(angle.premise, topic);

  const talkFirst = (dna.norms.talkFirstShare ?? 0) >= 0.5;
  const med = dna.norms.medianDuration;
  const openingShot = talkFirst
    ? `Open talking within the first second (as ${Math.round((dna.norms.talkFirstShare ?? 0) * 100)}% of the transcribed evidence does), with the conditions or stakes visible in frame.`
    : `Open on a strong visual (the environment or the product under stress) before anyone speaks. Most evidence videos let the picture carry the first seconds.`;

  const tone =
    (dna.norms.originalAudioShare ?? 0) >= 0.5
      ? "Authentic, first-person, original audio. The evidence skews toward the creator's own voice rather than trending tracks."
      : "Energetic and music-led. The evidence skews toward licensed / trending audio.";

  const topCreators = creators.slice(0, 3);
  const followerBand = topCreators.length
    ? `${Math.round(Math.min(...topCreators.map((c) => c.followers)) / 1000)}K–${Math.round(Math.max(...topCreators.map((c) => c.followers)) / 1000)}K followers`
    : "mid-sized creators";
  const creatorProfile = topCreators.length
    ? `Potential collaborators observed in the evidence, around ${followerBand}. Check each creator's supporting videos and personal baseline where available; this is not an endorsement.`
    : "Find creators with relevant on-camera experience. No creator-history match is established for this slice.";

  const ctaTrait = dna.traits.find((t) => t.label === "Call to action");
  const cta = ctaTrait && dna.norms.ctaShare >= 0.3
    ? `Close with a comment prompt ("What should we test next?"). ${ctaTrait.value}.`
    : `Keep the CTA light and after the result ("Would you run in this?"). Most evidence videos carry no hard CTA (${ctaTrait?.value ?? ""}).`;

  const refVid = dna.hooks[0] ?? null;
  const references = evidence.slice(0, 4).map((v) => ({ videoId: v.id, handle: v.creator.handle, url: v.url, thumbnail: v.thumbnail, views: v.views, reach: v.reach }));

  const opportunity = `${o.name} holds ${pct(o.supplyShare)} of ${topic} video supply (${o.stats.n.toLocaleString("en-US")} of ${analysis.baseline.n.toLocaleString("en-US")} videos, last 3 months) yet earns ${times(o.reachIndex)} the market's views per follower and ${times(o.engagementIndex)} its engagement per view.`;
  const whyNow = `Observed supply stage: ${o.stage}.${o.momentum !== null ? ` Its last-30-day share of posts is ${times(o.momentum)} the market's last-30-day share.` : ""} This describes the measured window, not future demand.`;

  const audience = `${topic} viewers on TikTok and Instagram${place ? `; test local relevance in ${place} separately because location-tagged evidence is limited` : ""}. Observed post metrics do not establish a demographic or consumer preference.`;

  const script = [
    `SUGGESTED HOOK: ${hook}`,
    ...structure.map((s, i) => `BEAT ${i + 1}: ${s}`),
    `CTA: ${compoundOf === "challenge" ? "Would you run in this? Comment the temperature you'd tap out at." : "What should we test next? Comment below."}`,
  ].join("\n");

  const isHeat = angle.id === "heat" || !!compoundOf;
  const plat = (p: string) => dna.platforms.find((x) => x.platform === p);
  const tk = plat("tiktok");
  const ig = plat("instagram");
  const lengthFrom = (d: number | null | undefined, fallback: string) => (d ? `${Math.max(12, Math.round(d * 0.8))}–${Math.round(d * 1.1)}s` : fallback);
  const tagsFor = (platform: string) =>
    [...new Map(evidence.filter((v) => v.platform === platform).flatMap((v) => v.hashtags).map((h) => [h, h])).keys()].slice(0, 4).join(" ");

  const platforms: PlatformPlan[] = [
    {
      platform: "TikTok",
      aspect: "9:16",
      length: lengthFrom(tk?.medianDuration, "20–30s"),
      hook,
      opening: "Cold open on the most extreme moment. No logo, no intro card.",
      structure: structure.slice(0, 5),
      caption: `${hook.split(".")[0]}. ${tagsFor("tiktok")}`.trim(),
      cta: isHeat ? "Comment prompt tied to the test (\"What temp would you tap out at?\")" : "Comment prompt tied to the verdict (\"Agree or disagree?\")",
      onScreenText: isHeat ? ["Actual conditions, if measured", "What happened?", "Verdict"] : [hook.split(/[.?!]/)[0], "Beat labels", "Verdict"],
      pacing: "Test a fast opening; the proposed timing is a creative recommendation, not a measured outcome.",
      basis: tk ? `Median TikTok evidence duration ${Math.round(tk.medianDuration ?? 0)}s (${tk.count} videos).` : "No TikTok videos in this evidence set; generic suggestion.",
    },
    {
      platform: "Instagram Reels",
      aspect: "9:16",
      length: lengthFrom(ig?.medianDuration, "20–35s"),
      hook,
      opening: "Same cold open, slightly more polished grade; product visible by beat 2.",
      structure: structure.slice(0, 5),
      caption: `${premise} ${tagsFor("instagram")}`.trim(),
      cta: isHeat ? "Save + share prompt (\"Send this to the runner who complains about the heat\")" : "Save + share prompt",
      onScreenText: isHeat ? ["Actual conditions, if measured", "Beat labels", "Verdict card"] : ["Beat labels", "Verdict card"],
      pacing: "Medium. Allow one beat of B-roll for texture.",
      basis: ig ? `Median Instagram evidence duration ${Math.round(ig.medianDuration ?? 0)}s (${ig.count} videos).` : "No Instagram videos in this evidence set; generic suggestion.",
    },
    {
      platform: "YouTube Shorts",
      aspect: "9:16",
      length: "30–45s",
      hook: isHeat ? `${titleCase(topic)} in the heat: what actually happens` : hook,
      opening: "Title-style framing in the first frame; state the question explicitly.",
      structure: [...structure.slice(0, 4), "Recap card with the verdict and the numbers"],
      caption: isHeat ? `${titleCase(topic)} outdoor heat test. Honest results.` : `${title}. Honest results.`,
      cta: "Subscribe for the next test",
      onScreenText: ["The question", "The numbers", "Verdict"],
      pacing: "Slightly more explanatory; Shorts viewers tolerate a clearer setup.",
      basis: "Oriane indexes Instagram and TikTok only, so this adaptation is not grounded in Oriane data.",
    },
  ];

  return {
    title,
    opportunity,
    whyNow,
    audience,
    premise,
    hook,
    hookReference: refVid ? { text: refVid.text, handle: refVid.handle, videoId: refVid.videoId } : null,
    openingShot,
    structure,
    tone,
    creatorProfile,
    cta,
    references,
    script,
    platforms,
    disclaimer: "Recommendation derived from observed evidence. It is not a guaranteed performance prediction.",
  };
}
