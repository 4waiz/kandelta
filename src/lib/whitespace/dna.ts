import type { Video } from "../oriane/normalize";
import type { GroupStats } from "./scoring";

// Creative DNA: deterministic patterns measured on the evidence videos. Every trait carries its support
// ("7 of 12 videos") and the ids of the videos it came from. No LLM, no invented attributes.

export interface Trait {
  label: string;
  value: string;
  support: number;
  of: number;
  videoIds: string[];
  note?: string;
}

export interface CreativeDNA {
  sample: number;
  hooks: { text: string; videoId: string; handle: string; reach: number | null }[];
  hookTypes: { type: string; count: number }[];
  traits: Trait[];
  hashtags: { tag: string; count: number }[];
  audienceVoice: { text: string; likes: number; handle: string | null; videoId: string }[];
  platforms: { platform: string; count: number; medianDuration: number | null }[];
  norms: {
    talkFirstShare: number | null; // share of transcribed videos speaking within 1s
    medianDuration: number | null;
    originalAudioShare: number | null;
    medianWordsPerSecond: number | null;
    ctaShare: number;
    topHookType: string | null;
    arabicShare: number;
  };
}

const CTA_PATTERNS: [string, RegExp][] = [
  ["Comment prompt", /\bcomment\b|let me know|tell me|drop a/i],
  ["Follow prompt", /\bfollow (for|me)\b|\bfollow\b.*\bmore\b/i],
  ["Save / share prompt", /\bsave (this|it|for)\b|\bshare (this|with)\b|tag (a|your)/i],
  ["Link / shop", /link in bio|\bshop\b|use code|\bdiscount\b|\border\b/i],
];

