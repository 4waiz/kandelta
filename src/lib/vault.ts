"use client";

import { useCallback, useEffect, useState } from "react";
import type { Video } from "./oriane/normalize";

// Evidence Vault: a swipe file of real Oriane-derived videos. Stored in this browser only.
// We keep metadata + source URL + thumbnail + intelligence — never the video file itself.

export interface VaultItem {
  videoId: string;
  url: string | null;
  thumbnail: string | null;
  platform: string;
  handle: string;
  caption: string;
  views: number;
  reach: number | null;
  er: number | null;
  hook: string | null;
  tags: string[];
  note: string;
  savedAt: string;
  from: { query: string; opportunity: string } | null;
}

export interface Collection {
  id: string;
  name: string;
  createdAt: string;
  items: VaultItem[];
}

export const ALL_TAGS = ["HOOK", "CHALLENGE", "POV", "ORIGINAL AUDIO", "ENGLISH", "ARABIC", "EDUCATIONAL", "TESTIMONIAL", "UGC", "SPONSORED", "HIGH REACH"];

/** Tags suggested only from signals Oriane actually returns for the video. */
export function suggestTags(v: Video): string[] {
  const text = `${v.caption} ${v.transcript ?? ""}`.toLowerCase();
  const t: string[] = [];
  if (v.firstSpeechAt !== null && v.firstSpeechAt <= 1) t.push("HOOK");
  if (/challenge|survive|\btest|tested/.test(text)) t.push("CHALLENGE");
  if (/\bpov\b/.test(text)) t.push("POV");
  if (v.audio.type === "original") t.push("ORIGINAL AUDIO");
  if (v.captionLanguage === "en") t.push("ENGLISH");
  if (v.captionLanguage === "ar" || /[؀-ۿ]/.test(v.caption)) t.push("ARABIC");
  if (/how to|tips|tutorial|explain|step by step/.test(text)) t.push("EDUCATIONAL");
  if (/i tried|honest|review|my experience/.test(text)) t.push("TESTIMONIAL");
  if (v.sponsored || v.likelyBoosted) t.push("SPONSORED");
  else if (v.creator.followers < 250_000) t.push("UGC");
  if ((v.reach ?? 0) >= 3) t.push("HIGH REACH");
  return t;
}

const KEY = "ws-vault-v1";

function read(): Collection[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function write(c: Collection[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
    window.dispatchEvent(new Event("ws-vault"));
  } catch {
    /* storage unavailable (private mode) */
  }
}

export function useVault() {
  const [collections, setCollections] = useState<Collection[]>([]);
  useEffect(() => {
    const sync = () => setCollections(read());
    sync();
    window.addEventListener("ws-vault", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("ws-vault", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const save = useCallback((collectionName: string, v: Video, from: VaultItem["from"]) => {
    const all = read();
    let col = all.find((c) => c.name === collectionName);
    if (!col) {
      col = { id: Math.random().toString(36).slice(2, 10), name: collectionName, createdAt: new Date().toISOString(), items: [] };
      all.unshift(col);
    }
    if (!col.items.some((i) => i.videoId === v.id)) {
      col.items.unshift({
        videoId: v.id,
        url: v.url,
        thumbnail: v.thumbnail,
        platform: v.platform,
        handle: v.creator.handle,
        caption: v.caption.slice(0, 280),
        views: v.views,
        reach: v.reach,
        er: v.er,
        hook: v.hook,
        tags: suggestTags(v),
        note: "",
        savedAt: new Date().toISOString(),
        from,
      });
    }
    write(all);
  }, []);

  const update = useCallback((colId: string, videoId: string, patch: Partial<VaultItem>) => {
    const all = read();
    const col = all.find((c) => c.id === colId);
    const item = col?.items.find((i) => i.videoId === videoId);
    if (item) Object.assign(item, patch);
    write(all);
  }, []);

  const remove = useCallback((colId: string, videoId: string) => {
    const all = read();
    const col = all.find((c) => c.id === colId);
    if (col) col.items = col.items.filter((i) => i.videoId !== videoId);
    write(all.filter((c) => c.items.length > 0));
  }, []);

  const isSaved = useCallback((videoId: string) => collections.some((c) => c.items.some((i) => i.videoId === videoId)), [collections]);

  return { collections, save, update, remove, isSaved };
}
