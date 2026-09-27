// AUDIENCE LAB — simulated audience panel for creative pre-flight checks.
// Deterministic and explainable: each persona reacts to measurable features of the draft, weighed against norms
// measured by Oriane on this opportunity's evidence videos. Directional feedback, NOT market research.

export interface LabContext {
  topic: string;
  location: string | null;
  opportunity: string;
  evidenceCount: number;
  talkFirstShare: number | null; // evidence share speaking within 1s
  medianDuration: number | null;
  originalAudioShare: number | null;
  topHookType: string | null;
  arabicShare: number;
  crowdConsensus: string | null; // what most creators do (crowd gap)
  crowdWinner: string | null; // what audiences reward
}

export interface Features {
  hook: string;
  hookWords: number;
  stakesAt: number | null; // estimated second at which the stakes/challenge is stated
  hookQuestion: boolean;
  hookNumber: boolean;
  jargon: string[];
  beats: string[];
  proof: boolean;
  productBeat: number | null;
  cta: string;
  hardSell: boolean;
  price: boolean;
  local: boolean;
  arabic: boolean;
  firstPerson: boolean;
  estSeconds: number;
  usesConsensus: boolean;
}

export interface Persona {
  id: string;
  name: string;
  initials: string;
  who: string;
}

export interface Reaction {
  persona: Persona;
  verdict: "Keeps watching" | "Might scroll" | "Scrolls";
  scores: { label: string; value: number }[]; // 1–5
  quote: string;
  because: string[]; // which features / evidence drove the reaction
  flags: string[];
}

export interface Recommendation {
  id: string;
  title: string;
  detail: string;
  flaggedBy: string[];
  evidence: string;
}

export interface LabResult {
  features: Features;
  reactions: Reaction[];
  consensus: string[];
  recommendations: Recommendation[];
}

export const PERSONAS: Persona[] = [
  { id: "runner", name: "Serious runner", initials: "SR", who: "Runs 40 km a week, knows the gear" },
  { id: "student", name: "Casual student", initials: "CS", who: "18–24, watches between classes" },
  { id: "buyer", name: "Potential buyer", initials: "PB", who: "Actively shopping for the product" },
  { id: "creator", name: "Content creator", initials: "CC", who: "Makes fitness content, judges craft" },
  { id: "scroller", name: "Heavy short-form viewer", initials: "SF", who: "2+ hours of Reels/TikTok a day" },
  { id: "local", name: "UAE resident", initials: "AE", who: "Lives the heat, bilingual EN/AR feed" },
];

const JARGON = ["carbon plate", "stack height", "heel-to-toe", "drop", "midsole", "outsole", "foam", "eva", "tpu", "pebax", "cushioning", "pronation", "energy return", "rocker", "breathability", "specs", "proprietary", "engineered"];
const WPS = 2.6; // conversational speaking rate

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