function median(xs: number[]): number | null {
  const s = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function hookType(text: string): string {
  const t = text.toLowerCase();
  if (/\?/.test(t)) return "Question";
  if (/\bpov\b/.test(t)) return "POV";
  if (/\b(i tried|i tested|testing|tested|i ran|i did)\b/.test(t)) return "First-person test";
  if (/\b(challenge|can (i|you|it)|survive)\b/.test(t)) return "Challenge";
  if (/\d/.test(t)) return "Number / stat";
  if (/\b(you|your)\b/.test(t)) return "Direct address";
  return "Statement";
}

export function deriveDNA(videos: Video[], market: GroupStats): CreativeDNA {
  void market;
  const n = videos.length;
  const transcribed = videos.filter((v) => v.firstSpeechAt !== null);
  const talkFirst = transcribed.filter((v) => (v.firstSpeechAt ?? 99) <= 1);
  const visualFirst = videos.filter((v) => v.firstSpeechAt === null || v.firstSpeechAt > 3);
  const durations = videos.map((v) => v.duration ?? NaN);
  const medDur = median(durations);
  const withAudio = videos.filter((v) => v.audio.type);
  const original = withAudio.filter((v) => v.audio.type === "original");
  const wps = median(videos.map((v) => v.wordsPerSecond ?? NaN));
  const hooked = videos.filter((v) => v.hook && v.hook.length > 3);
  const types = new Map<string, string[]>();
  for (const v of hooked) {
    const t = hookType(v.hook!);
    types.set(t, [...(types.get(t) ?? []), v.id]);
  }
  const hookTypes = [...types.entries()].map(([type, ids]) => ({ type, count: ids.length })).sort((a, b) => b.count - a.count);

  const traits: Trait[] = [];
  if (transcribed.length) {
    traits.push({
      label: "Opening",
      value: talkFirst.length >= transcribed.length / 2 ? "Talk-first: speech starts within 1 second" : "Visual-first: the picture carries the first seconds",
      support: talkFirst.length >= transcribed.length / 2 ? talkFirst.length : visualFirst.length,
      of: talkFirst.length >= transcribed.length / 2 ? transcribed.length : n,
      videoIds: (talkFirst.length >= transcribed.length / 2 ? talkFirst : visualFirst).map((v) => v.id),
      note: "From Oriane transcript timestamps.",
    });
  }
  if (medDur !== null) {
    const short = videos.filter((v) => (v.duration ?? 0) <= 30);
    const long = videos.filter((v) => (v.duration ?? 0) > 30);
    const longForm = long.length >= short.length;
    traits.push({
      label: "Duration",
      value: longForm ? `Median ${Math.round(medDur)}s: story-length, not a quick cut` : `Median ${Math.round(medDur)}s: short and fast`,
      support: longForm ? long.length : short.length,
      of: n,
      videoIds: (longForm ? long : short).map((v) => v.id),
      note: longForm ? "Share of videos longer than 30s." : "Share of videos 30s or shorter.",
    });
  }
  if (wps !== null) {
    const voiceLed = videos.filter((v) => (v.wordsPerSecond ?? 0) >= 1.5);
    traits.push({
      label: "Delivery",
      value: wps >= 1.5 ? `Voice-led: ~${wps.toFixed(1)} spoken words per second` : `Visual/music-led: ~${wps.toFixed(1)} spoken words per second`,
      support: wps >= 1.5 ? voiceLed.length : n - voiceLed.length,
      of: n,
      videoIds: (wps >= 1.5 ? voiceLed : videos.filter((v) => (v.wordsPerSecond ?? 0) < 1.5)).map((v) => v.id),
      note: "Transcript words ÷ duration.",
    });
  }
  if (withAudio.length) {
    traits.push({
      label: "Sound",
      value: original.length >= withAudio.length / 2 ? "Original audio (creator's own voice/sound)" : "Licensed / trending music",
      support: original.length >= withAudio.length / 2 ? original.length : withAudio.length - original.length,
      of: withAudio.length,
      videoIds: (original.length >= withAudio.length / 2 ? original : withAudio.filter((v) => v.audio.type !== "original")).map((v) => v.id),
    });
  }
  const ctaCounts = CTA_PATTERNS.map(([label, re]) => ({ label, ids: videos.filter((v) => re.test(v.caption) || re.test(v.transcript ?? "")).map((v) => v.id) }));
  const topCta = ctaCounts.sort((a, b) => b.ids.length - a.ids.length)[0];
  const anyCta = new Set(ctaCounts.flatMap((c) => c.ids));
  traits.push({
    label: "Call to action",
    value: topCta && topCta.ids.length ? `${topCta.label} is the most common CTA · ${anyCta.size} of ${n} include any CTA` : "Most videos carry no explicit CTA",
    support: topCta?.ids.length ? anyCta.size : n,
    of: n,
    videoIds: topCta?.ids ?? [],
  });
  const tagged = videos.filter((v) => v.mentions.length > 0);
  traits.push({
    label: "Brand tagging",
    value: tagged.length ? `${tagged.length} of ${n} tag a brand or person` : "No brand tags in the evidence",
    support: tagged.length,
    of: n,
    videoIds: tagged.map((v) => v.id),
  });
  const arabic = videos.filter((v) => v.captionLanguage === "ar" || v.transcriptLanguage === "ar" || /[؀-ۿ]/.test(v.caption));
  const langs = new Map<string, number>();
  for (const v of videos) langs.set(v.captionLanguage ?? "unknown", (langs.get(v.captionLanguage ?? "unknown") ?? 0) + 1);
  traits.push({
    label: "Language",
    value: [...langs.entries()].sort((a, b) => b[1] - a[1]).map(([l, c]) => `${l.toUpperCase()} ${c}`).join(" · "),
    support: n,
    of: n,
    videoIds: arabic.map((v) => v.id),
    note: arabic.length ? `${arabic.length} contain Arabic.` : "No Arabic-language examples in this evidence set.",
  });

  const tagCounts = new Map<string, number>();
  for (const v of videos) for (const h of new Set(v.hashtags)) tagCounts.set(h, (tagCounts.get(h) ?? 0) + 1);
  const hashtags = [...tagCounts.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count).slice(0, 8);

  const audienceVoice = videos
    .flatMap((v) => v.topComments.map((c) => ({ ...c, videoId: v.id })))
    .filter((c) => c.text.length > 12 && c.text.length < 220)
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 4);

  const platMap = new Map<string, Video[]>();
  for (const v of videos) platMap.set(v.platform, [...(platMap.get(v.platform) ?? []), v]);
  const platforms = [...platMap.entries()].map(([platform, vs]) => ({ platform, count: vs.length, medianDuration: median(vs.map((v) => v.duration ?? NaN)) }));

  return {
    sample: n,
    hooks: hooked
      .slice()
      .sort((a, b) => (b.reach ?? 0) - (a.reach ?? 0))
      .slice(0, 4)
      .map((v) => ({ text: v.hook!.slice(0, 160), videoId: v.id, handle: v.creator.handle, reach: v.reach })),
    hookTypes,
    traits,
    hashtags,
    audienceVoice,
    platforms,
    norms: {
      talkFirstShare: transcribed.length ? talkFirst.length / transcribed.length : null,
      medianDuration: medDur,
      originalAudioShare: withAudio.length ? original.length / withAudio.length : null,
      medianWordsPerSecond: wps,
      ctaShare: n ? anyCta.size / n : 0,
      topHookType: hookTypes[0]?.type ?? null,
      arabicShare: n ? arabic.length / n : 0,
    },
  };
}
