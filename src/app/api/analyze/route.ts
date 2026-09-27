import { NextResponse } from "next/server";
import { analyzeMarket } from "@/lib/whitespace/analyze";
import { OrianeUnavailableError } from "@/lib/oriane/client";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ error: "Describe a market, brand or audience." }, { status: 400 });
  try {
    return NextResponse.json(await analyzeMarket(q));
  } catch (err) {
    const unavailable = err instanceof OrianeUnavailableError;
    return NextResponse.json(
      { error: unavailable ? "Video intelligence temporarily unavailable." : (err as Error).message },
      { status: unavailable ? 503 : 422 },
    );
  }
}
