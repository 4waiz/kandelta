import type { Video } from "../oriane/normalize";
import type { MarketSpec } from "./market";

export interface RelevanceReview {
  qualified: boolean;
  reason: string;
  topicSignal: string | null;
  productMention: boolean;
  locationMention: boolean;
}

/** Conservative review of returned examples, not a re-estimate of Oriane's population. */
export function reviewExample(video: Video, market: MarketSpec): RelevanceReview {
  const text = `${video.caption} ${video.transcript ?? ""}`.toLowerCase();
  const locationMention = !!market.location?.phrases.some((p) => new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text));
  const productMention = /\b(running shoes?|running sneakers?|runners? shoes?|trainers?|footwear|sneakers?|kicks|zapatillas?|sepatu lari|schuhe)\b/i.test(text);
  const reject = (reason: string): RelevanceReview => ({ qualified: false, reason, topicSignal: null, productMention, locationMention });
  if (video.brandUnsafe) return reject("Brand-safety language in the post.");

  let topicSignal: string | null = null;
  if (market.universe === "running") {
    // A bare "running", "runner", or "marathon" also matches songs, TV marathons and idioms.
    if (/\b(blade runner|speed ?running a (?:game|cave)|movie marathon|film marathon|spideyverse marathon|running away for the summer)\b/i.test(text) ||
      /\b(film|movie|cinema|romcom|music video|official video|song|episode)\b/i.test(video.caption) && !/\b(run club|training run|marathon training|running shoes?|half marathon|5k race)\b/i.test(video.caption))
      return reject("Running term refers to entertainment or a figurative use, not running activity.");
    const match = text.match(/\b(run club|running club|marathon training|half.?marathon|long run|morning run|solo run|running shoes?|running gear|running outfit|running vlog|runningvlog|running route|training for (?:the |a )?marathon|(?:5k|10k|20 mile|12 mile) (?:run|race)|ran (?:a |the |[0-9]+ )|going (?:for|on) a run|go (?:for|on) a run|runner leg day|marat[oó]n|kil[oó]metros?|zapatillas? .{0,35} correr|marathonvorbereitung|berlin marathon)\b/i);
    if (!match && /\b(running|runner|marathon)\b/i.test(video.caption) &&
      /\b(kilomet(?:er|re)s?|miles?|pace|race|training|strava|shoes|sneakers|footwear|run club)\b/i.test(text))
      topicSignal = "Running term plus training, race, gear, or distance context";
    else if (match) topicSignal = match[0];
  } else {
    const phrase = market.phrases.find((p) => new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text));
    if (phrase) topicSignal = phrase;
  }
  if (!topicSignal) return reject("No clear on-topic activity or subject in caption or transcript; frame similarity alone is insufficient.");
  return { qualified: true, reason: "On-topic caption or transcript context; visual style remains a frame match only.", topicSignal, productMention, locationMention };
}