export function extractFeatures(script: string, ctx: LabContext): Features {
  const lines = script.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const strip = (l: string) => l.replace(/^[A-Z ]+(\([^)]*\))?\s*\d*\s*:\s*/, "").trim();
  const hookLine = lines.find((l) => /^hook/i.test(l)) ?? lines[0] ?? "";
  const hook = strip(hookLine);
  const beats = lines.filter((l) => /^beat/i.test(l)).map(strip);
  const cta = strip(lines.find((l) => /^cta/i.test(l)) ?? "");
  const body = [hook, ...beats, cta].join(" ").toLowerCase();

  // When is the stake stated? Find the first sentence of the hook containing a challenge/test/question marker.
  const sentences = hook.split(/(?<=[.?!])\s+/);
  let elapsed = 0;
  let stakesAt: number | null = null;
  for (const s of sentences) {
    if (/\?|survive|test|challenge|what happens|can (they|it|you|i)|\bvs\b/i.test(s)) {
      stakesAt = elapsed;
      break;
    }
    elapsed += words(s) / WPS;
  }

  const spoken = words(hook) + words(cta);
  const estSeconds = Math.round(Math.max(spoken / WPS + beats.length * 4, 8));
  const topic = ctx.topic.toLowerCase();
  const productBeat = beats.findIndex((b) => b.toLowerCase().includes(topic.split(" ").slice(-1)[0]) || /product|close-up|gear|shoe/i.test(b));
  const consensus = ctx.crowdConsensus?.toLowerCase() ?? "";
  return {
    hook,
    hookWords: words(hook),
    stakesAt,
    hookQuestion: /\?/.test(hook),
    hookNumber: /\d/.test(hook),
    jargon: JARGON.filter((j) => new RegExp(`\\b${j}\\b`, "i").test(body)),
    beats,
    proof: beats.some((b) => /temperature|thermometer|number|timer|km|pace|verdict|result|proof|data|°/i.test(b)),
    productBeat: productBeat >= 0 ? productBeat : null,
    cta,
    hardSell: /\b(buy|shop|link in bio|discount|code|order now)\b/i.test(cta),
    price: /\b(aed|dhs|dirham|price|cost|budget|worth it|\$)\b/i.test(body),
    local: /\b(uae|dubai|abu dhabi|desert|gulf|42°c|45°c|summer)\b/i.test(body) || /\d{2}\s?°/.test(body),
    arabic: /[؀-ۿ]/.test(script),
    firstPerson: /\b(i|my|me|we)\b/i.test(body),
    estSeconds,
    usesConsensus: !!consensus && body.includes(consensus.split(" ")[0]) && consensus !== (ctx.crowdWinner ?? "").toLowerCase(),
  };
}

const clamp = (x: number) => Math.max(1, Math.min(5, Math.round(x)));

