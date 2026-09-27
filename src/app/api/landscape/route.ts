import { NextResponse } from "next/server";
import { landscape } from "@/lib/whitespace/landscape";
import { OrianeUnavailableError } from "@/lib/oriane/client";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const q = params.get("q")?.trim();
  const id = params.get("id")?.trim();
  const brands = params.get("brands")?.split(",").map((b) => b.trim()).filter(Boolean);
  if (!q || !id) return NextResponse.json({ error: "Missing query or opportunity id." }, { status: 400 });
  try {
    return NextResponse.json(await landscape(q, id, brands));
  } catch (err) {
    const unavailable = err instanceof OrianeUnavailableError;
    return NextResponse.json({ error: unavailable ? "Video intelligence temporarily unavailable." : (err as Error).message }, { status: unavailable ? 503 : 422 });
  }
}