export function runPanel(script: string, ctx: LabContext): LabResult {
  const f = extractFeatures(script, ctx);
  const med = ctx.medianDuration;
  const lateStakes = f.stakesAt === null || f.stakesAt > 2;
  const longHook = f.hookWords > 14;
  const tooLong = med ? f.estSeconds > med * 1.5 : f.estSeconds > 60;
  const reactions: Reaction[] = [];

  for (const p of PERSONAS) {
    const because: string[] = [];
    const flags: string[] = [];
    let interest = 3;
    let clarity = 4;
    let authenticity = 3;
    let intent = 2.5;
    let quote = "";

    if (f.proof) {
      interest += p.id === "runner" || p.id === "buyer" ? 1 : 0.5;
      because.push("Draft includes a proof beat (numbers / temperature / verdict)");
    }
    if (lateStakes && (p.id === "scroller" || p.id === "student")) {
      interest -= 1.5;
      clarity -= 1.5;
      flags.push("late-stakes");
      because.push(f.stakesAt === null ? "The hook never states what's being tested" : `The challenge is stated ~${f.stakesAt.toFixed(0)}s in; the evidence talks within 1s`);
    }
    if (longHook && p.id === "scroller") {
      interest -= 0.5;
      flags.push("long-hook");
      because.push(`Hook is ${f.hookWords} words (~${(f.hookWords / WPS).toFixed(0)}s spoken)`);
    }
    if (f.jargon.length && (p.id === "student" || p.id === "scroller")) {
      clarity -= 1.5;
      interest -= 1;
      flags.push("jargon");
      because.push(`Technical terms: ${f.jargon.join(", ")}`);
    }
    if (f.jargon.length && p.id === "runner") {
      interest += 0.5;
      because.push("Specific gear language reads as credible");
    }
    if (!f.price && p.id === "buyer") {
      intent -= 0.5;
      flags.push("no-price");
      because.push("No product name / price context in the draft");
    }
    if (f.price && p.id === "buyer") {
      intent += 1;
      because.push("Price / value context present");
    }
    if (f.hardSell) {
      authenticity -= 1.5;
      interest -= p.id === "creator" || p.id === "runner" ? 1 : 0.5;
      flags.push("hard-sell");
      because.push("Hard-sell CTA (buy / link / code)");
    }
    if (f.firstPerson || (ctx.originalAudioShare ?? 0) >= 0.5) {
      authenticity += 1;
      if (ctx.originalAudioShare !== null) because.push(`${Math.round((ctx.originalAudioShare ?? 0) * 100)}% of evidence uses the creator's own voice, and this format suits it`);
    }
    if (p.id === "creator") {
      if (f.usesConsensus) {
        interest -= 1;
        flags.push("consensus");
        because.push(`Leans on ${ctx.crowdConsensus}, which is what most creators already make`);
      } else {
        interest += 1;
        because.push(`${ctx.opportunity} is under-supplied: few creators make it`);
      }
      if (f.beats.length >= 4 && f.beats.length <= 6) {
        interest += 0.5;
        because.push(`${f.beats.length}-beat structure is tight`);
      }
    }
    if (p.id === "local") {
      if (f.local) {
        interest += 1.5;
        because.push("Local heat cue is instantly relatable");
      }
      if (!f.arabic) {
        flags.push("no-arabic");
        because.push(ctx.arabicShare > 0 ? "No Arabic text; some evidence videos are Arabic" : "No Arabic text; no Arabic examples exist in the evidence yet");
      } else {
        interest += 1;
        because.push("Bilingual copy");
      }
    }
    if (tooLong && (p.id === "scroller" || p.id === "student")) {
      interest -= 1;
      flags.push("too-long");
      because.push(`Estimated ${f.estSeconds}s vs evidence median ${med ? Math.round(med) + "s" : "n/a"}`);
    }
    if (!f.cta) {
      flags.push("no-cta");
    }

    // Quotes: grounded in the strongest positive and negative driver for this persona.
    const hookShort = f.hook.length > 70 ? f.hook.slice(0, 67) + "…" : f.hook;
    switch (p.id) {
      case "runner":
        quote = f.proof
          ? `Real conditions and a number at the end: that's the review I actually trust.${f.hardSell ? " Drop the sales pitch though." : ""}`
          : "Show me data from the run, not just vibes, or I won't believe the verdict.";
        break;
      case "student":
        quote = flags.includes("jargon")
          ? `Lost me at "${f.jargon[0]}". I don't know what that means.`
          : lateStakes
            ? "I don't get what you're testing until a few seconds in. Say it first."
            : "Clear and kind of funny that they're doing this in 42°C. I'd watch to the end.";
        break;
      case "buyer":
        quote = f.price
          ? "Good. I know what it costs and whether it held up, so I'd check the link."
          : "I'd keep watching, but tell me which shoe and the price before the CTA.";
        break;
      case "creator":
        quote = flags.includes("consensus")
          ? `This looks like every ${ctx.crowdConsensus?.toLowerCase()} video. The heat angle is the fresh part, so lean into it.`
          : `Almost nobody is making ${ctx.opportunity.toLowerCase()} content. The ${f.beats.length}-beat arc is tight. I'd steal this format.`;
        break;
      case "scroller":
        quote = lateStakes
          ? `"${hookShort}" is a slow start. The challenge needs to hit in the first 2 seconds or I'm gone.`
          : f.hookQuestion
            ? "The question hooked me instantly. I want to see if they survive."
            : "Fine opener, but give me a question or a number up front.";
        break;
      case "local":
        quote = f.local
          ? f.arabic
            ? "This is literally my summer. Bilingual text makes it shareable to family too."
            : "This is literally my summer. Add Arabic on-screen text and I'd send it to friends."
          : "Why isn't this shot here? The heat is the whole story in the UAE.";
        break;
    }

    const total = (interest + clarity + authenticity) / 3;
    const verdict: Reaction["verdict"] = total >= 3.5 ? "Keeps watching" : total >= 2.6 ? "Might scroll" : "Scrolls";
    reactions.push({
      persona: p,
      verdict,
      scores: [
        { label: "Hook clarity", value: clamp(clarity) },
        { label: "Interest", value: clamp(interest) },
        { label: "Authenticity", value: clamp(authenticity) },
        { label: "Purchase intent", value: clamp(intent + (interest - 3) * 0.3) },
      ],
      quote,
      because,
      flags,
    });
  }

  // ---- consensus + recommendations (ranked by how many personas raised the issue)
  const count = (flag: string) => reactions.filter((r) => r.flags.includes(flag));
  const n = reactions.length;
  const positive = reactions.filter((r) => r.verdict === "Keeps watching").length;
  const consensus: string[] = [];
  consensus.push(`${positive}/${n} personas would keep watching.`);
  if (count("late-stakes").length) consensus.push(`${count("late-stakes").length}/${n} found the opening slow to state the challenge.`);
  if (f.proof) consensus.push(`${reactions.filter((r) => r.because.some((b) => b.startsWith("Draft includes a proof beat"))).length}/${n} responded to the proof beat.`);
  if (count("jargon").length) consensus.push(`${count("jargon").length}/${n} were confused by technical terms.`);
  if (count("no-price").length) consensus.push("The buyer wanted product and price context before the CTA.");
  if (count("no-arabic").length) consensus.push("The UAE persona asked for bilingual on-screen text.");

  const recs: Recommendation[] = [];
  const names = (rs: Reaction[]) => rs.map((r) => r.persona.name);
  if (count("late-stakes").length) {
    const q = f.hook.split(/(?<=[.?!])\s+/).find((s) => /\?|survive|test|challenge/i.test(s));
    recs.push({
      id: "stakes-first",
      title: "State the challenge in the first 2 seconds",
      detail: q ? `Open with "${q.trim()}" and move the setup line after it.` : "Open with the question you're testing (e.g. \"Can these survive 42°C?\").",
      flaggedBy: names(count("late-stakes")),
      evidence: ctx.talkFirstShare !== null ? `${Math.round(ctx.talkFirstShare * 100)}% of the ${ctx.evidenceCount} evidence videos start talking within 1 second.` : "Evidence videos open on the premise.",
    });
  }
  if (count("jargon").length)
    recs.push({
      id: "jargon",
      title: "Swap technical terms for what the viewer feels",
      detail: `Replace ${f.jargon.map((j) => `"${j}"`).join(", ")} with plain outcomes ("my feet stayed cool", "no blisters at km 8").`,
      flaggedBy: names(count("jargon")),
      evidence: "Persona feedback on the draft; not a measured Oriane signal.",
    });
  if (count("no-price").length)
    recs.push({
      id: "price",
      title: "Name the product and price on screen before the CTA",
      detail: "Add a lower-third in the close-up beat: model name + price in AED.",
      flaggedBy: names(count("no-price")),
      evidence: "Persona feedback on the draft; not a measured Oriane signal.",
    });
  if (count("no-arabic").length)
    recs.push({
      id: "arabic",
      title: "Add Arabic on-screen text",
      detail: "Keep the voiceover, add bilingual EN/AR captions for the temperature and verdict cards.",
      flaggedBy: names(count("no-arabic")),
      evidence: ctx.arabicShare > 0 ? "Some evidence videos are already Arabic-language." : "No Arabic-language examples in the evidence yet: a differentiator, but untested.",
    });
  if (count("hard-sell").length)
    recs.push({
      id: "soft-cta",
      title: "Replace the hard sell with a comment prompt",
      detail: "\"What temperature would you tap out at?\" invites replies instead of asking for a purchase.",
      flaggedBy: names(count("hard-sell")),
      evidence: "Most evidence videos carry no hard CTA.",
    });
  if (count("too-long").length)
    recs.push({
      id: "length",
      title: `Tighten to about ${med ? Math.round(med) : 45}s`,
      detail: "Cut the setup beat, not the struggle beat, which is the payoff.",
      flaggedBy: names(count("too-long")),
      evidence: med ? `Median evidence duration is ${Math.round(med)}s.` : "",
    });
  recs.sort((a, b) => b.flaggedBy.length - a.flaggedBy.length);

  return { features: f, reactions, consensus, recommendations: recs };
}
